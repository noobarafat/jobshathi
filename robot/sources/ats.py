"""Company job boards hosted on applicant-tracking systems (ATS).

One reader per system. Each takes one entry of robot/sources.json and returns
(jobs, info), where info says how many openings the board lists and how they were read.

| System          | What is read                                             | Why it is allowed                                   |
| --------------- | -------------------------------------------------------- | --------------------------------------------------- |
| Lever           | api.lever.co/v0/postings/{company} (public postings API) | robots.txt: "Allow: /", crawl-delay 1               |
| Freshteam       | {company}.freshteam.com/jobs, then each job page's       | robots.txt: "Allow: /jobs"                          |
|                 | schema.org JobPosting block                              |                                                     |
| Trakstar Hire   | jsapi.recruiterbox.com/v1/openings (the board's own feed)| robots.txt: "Allow: /"                              |
| SmartRecruiters | careers.smartrecruiters.com/{company} (the public career | the career site has no robots.txt rules             |
|                 | page), then each job page's schema.org microdata         |                                                     |

SmartRecruiters also has a JSON "Posting API" at api.smartrecruiters.com, but that host's
robots.txt says "User-agent: * / Disallow: /", so the robot does not use it. The public
career pages carry the same posts.

The fetcher checks every host's robots.txt again at run time, so if any of these change
their rules the source simply returns nothing and shows up in the report.
"""
from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from urllib.parse import quote

import normalise as N
import structured as S

log = logging.getLogger("robot.ats")

MAX_LIST_PAGES = 6


def _wanted(place: str, only: list[str] | None) -> bool:
    """A source can be limited to places, e.g. ["Dhaka", "Bangladesh"]."""
    if not only:
        return True
    low = (place or "").lower()
    return any(o.lower() in low for o in only)


def _mode_words(remote=False, hybrid=False) -> str:
    return "Remote" if remote else ("Hybrid" if hybrid else "")


# ── Lever ───────────────────────────────────────────────────────────────────
def lever(fetcher, src: dict, known_ids: set, limit: int):
    company = src["company"]
    rows = fetcher.get(f"https://api.lever.co/v0/postings/{company}?mode=json", as_json=True)
    info = {"how": "public postings API", "listed": 0, "read": 0}
    if not isinstance(rows, list):
        return [], info
    jobs = []
    for p in rows:
        cats = p.get("categories") or {}
        place = N.place_text(*(cats.get("allLocations") or [cats.get("location")]))
        if not _wanted(place, src.get("onlyPlaces")):
            continue
        info["listed"] += 1
        jid = f"lever:{company}:{p.get('id')}"
        if jid in known_ids or len(jobs) >= limit:
            continue
        workplace = N.text_of(p.get("workplaceType")).lower()
        pay = p.get("salaryRange") or {}
        salary = ""
        if pay.get("min") and pay.get("max"):
            salary = f"{pay.get('currency') or ''} {int(pay['min'])} - {int(pay['max'])} {pay.get('interval') or ''}".strip()
        lists = " ".join(f"{N.text_of(l.get('text'))}: {N.text_of(l.get('content'))}" for l in p.get("lists") or [])
        text = " ".join(x for x in (N.text_of(p.get("descriptionPlain")), lists, N.text_of(p.get("additionalPlain"))) if x)
        created = p.get("createdAt")
        jobs.append(N.post(
            id=jid, title=N.text_of(p.get("text")), company=src.get("name") or company,
            cat=N.text_of(cats.get("team") or cats.get("department")),
            loc=", ".join(x for x in (place, _mode_words(workplace == "remote", workplace == "hybrid")) if x),
            type=N.employment_type(cats.get("commitment")), salary=salary,
            req=N.short_req(description=text),
            postedAt=N.iso_date(created / 1000 if isinstance(created, (int, float)) else created),
            source=src.get("label") or "Lever",
            url=N.text_of(p.get("hostedUrl") or p.get("applyUrl")),
            logo=src.get("logo"), site=src.get("site"), text=text,
        ))
        info["read"] += 1
    return jobs, info


# ── Trakstar Hire (formerly Recruiterbox) ───────────────────────────────────
def trakstar(fetcher, src: dict, known_ids: set, limit: int):
    company = src["company"]
    data = fetcher.get(f"https://jsapi.recruiterbox.com/v1/openings?client_name={company}", as_json=True)
    info = {"how": "the board's own openings feed", "listed": 0, "read": 0}
    rows = (data or {}).get("objects") if isinstance(data, dict) else None
    if not isinstance(rows, list):
        return [], info
    jobs = []
    for p in rows:
        loc = p.get("location") or {}
        place = N.place_text(loc.get("city"), loc.get("state"), loc.get("country"))
        if not _wanted(place or "Bangladesh", src.get("onlyPlaces")):
            continue
        info["listed"] += 1
        jid = f"trakstar:{company}:{p.get('id')}"
        if jid in known_ids or len(jobs) >= limit:
            continue
        text = N.text_of(p.get("description"))
        close = p.get("close_date")
        jobs.append(N.post(
            id=jid, title=N.text_of(p.get("title")), company=src.get("name") or N.text_of(p.get("client_name")),
            cat=N.text_of(p.get("team")),
            loc=", ".join(x for x in (N.place_text(loc.get("city"), loc.get("state")), _mode_words(bool(p.get("allows_remote")))) if x),
            type=N.employment_type(p.get("position_type")),
            req=N.short_req(description=text),
            deadline=N.iso_date(close) if close else None,
            source=src.get("label") or "Trakstar Hire",
            url=N.text_of(p.get("hosted_url")) or f"https://{company}.hire.trakstar.com/jobs/{p.get('id')}/",
            logo=src.get("logo"), site=src.get("site"), text=text,
        ))
        info["read"] += 1
    return jobs, info


# ── Freshteam ───────────────────────────────────────────────────────────────
FT_LINK = re.compile(r'href="(/jobs/([A-Za-z0-9_-]{6,})/[^"#?]*)"')


def freshteam(fetcher, src: dict, known_ids: set, limit: int):
    company = src["company"]
    base = f"https://{company}.freshteam.com"
    info = {"how": "career page, then each job page's schema.org data", "listed": 0, "read": 0}
    listing = fetcher.get(f"{base}/jobs")
    if not listing:
        return [], info
    links: dict[str, str] = {}
    for path, jid in FT_LINK.findall(listing):
        links.setdefault(jid, path)
    info["listed"] = len(links)
    jobs = []
    for jid, path in links.items():
        full_id = f"freshteam:{company}:{jid}"
        if full_id in known_ids or len(jobs) >= limit:
            continue
        page = fetcher.get(base + path)
        blocks = S.job_postings(page or "")
        if not blocks:
            continue
        ld = blocks[0]
        title = N.text_of(ld.get("title"))
        if not title:
            continue
        place, remote = S.place_of(ld)
        remote = remote or str(ld.get("remote", "")).lower() == "true"
        if not _wanted(place or "Bangladesh", src.get("onlyPlaces")):
            continue
        text = N.text_of(ld.get("description"))
        jobs.append(N.post(
            id=full_id, title=title,
            company=src.get("name") or S.first(ld, "hiringOrganization", "name"),
            cat=ld.get("occupationalCategory") or ld.get("industry"),
            loc=", ".join(x for x in (place, _mode_words(remote)) if x),
            type=N.employment_type(ld.get("employmentType")), salary=S.salary_of(ld),
            req=N.short_req(skills=ld.get("skills") or "", description=text),
            postedAt=N.iso_date(ld.get("datePosted")), deadline=N.iso_date(ld.get("validThrough")),
            source=src.get("label") or "Freshteam",
            url=base + path,
            logo=S.first(ld, "hiringOrganization", "logo") or src.get("logo"), site=src.get("site"), text=text,
        ))
        info["read"] += 1
    return jobs, info


# ── SmartRecruiters (public career pages) ───────────────────────────────────
def _meta(page: str, prop: str) -> str:
    m = re.search(r'<meta[^>]*itemprop="%s"[^>]*content="([^"]*)"' % re.escape(prop), page)
    return N.text_of(m.group(1)) if m else ""


def _block(page: str, prop: str) -> str:
    """The text of the element that carries itemprop=prop (a <div> section or a short tag)."""
    m = re.search(r'<(div|li|h1|span|p)\b[^>]*itemprop="%s"[^>]*>' % re.escape(prop), page)
    if not m:
        return ""
    tag, start = m.group(1), m.end()
    depth, pos = 1, start
    step = re.compile(r"<(/?)%s\b[^>]*>" % tag)
    while depth and pos < len(page):
        n = step.search(page, pos)
        if not n:
            return N.text_of(page[start:start + 6000])
        depth += -1 if n.group(1) else 1
        pos = n.end()
        if not depth:
            return N.text_of(page[start:n.start()])
    return ""


def smartrecruiters_job(page: str, url: str, src: dict) -> dict | None:
    """One job page -> one post. Reads the schema.org JobPosting microdata the page publishes."""
    title = _block(page, "title")
    if not title:
        return None
    m = re.search(r"/(\d{6,})(?:-|$)", url)
    ident = m.group(1) if m else url.rstrip("/").rsplit("/", 1)[-1]
    workplace = (re.search(r'workplaceType="([^"]*)"', page) or [None, ""])[1].lower()
    place = N.place_text(_meta(page, "addressLocality"), _meta(page, "addressRegion"), _meta(page, "addressCountry"))
    text = " ".join(x for x in (_block(page, "responsibilities"), _block(page, "qualifications"), _block(page, "incentives")) if x)
    return N.post(
        id=f"smartrecruiters:{src['company']}:{ident}", title=title,
        company=src.get("name") or _meta(page, "name"),
        cat=_meta(page, "industry"),
        loc=", ".join(x for x in (N.place_text(_meta(page, "addressLocality"), _meta(page, "addressRegion")),
                                  _mode_words(workplace == "remote", workplace == "hybrid")) if x) or place,
        type=N.employment_type(_block(page, "employmentType")),
        req=N.short_req(description=text),
        postedAt=N.iso_date(_meta(page, "datePosted")),
        source=src.get("label") or "SmartRecruiters",
        url=url, logo=_meta(page, "logo") or src.get("logo"), site=src.get("site"), text=text,
    )


def smartrecruiters(fetcher, src: dict, known_ids: set, limit: int):
    company = src["company"]
    base = f"https://careers.smartrecruiters.com/{company}/api/more"
    info = {"how": "public career page, then each job page's schema.org data", "listed": 0, "read": 0}
    link = re.compile(r'href="(https://jobs\.smartrecruiters\.com/%s/(\d+)[^"#?]*)"' % re.escape(company), re.I)
    where = src.get("location")            # e.g. "Dhaka, BD": the board's own location filter
    links: dict[str, str] = {}
    for page_no in range(MAX_LIST_PAGES):
        query = f"type=location&value={quote(where)}&page={page_no}" if where else f"page={page_no}"
        html = fetcher.get(f"{base}?{query}")
        found = link.findall(html or "")
        new = [(u, i) for u, i in found if i not in links]
        if not new:
            break
        for u, i in new:
            links[i] = u
    info["listed"] = len(links)
    jobs = []
    for ident, url in links.items():
        if f"smartrecruiters:{company}:{ident}" in known_ids or len(jobs) >= limit:
            continue
        page = fetcher.get(url)
        if not page:
            continue
        try:
            job = smartrecruiters_job(page, url, src)
        except Exception as e:                       # one odd page must not stop the source
            log.warning("could not read %s: %s", url, e)
            continue
        if job and _wanted(job.get("loc") or _meta(page, "addressCountry") or "Bangladesh", src.get("onlyPlaces")):
            jobs.append(job)
            info["read"] += 1
    return jobs, info


READERS = {"lever": lever, "trakstar": trakstar, "freshteam": freshteam, "smartrecruiters": smartrecruiters}


def collect_one(fetcher, src: dict, known_ids=None, limit: int = 40):
    """One sources.json entry -> (jobs, info). Never raises: a failure is reported in info."""
    reader = READERS.get(src.get("type"))
    if not reader:
        return [], {"how": "", "listed": 0, "read": 0, "error": f"unknown type {src.get('type')}"}
    try:
        jobs, info = reader(fetcher, src, known_ids or set(), limit)
    except Exception as e:
        log.exception("%s failed", src.get("id"))
        return [], {"how": "", "listed": 0, "read": 0, "error": f"{type(e).__name__}: {e}"}
    log.info("%s: %d listed, %d read", src.get("id"), info.get("listed", 0), len(jobs))
    return [stamp(j) for j in jobs], info


def stamp(job: dict) -> dict:
    """Posts with no date of their own count as posted today (first seen)."""
    if not job.get("postedAt"):
        job["postedAt"] = datetime.now(timezone.utc).date().isoformat()
    return job
