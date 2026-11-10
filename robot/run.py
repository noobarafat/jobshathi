#!/usr/bin/env python3
"""The JobShathi job robot.

Collects today's posts from the sources that allow it, merges them with what
jobs.json already holds, throws out what has expired, and writes:

  jobs.json          what the site reads   { "updatedAt": ..., "jobs": [ ... ] }
  robot/report.json  how the run went, and what the matcher could not classify

Run from the repository root:  python3 robot/run.py
"""
from __future__ import annotations

import argparse
import json
import logging
import pathlib
import re
import sys
import unicodedata
from datetime import datetime, timedelta, timezone

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))

import normalise as N                                    # noqa: E402
from fetcher import Fetcher                              # noqa: E402
from sources import alljobs, company_pages, nextjobz, remote_boards   # noqa: E402

DHAKA = timezone(timedelta(hours=6))
KEEP_DAYS = 30
MAX_BYTES = 3 * 1024 * 1024
JOBS_FILE = ROOT / "jobs.json"
REPORT_FILE = HERE / "report.json"

log = logging.getLogger("robot")


# ── the same two helpers engine.js uses, so the robot dedupes exactly as the site does ──
BN = "০১২৩৪৫৬৭৮৯"


def norm(s) -> str:
    s = "" if s is None else str(s)
    s = unicodedata.normalize("NFC", s).lower()
    s = "".join(str(BN.index(c)) if c in BN else c for c in s)
    s = re.sub(r"[’‘`]", "'", s)
    s = re.sub(r"[–—]", "-", s)
    return re.sub(r"\s+", " ", s).strip()


def norm_title(s) -> str:
    t = re.sub(r"[()\[\],:|/\-]+", " ", norm(s))
    t = re.sub(r"\.(?=\s|$)", "", t)
    return re.sub(r"\s+", " ", t).strip()


SUFFIXES = re.compile(r"\b(ltd|limited|pvt|private|plc|inc|incorporated|co|company|corp|corporation|group|bd|bangladesh)\b")


def norm_company(s) -> str:
    c = SUFFIXES.sub(" ", norm(s))
    return re.sub(r"[^a-z0-9\u0980-\u09FF]+", "", c)


def dedupe_key(job: dict) -> str:
    """Stricter than engine.js on purpose.

    The engine keeps its own rule for what the reader sees; here the goal is that
    "Shapla Agro Foods Ltd." and "Shapla Agro Foods Ltd" never both sit in jobs.json.
    """
    title = re.sub(r"[^a-z0-9\u0980-\u09FF]+", "", norm_title(job.get("title")))
    return title + "|" + norm_company(job.get("company"))


# ── the file the site reads ──
def read_jobs() -> list[dict]:
    if not JOBS_FILE.exists():
        return []
    try:
        data = json.loads(JOBS_FILE.read_text(encoding="utf-8"))
    except ValueError as e:
        log.warning("jobs.json unreadable (%s), starting fresh", e)
        return []
    rows = data.get("jobs") if isinstance(data, dict) else data
    return [r for r in (rows or []) if isinstance(r, dict) and r.get("title")]


def days_old(job: dict, today) -> int | None:
    d = N.iso_date(job.get("postedAt"))
    if not d:
        return None
    return (today - datetime.fromisoformat(d).date()).days


def clean(jobs: list[dict], today) -> tuple[list[dict], dict]:
    """Expired, stale, money-asking and repeated posts out. One post per job."""
    counts = {"expired": 0, "too_old": 0, "asks_for_money": 0, "merged": 0, "no_title": 0}
    kept: dict[str, dict] = {}
    order: list[str] = []

    for job in jobs:
        if not job.get("title"):
            counts["no_title"] += 1
            continue
        deadline = N.iso_date(job.get("deadline"))
        if deadline and datetime.fromisoformat(deadline).date() < today:
            counts["expired"] += 1
            continue
        age = days_old(job, today)
        if age is not None and age > KEEP_DAYS:
            counts["too_old"] += 1
            continue
        if N.is_scam(job.get("req", ""), job.get("title", ""), job.get("salary", "")):
            counts["asks_for_money"] += 1
            log.info("left out (asks candidates for money): %s at %s",
                     job.get("title"), job.get("company"))
            continue

        key = dedupe_key(job)
        if key in kept:
            first = kept[key]
            other = job.get("source")
            if other and other != first.get("source"):
                also = first.setdefault("alsoOn", [])
                if other not in also:
                    also.append(other)          # both sources' links are kept
            for field in ("salary", "exp", "edu", "age", "loc", "logo", "site", "deadline", "req"):
                if not first.get(field) and job.get(field):
                    first[field] = job[field]
            counts["merged"] += 1
            continue
        kept[key] = dict(job)
        order.append(key)

    out = [kept[k] for k in order]
    out.sort(key=lambda j: (N.iso_date(j.get("postedAt")) or "0000-00-00"), reverse=True)
    return out, counts


def fit_size(jobs: list[dict], payload_for) -> tuple[list[dict], int]:
    """jobs.json stays under the size cap; the oldest posts go first."""
    dropped = 0
    while len(json.dumps(payload_for(jobs), ensure_ascii=False).encode()) > MAX_BYTES and len(jobs) > 1:
        jobs.pop()
        dropped += 1
    return jobs, dropped


def main() -> int:
    ap = argparse.ArgumentParser(description="Collect today's jobs into jobs.json")
    ap.add_argument("--limit", type=int, default=300, help="new pages per source this run")
    ap.add_argument("--only", help="run one source: nextjobz, alljobs, remote, companies")
    ap.add_argument("--dry-run", action="store_true", help="do not write jobs.json")
    args = ap.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    started = datetime.now(DHAKA)
    today = started.date()

    existing = read_jobs()
    known = {j["id"] for j in existing if j.get("id")}
    log.info("jobs.json holds %d posts", len(existing))

    fetcher = Fetcher()
    districts = alljobs.districts_from((ROOT / "src" / "locations.js").read_text(encoding="utf-8"))

    plan = {
        "nextjobz": lambda: nextjobz.collect(fetcher, known, limit=args.limit),
        "alljobs": lambda: alljobs.collect(fetcher, known, districts, limit=args.limit),
        "remote": lambda: remote_boards.collect(fetcher, known),
        "companies": lambda: company_pages.collect(fetcher, known, str(ROOT / "robot" / "companies.json")),
    }
    if args.only:
        plan = {k: v for k, v in plan.items() if k == args.only}

    fresh, per_source, failures = [], {}, {}
    for name, run_source in plan.items():
        try:
            got = run_source()
            fresh.extend(got)
            per_source[name] = len(got)
        except Exception as e:                       # one broken site never stops the run
            per_source[name] = 0
            failures[name] = f"{type(e).__name__}: {e}"
            log.exception("%s failed, carrying on with the others", name)

    merged, counts = clean(existing + fresh, today)

    def payload_for(rows):
        return {"updatedAt": started.isoformat(timespec="seconds"),
                "count": len(rows), "jobs": rows}

    merged, over_size = fit_size(merged, payload_for)
    payload = payload_for(merged)

    by_source: dict[str, int] = {}
    for j in merged:
        by_source[j.get("source") or "unknown"] = by_source.get(j.get("source") or "unknown", 0) + 1

    report = {
        "run": {
            "startedAt": started.isoformat(timespec="seconds"),
            "finishedAt": datetime.now(DHAKA).isoformat(timespec="seconds"),
            "newPostsCollected": len(fresh),
            "postsInFile": len(merged),
            "fileBytes": len(json.dumps(payload, ensure_ascii=False).encode()),
        },
        "collectedPerSource": per_source,
        "postsInFilePerSource": by_source,
        "removed": {**counts, "over_size_limit": over_size},
        "sourceFailures": failures,
        "pagesRead": fetcher.pages_read(),
        "blockedByRobotsTxt": fetcher.blocked[:20],
        "requestsFailed": fetcher.failed[:20],
    }

    if args.dry_run:
        log.info("dry run: jobs.json not written")
    else:
        JOBS_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        log.info("wrote %s with %d posts", JOBS_FILE.name, len(merged))
    REPORT_FILE.write_text(json.dumps(report, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    log.info("per source: %s", per_source)
    log.info("removed: %s", report["removed"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
