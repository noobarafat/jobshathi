"""Company career pages listed in robot/companies.json.

Only pages that publish schema.org JobPosting data are read. That keeps this source
honest: no guessing at page layouts, and a company that publishes nothing structured
is simply skipped and counted in report.json.

`careers` is optional. With only a website, a few usual paths are tried.
Every host's robots.txt is still checked by the fetcher before any request.
"""
from __future__ import annotations

import json
import logging
import pathlib
import re
from urllib.parse import urljoin, urlparse

import normalise as N
import structured as S

NAME = "Company site"
GUESSES = ("careers", "career", "jobs", "career/", "careers/jobs", "about/careers")
MAX_PER_COMPANY = 40

log = logging.getLogger("robot.companies")


def load(path="robot/companies.json") -> list[dict]:
    p = pathlib.Path(path)
    if not p.exists():
        log.info("no companies.json, skipping company pages")
        return []
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except ValueError as e:
        log.warning("companies.json is not valid JSON: %s", e)
        return []
    rows = data.get("companies") if isinstance(data, dict) else data
    return [r for r in (rows or []) if isinstance(r, dict) and r.get("website")]


def _candidates(row: dict) -> list[str]:
    site = row["website"].rstrip("/")
    if not site.startswith("http"):
        site = "https://" + site
    if row.get("careers"):
        return [row["careers"]]
    return [urljoin(site + "/", g) for g in GUESSES]


def _one(ld: dict, row: dict, page_url: str) -> dict | None:
    title = N.text_of(ld.get("title"))
    if not title:
        return None
    loc, remote = S.place_of(ld)
    company = S.first(ld, "hiringOrganization", "name") or N.text_of(row.get("name"))
    desc = ld.get("description") or ""
    quals = ld.get("qualifications") or ""
    req = N.short_req(skills=ld.get("skills") or "", description=desc, qualifications=quals)
    if N.is_scam(req, desc, title):
        return None
    ident = S.first(ld, "identifier", "value") or re.sub(r"\W+", "-", f"{company}-{title}".lower())[:60]
    return N.post(
        id=f"company:{ident}",
        title=title, company=company,
        cat=ld.get("occupationalCategory") or ld.get("industry") or N.text_of(row.get("cat")),
        loc=loc or ("Remote" if remote else N.text_of(row.get("loc"))),
        type=N.employment_type(ld.get("employmentType")),
        salary=S.salary_of(ld),
        exp=N.experience_text(S.first(ld, "experienceRequirements", "monthsOfExperience")),
        edu=N.text_of(ld.get("educationRequirements")) or quals,
        req=req,
        postedAt=N.iso_date(ld.get("datePosted")),
        deadline=N.iso_date(ld.get("validThrough")),
        source=N.text_of(row.get("name")) or urlparse(page_url).netloc,
        url=N.text_of(ld.get("url")) or page_url,
        logo=S.first(ld, "hiringOrganization", "logo") or N.text_of(row.get("logo")),
        site=row.get("website"),
    )


def collect(fetcher, known_ids=None, companies_path="robot/companies.json"):
    rows = load(companies_path)
    jobs, tried, worked = [], 0, []
    for row in rows:
        found_here = 0
        for url in _candidates(row):
            tried += 1
            page = fetcher.get(url)
            if not page:
                continue
            blocks = S.job_postings(page)
            if not blocks:
                continue
            for ld in blocks[:MAX_PER_COMPANY]:
                try:
                    job = _one(ld, row, url)
                except Exception as e:
                    log.warning("%s: %s", url, e)
                    continue
                if job:
                    jobs.append(job)
                    found_here += 1
            if found_here:
                worked.append(f"{row.get('name')} ({url})")
                break                      # this company's careers page is found
        if not found_here:
            log.info("no structured job data for %s", row.get("name") or row.get("website"))
    log.info("company pages: %d posts from %d companies (%d pages tried)",
             len(jobs), len(worked), tried)
    return jobs
