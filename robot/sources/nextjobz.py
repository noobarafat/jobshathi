"""NextJobz (nextjobz.com.bd).

robots.txt allows the job detail pages and the sitemaps, and disallows /search,
/job-search and /api/ (except /api/Document/DownloadFile, which serves the logos).
So: read sitemap-job-details.xml, then each job page, and take the schema.org
JobPosting block the page publishes.

Pages already in jobs.json are not fetched again unless they are new to us, which
keeps the daily run small.
"""
from __future__ import annotations

import logging
import re

import normalise as N
import structured as S

NAME = "NextJobz"
BASE = "https://nextjobz.com.bd"
SITEMAP = f"{BASE}/sitemap-job-details.xml"
NEW_PER_RUN = 300

log = logging.getLogger("robot.nextjobz")

URL_ENTRY = re.compile(r"<url>\s*<loc>([^<]+)</loc>(?:\s*<lastmod>([^<]+)</lastmod>)?", re.I | re.S)
ID_IN_URL = re.compile(r"-((?:IJOB|XKU)[A-Za-z0-9]+)/?$")

VACANCY = re.compile(r"Vacanc(?:y|ies)\s*([0-9০-৯]{1,4})", re.I)
PAY = re.compile(r"((?:Tk\.?|BDT|৳)\s*[0-9০-৯][0-9০-৯,\s\-–to]{2,30}"
                 r"|Negotiable|আলোচনা সাপেক্ষে)", re.I)
YEARS = re.compile(r"([0-9০-৯]{1,2}\s*(?:to|-|–)\s*[0-9০-৯]{1,2}\s*\+?\s*(?:years?|yrs?)"
                   r"|[0-9০-৯]{1,2}\s*\+\s*(?:years?|yrs?)"
                   r"|[0-9০-৯]{1,2}\s*(?:years?|yrs?|months?))", re.I)
HEAD_END = re.compile(r"Job Description|Requirements\b", re.I)


def _header(page: str) -> str:
    """Only the job's own header block.

    The rest of the page carries "related jobs" cards with their own deadlines and
    salaries, so reading the whole page would attach another post's numbers to this
    one. The header ends where the description begins.
    """
    body = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", " ", page)
    body = N.text_of(body)
    cut = HEAD_END.search(body)
    return body[:cut.start()] if cut and cut.start() > 60 else body[:1200]


def _one(page: str, url: str) -> dict | None:
    blocks = S.job_postings(page)
    if not blocks:
        return None
    ld = blocks[0]
    title = N.text_of(ld.get("title"))
    if not title:
        return None

    head = _header(page)
    loc, remote = S.place_of(ld)

    ident = S.first(ld, "identifier", "value")
    if not ident:
        m = ID_IN_URL.search(url)
        ident = m.group(1) if m else url.rsplit("/", 1)[-1]

    salary = S.salary_of(ld)
    if not salary:
        hit = PAY.search(head)
        salary = N.text_of(hit.group(1)) if hit else ""

    vac = VACANCY.search(head)
    vacancies = None
    if vac and N.digits(vac.group(1)).isdigit():
        vacancies = int(N.digits(vac.group(1)))

    years = YEARS.search(head)          # "2-3 years" is richer than "24 months"
    desc = ld.get("description") or ""
    quals = ld.get("qualifications") or ""
    req = N.short_req(skills=ld.get("skills") or "", description=desc, qualifications=quals)

    if N.is_scam(req, desc, title, salary):
        log.info("skipped (asks candidates for money): %s", url)
        return None

    return N.post(
        id=f"nextjobz:{ident}",
        title=title,
        company=S.first(ld, "hiringOrganization", "name"),
        cat=ld.get("occupationalCategory") or ld.get("industry"),
        loc=loc or ("Remote" if remote else ""),
        type=N.employment_type(ld.get("employmentType")),
        salary=salary,
        exp=N.experience_text(S.first(ld, "experienceRequirements", "monthsOfExperience"),
                              years.group(1) if years else ""),
        edu=N.text_of(ld.get("educationRequirements")) or quals,
        req=req,
        postedAt=N.iso_date(ld.get("datePosted")),
        # validThrough is this post's own date. Never read a deadline off the page text:
        # the related-jobs cards carry other posts' deadlines.
        deadline=N.iso_date(ld.get("validThrough")),
        vacancies=vacancies,
        source=NAME,
        url=N.text_of(ld.get("url")) or url,
        logo=S.first(ld, "hiringOrganization", "logo"),
        site=S.first(ld, "hiringOrganization", "url"),
    )


def collect(fetcher, known_ids=None, limit: int = NEW_PER_RUN) -> list[dict]:
    known_ids = known_ids or set()
    xml = fetcher.get(SITEMAP)
    if not xml:
        log.warning("sitemap unavailable, nothing collected")
        return []

    entries = [(u, (lm or "").strip()) for u, lm in URL_ENTRY.findall(xml)]
    entries.sort(key=lambda e: e[1], reverse=True)       # newest first
    log.info("sitemap lists %d job pages", len(entries))

    jobs, looked = [], 0
    for url, _lastmod in entries:
        m = ID_IN_URL.search(url)
        if m and f"nextjobz:{m.group(1)}" in known_ids:
            continue                                      # already in jobs.json
        if looked >= limit:
            log.info("stopping at %d new pages this run", limit)
            break
        looked += 1
        page = fetcher.get(url)
        if not page:
            continue
        try:
            job = _one(page, url)
        except Exception as e:                            # one odd page must not stop the source
            log.warning("could not read %s: %s", url, e)
            continue
        if job:
            jobs.append(job)
    log.info("%s: %d posts from %d pages read", NAME, len(jobs), looked)
    return jobs
