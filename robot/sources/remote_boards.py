"""Remote job boards with public feeds: Jobicy, Remote OK and Himalayas.

Each one asks to be credited with a link back to the original post, which the site
already does: every card shows `source` and opens `url`.

Only entry-level or junior roles that are open to Bangladesh or to the whole world
are kept, because that is who JobShathi is for. Remotive is deliberately not here:
its terms ask that its jobs are not passed to other job sites.
"""
from __future__ import annotations

import logging
import re

import normalise as N

log = logging.getLogger("robot.remote")

JUNIOR = re.compile(r"\b(junior|jr\.?|entry[\s-]?level|intern(ship)?|trainee|graduate|apprentice|associate|assistant)\b", re.I)
SENIOR = re.compile(r"\b(senior|sr\.?|lead|principal|staff|head of|director|vp|chief|manager|architect|expert|expert[\s-]?level|iii|iv)\b", re.I)
OPEN_TO_BD = re.compile(r"\b(worldwide|anywhere|global|remote|asia|south asia|apac|bangladesh|any ?where in the world)\b", re.I)
REGION_LOCKED = re.compile(r"\b(only|must reside|must be based|authorized to work|eligible to work)\b", re.I)


def _is_entry_level(title: str, seniority: str) -> bool:
    blob = f"{title} {seniority}"
    if SENIOR.search(blob):
        return False
    return bool(JUNIOR.search(blob) or re.search(r"\b(entry|0-2|1-2)\b", seniority or "", re.I))


def _open_to_bangladesh(where: str) -> bool:
    w = N.text_of(where)
    if not w:
        return True                       # a board of remote jobs with nothing stated
    if re.search(r"bangladesh|worldwide|anywhere|global", w, re.I):
        return True
    # "United States only", "EMEA", "Europe" and the like are not open to Bangladesh
    if re.search(r"\b(usa?|united states|canada|uk|united kingdom|europe|emea|latam|americas|australia|germany|france|india only)\b", w, re.I):
        return False
    return bool(OPEN_TO_BD.search(w)) and not REGION_LOCKED.search(w)


def _keep(title: str, seniority: str, where: str) -> bool:
    return _is_entry_level(title, seniority) and _open_to_bangladesh(where)


def _listify(v) -> str:
    if isinstance(v, (list, tuple)):
        return ", ".join(str(x) for x in v if x)
    return N.text_of(v)


def _salary(lo, hi, currency="USD") -> str:
    try:
        lo, hi = (int(float(lo)) if lo else 0), (int(float(hi)) if hi else 0)
    except (TypeError, ValueError):
        return ""
    if lo and hi and lo != hi:
        return f"{currency} {lo} - {hi}"
    one = lo or hi
    return f"{currency} {one}" if one else ""


# ── Jobicy ──────────────────────────────────────────────────────────────────
def jobicy(fetcher, known_ids=None):
    data = fetcher.get("https://jobicy.com/api/jobs?count=100", as_json=True)
    rows = (data or {}).get("jobs") if isinstance(data, dict) else data
    out = []
    for j in rows or []:
        title = N.text_of(j.get("jobTitle") or j.get("title"))
        where = _listify(j.get("jobGeo") or j.get("geo") or j.get("location"))
        level = _listify(j.get("jobLevel") or j.get("seniority"))
        if not title or not _keep(title, level, where):
            continue
        desc = j.get("jobExcerpt") or j.get("jobDescription") or ""
        out.append(N.post(
            id=f"jobicy:{j.get('id') or j.get('jobSlug') or title}",
            title=title, company=N.text_of(j.get("companyName")),
            cat=_listify(j.get("jobIndustry")), loc=f"Remote ({where})" if where else "Remote",
            type=N.employment_type(_listify(j.get("jobType"))),
            salary=_salary(j.get("annualSalaryMin"), j.get("annualSalaryMax"),
                           N.text_of(j.get("salaryCurrency")) or "USD"),
            exp=level, req=N.short_req(skills=_listify(j.get("jobIndustry")), description=desc),
            postedAt=N.iso_date(j.get("pubDate")), source="Jobicy",
            url=N.text_of(j.get("url")), logo=N.text_of(j.get("companyLogo")),
        ))
    log.info("Jobicy: %d entry-level posts open to Bangladesh", len(out))
    return out


# ── Remote OK ───────────────────────────────────────────────────────────────
def remoteok(fetcher, known_ids=None):
    rows = fetcher.get("https://remoteok.com/api", as_json=True)
    out = []
    for j in rows or []:
        if not isinstance(j, dict) or j.get("legal"):      # first entry is the legal notice
            continue
        title = N.text_of(j.get("position") or j.get("title"))
        where = _listify(j.get("location"))
        if not title or not _keep(title, "", where):
            continue
        out.append(N.post(
            id=f"remoteok:{j.get('id') or j.get('slug')}",
            title=title, company=N.text_of(j.get("company")),
            cat=_listify(j.get("tags"))[:60], loc=f"Remote ({where})" if where else "Remote",
            type="Full-time",
            salary=_salary(j.get("salary_min"), j.get("salary_max")),
            req=N.short_req(skills=_listify(j.get("tags")), description=j.get("description") or ""),
            postedAt=N.iso_date(j.get("date") or j.get("epoch")), source="Remote OK",
            url=N.text_of(j.get("url") or j.get("apply_url")),
            logo=N.text_of(j.get("company_logo") or j.get("logo")),
        ))
    log.info("Remote OK: %d entry-level posts open to Bangladesh", len(out))
    return out


# ── Himalayas ───────────────────────────────────────────────────────────────
def himalayas(fetcher, known_ids=None):
    data = fetcher.get("https://himalayas.app/jobs/api?limit=100", as_json=True)
    rows = (data or {}).get("jobs") if isinstance(data, dict) else data
    out = []
    for j in rows or []:
        title = N.text_of(j.get("title"))
        where = _listify(j.get("locationRestrictions"))
        level = N.text_of(j.get("seniority")) or _listify(j.get("seniority"))
        if not title or not _keep(title, level, where):
            continue
        out.append(N.post(
            id=f"himalayas:{j.get('guid') or title}",
            title=title, company=N.text_of(j.get("companyName")),
            cat=_listify(j.get("categories")), loc=f"Remote ({where})" if where else "Remote",
            type=N.employment_type(j.get("employmentType")),
            salary=_salary(j.get("minSalary"), j.get("maxSalary"), N.text_of(j.get("currency")) or "USD"),
            exp=level, req=N.short_req(skills=_listify(j.get("categories")),
                                       description=j.get("excerpt") or j.get("description") or ""),
            postedAt=N.iso_date(j.get("pubDate")), deadline=N.iso_date(j.get("expiryDate")),
            source="Himalayas", url=N.text_of(j.get("applicationLink")),
            logo=N.text_of(j.get("companyLogo")),
        ))
    log.info("Himalayas: %d entry-level posts open to Bangladesh", len(out))
    return out


BOARDS = (("Jobicy", jobicy), ("Remote OK", remoteok), ("Himalayas", himalayas))


def collect(fetcher, known_ids=None):
    jobs = []
    for name, fn in BOARDS:
        try:
            jobs.extend(fn(fetcher, known_ids))
        except Exception as e:                 # one board must never stop the others
            log.warning("%s failed: %s", name, e)
    return jobs
