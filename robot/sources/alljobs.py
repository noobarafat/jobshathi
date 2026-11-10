"""Alljobs by Teletalk (alljobs.teletalk.com.bd): Bangladesh government jobs.

The site has no robots.txt and no sitemap (both paths answer with the app's HTML),
so nothing is disallowed, but the pages are rendered in the browser. The listings
come from its public JSON API instead.

That API is the site's own and is not documented for reuse, so every field is read
defensively and any change there shows up as "alljobs: 0 posts" in report.json
rather than stopping the run.

Calls per run: 2 list pages, plus one detail call per job we have not seen before.
"""
from __future__ import annotations

import logging
import re

import normalise as N

NAME = "Alljobs (Teletalk)"
BASE = "https://alljobs.teletalk.com.bd"
ORG_LIST = BASE + "/api/v1/govt-jobs/org-list?page={page}&limit=20"
DETAIL = BASE + "/api/v1/govt-jobs/public-details?id={id}"
MEDIA = BASE + "/media/"
MAX_PAGES = 12
NEW_PER_RUN = 300

log = logging.getLogger("robot.alljobs")


def districts_from(locations_js: str) -> list[str]:
    """District names out of src/locations.js, so an organisation's name can place it."""
    m = re.search(r"const DIVISIONS\s*=\s*\{(.*?)\n\};", locations_js, re.S)
    if not m:
        return []
    # both quote styles: 'Dhaka' and "Cox's Bazar"
    pairs = re.findall(r"'([^']*)'|\"([^\"]*)\"", m.group(1))
    names = {a or b for a, b in pairs if (a or b)}
    return sorted(names, key=len, reverse=True)


def _place(org_name: str, districts: list[str]) -> str:
    """Only a district the organisation's own name states. Nothing is guessed."""
    low = (org_name or "").lower()
    for d in districts:
        if re.search(r"\b" + re.escape(d.lower()) + r"\b", low):
            return d
    return ""


def _one(d: dict, districts: list[str]) -> dict | None:
    title = N.text_of(d.get("job_title") or d.get("job_title_bn"))
    if not title:
        return None
    org = d.get("job_utilities_govtorganization") or {}
    org_name = N.text_of(org.get("name") or org.get("short_name"))

    lo, hi = d.get("min_age"), d.get("max_age")
    age = ""
    if lo and hi:
        age = f"{lo} to {hi}"
    elif hi:
        age = f"maximum {hi}"
    elif lo:
        age = f"minimum {lo}"

    vac = N.digits(N.text_of(d.get("vacancy")))
    logo = N.text_of(org.get("logo"))
    job_id = N.text_of(d.get("job_id")) or f"GJOB{d.get('id')}"

    return N.post(
        id=f"alljobs:{job_id}",
        title=title,
        company=org_name,
        cat="Government",
        loc=_place(org_name, districts),
        type="Full-time",
        age=age,
        # Government circulars carry their requirements in a PDF advertisement, so
        # there is no requirement text to read. The title and category still match.
        req="",
        postedAt=N.iso_date(d.get("published_date")),
        deadline=N.iso_date(d.get("deadline_date")),
        vacancies=int(vac) if vac.isdigit() and int(vac) > 0 else None,
        source=NAME,
        url=f"{BASE}/jobs/government/{org.get('id')}?jobId={d.get('id')}",
        logo=(MEDIA + logo) if logo else "",
        site=N.text_of(org.get("website")),
    )


def collect(fetcher, known_ids=None, districts=None, limit: int = NEW_PER_RUN) -> list[dict]:
    known_ids, districts = known_ids or set(), districts or []
    wanted: list[int] = []

    for page in range(1, MAX_PAGES + 1):
        data = fetcher.get(ORG_LIST.format(page=page), as_json=True)
        orgs = (data or {}).get("govtOrgJobs")
        if not orgs:
            break
        for org in orgs:
            for job in org.get("govt_jobs") or []:
                jid = job.get("id")
                if jid is not None and f"alljobs:GJOB{jid}" not in known_ids:
                    wanted.append(jid)
        if len(orgs) < 20:
            break

    log.info("%s: %d jobs not yet in jobs.json", NAME, len(wanted))
    jobs = []
    for jid in wanted[:limit]:
        data = fetcher.get(DETAIL.format(id=jid), as_json=True)
        d = (data or {}).get("details")
        if not isinstance(d, dict):
            continue
        try:
            job = _one(d, districts)
        except Exception as e:
            log.warning("could not read job %s: %s", jid, e)
            continue
        if job:
            jobs.append(job)
    log.info("%s: %d posts", NAME, len(jobs))
    return jobs
