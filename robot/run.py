#!/usr/bin/env python3
"""The JobShathi job robot.

Collects today's posts from the sources switched on in robot/sources.json, merges them
with what jobs.json already holds, throws out what has expired, and writes:

  jobs.json          what the site reads   { "updatedAt": ..., "jobs": [ ... ] }
  robot/report.json  how the run went, and what the matcher could not classify

What a run does, in order:
  1. Collect from each source. A source that fails is logged and the run carries on.
  2. Company boards: a post the board no longer lists is removed (the job is closed).
     A source switched off in sources.json has its posts removed.
  3. Keywords: the site's own dictionary reads each new post's full text and keeps the
     skills it finds. The text itself is never written to a file.
  4. Places: a government post with no place gets one only from robot/org-places.json
     or from a place the organisation's own name states. Nothing is guessed.
  5. AI (optional, OFF unless "ai": {"enabled": true} in sources.json).
  6. Clean: expired, too old, no apply link, asks candidates for money, repeated posts.

Run from the repository root:  python3 robot/run.py
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import pathlib
import re
import subprocess
import sys
import unicodedata
from datetime import datetime, timedelta, timezone

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))

import normalise as N                                    # noqa: E402
from sources import alljobs, ats, company_pages, nextjobz, remote_boards   # noqa: E402

DHAKA = timezone(timedelta(hours=6))
KEEP_DAYS = 30
MAX_BYTES = 3 * 1024 * 1024
JOBS_FILE = ROOT / "jobs.json"
REPORT_FILE = HERE / "report.json"
SOURCES_FILE = HERE / "sources.json"
ORG_PLACES_FILE = HERE / "org-places.json"

# The four original sources: how the ids of their posts begin.
BUILT_IN = {
    "nextjobz": ("nextjobz:",),
    "alljobs": ("alljobs:",),
    "remote_boards": ("jobicy:", "remoteok:", "himalayas:"),
    "company_pages": ("company:",),
}
DEFAULT_SOURCES = [
    {"id": "nextjobz", "type": "nextjobz", "enabled": True},
    {"id": "alljobs", "type": "alljobs", "enabled": True},
    {"id": "remote", "type": "remote_boards", "enabled": True},
    {"id": "companies", "type": "company_pages", "enabled": True},
]

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
    return re.sub(r"[^a-z0-9ঀ-৿]+", "", c)


def dedupe_key(job: dict) -> str:
    """Stricter than engine.js on purpose.

    The engine keeps its own rule for what the reader sees; here the goal is that
    "Shapla Agro Foods Ltd." and "Shapla Agro Foods Ltd" never both sit in jobs.json.
    """
    title = re.sub(r"[^a-z0-9ঀ-৿]+", "", norm_title(job.get("title")))
    return title + "|" + norm_company(job.get("company"))


# ── sources.json ──
def load_config(path: pathlib.Path = SOURCES_FILE) -> dict:
    """sources.json, or the four original sources when the file is missing or broken."""
    try:
        cfg = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(cfg.get("sources"), list):
            raise ValueError("no 'sources' list")
    except (OSError, ValueError, AttributeError) as e:
        log.warning("sources.json not usable (%s): using the built-in sources", e)
        cfg = {"sources": [dict(s) for s in DEFAULT_SOURCES]}
    cfg.setdefault("ai", {"enabled": False})
    return cfg


def prefixes(src: dict) -> tuple[str, ...]:
    """How the ids of a source's posts begin."""
    if src.get("type") in BUILT_IN:
        return BUILT_IN[src["type"]]
    if src.get("type") in ats.READERS and src.get("company"):
        return (ats.prefix(src),)
    return ()


def is_board(src: dict) -> bool:
    return src.get("type") in ats.READERS


def from_source(job: dict, src: dict) -> bool:
    return str(job.get("id") or "").startswith(prefixes(src) or ("\0",))


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


def drop_switched_off(jobs: list[dict], sources: list[dict]) -> tuple[list[dict], int]:
    """A source switched off in sources.json: its posts leave the site too."""
    on = tuple(p for s in sources if s.get("enabled", True) for p in prefixes(s))
    off = tuple(p for s in sources if not s.get("enabled", True) for p in prefixes(s) if p not in on)
    if not off:
        return jobs, 0
    kept = [j for j in jobs if not str(j.get("id") or "").startswith(off)]
    return kept, len(jobs) - len(kept)


def drop_closed(jobs: list[dict], src: dict, info: dict) -> tuple[list[dict], int, str]:
    """A company board's post that the board no longer lists is closed: it is removed.

    Only when the board's list was really read. A board that suddenly lists nothing while
    we hold several of its posts is more likely a changed page than a hiring freeze, so
    those posts are kept and the report says so.
    """
    if not info.get("ok"):
        return jobs, 0, ""
    mine = [j for j in jobs if from_source(j, src)]
    listed = set(info.get("ids") or [])
    if not listed and len(mine) >= 3:
        return jobs, 0, f"lists nothing now; kept its {len(mine)} posts in case the page changed"
    kept = [j for j in jobs if not from_source(j, src) or j.get("id") in listed]
    return kept, len(jobs) - len(kept), ""


def clean(jobs: list[dict], today, keep_while_listed: tuple[str, ...] = ()) -> tuple[list[dict], dict]:
    """Expired, stale, link-less, money-asking and repeated posts out. One post per job.

    `keep_while_listed`: id beginnings of company-board posts. A board keeps a job open for
    months, so the 30-day rule does not apply to them (drop_closed removes them instead).
    """
    counts = {"expired": 0, "too_old": 0, "no_apply_link": 0, "asks_for_money": 0, "merged": 0, "no_title": 0}
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
        on_board = bool(keep_while_listed) and str(job.get("id") or "").startswith(keep_while_listed)
        if age is not None and age > KEEP_DAYS and not on_board:
            counts["too_old"] += 1
            continue
        if not str(job.get("url") or "").lower().startswith(("http://", "https://")):
            counts["no_apply_link"] += 1          # nowhere to apply: not a post the site can stand behind
            continue
        if N.asks_for_money(job):
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


# ── keywords and places: read with the site's own dictionary (robot/keywords.mjs) ──
def ask_dictionary(posts: list[dict]) -> dict:
    """[{id, title, text, place}] -> {id: {"skills": [...], "place": "..."}}. {} when node is not there."""
    if not posts:
        return {}
    try:
        done = subprocess.run(["node", str(HERE / "keywords.mjs")], input=json.dumps(posts, ensure_ascii=False),
                              capture_output=True, text=True, encoding="utf-8", timeout=300, cwd=str(ROOT))
        if done.returncode != 0:
            raise RuntimeError((done.stderr or "").strip()[-300:])
        return json.loads(done.stdout or "{}")
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as e:
        log.warning("the dictionary step did not run (%s); posts keep the keywords they had", e)
        return {}


def add_keywords(fresh: list[dict], ask=ask_dictionary) -> dict:
    """New posts: the skills the dictionary finds in the full text go to the front of `req`."""
    posts = [{"id": j["id"], "title": j.get("title", ""), "text": j.get("_kw") or j["_text"]} for j in fresh if j.get("_text") and j.get("id")]
    found = ask(posts)
    changed = 0
    for j in fresh:
        skills = (found.get(j.get("id")) or {}).get("skills") or []
        if skills:
            j["req"] = N.keywords_req(skills, j.get("req", ""))
            changed += 1
    return {"postsRead": len(posts), "postsWithSkills": changed, "ran": bool(found) or not posts}


def org_places(path: pathlib.Path = ORG_PLACES_FILE) -> dict[str, str]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return {str(k).lower(): str(v) for k, v in (data.get("places") or {}).items() if k and v}
    except (OSError, ValueError, AttributeError):
        return {}


def add_places(jobs: list[dict], table: dict[str, str], ask=ask_dictionary) -> dict:
    """Government posts with no place: from org-places.json, else a place the organisation's name states."""
    blank = [j for j in jobs if str(j.get("id") or "").startswith("alljobs:") and not j.get("loc") and j.get("company")]
    from_table = from_name = 0
    left = []
    for j in blank:
        org = j["company"].lower()
        hit = next((place for name, place in table.items() if name in org), "")
        if hit:
            j["loc"] = hit
            from_table += 1
        else:
            left.append(j)
    found = ask([{"id": j["id"], "title": "", "place": j["company"]} for j in left]) if left else {}
    for j in left:
        place = (found.get(j["id"]) or {}).get("place") or ""
        if place:
            j["loc"] = place
            from_name += 1
    return {"withoutPlace": len(blank), "fromOrgPlacesFile": from_table, "fromOrganisationName": from_name,
            "stillWithoutPlace": len(blank) - from_table - from_name}


# ── posts held back for a person to look at ──
def held_back(report_file: pathlib.Path, today) -> list[dict]:
    """The review queue of the last run (report.json "flagged"), without entries older than KEEP_DAYS.

    Their ids count as known, so a held post is not fetched again at every run.
    """
    try:
        rows = json.loads(report_file.read_text(encoding="utf-8")).get("flagged") or []
    except (OSError, ValueError, AttributeError):
        return []
    out = []
    for h in rows:
        if not isinstance(h, dict) or not h.get("id"):
            continue
        since = N.iso_date(h.get("since"))
        if since and (today - datetime.fromisoformat(since).date()).days > KEEP_DAYS:
            continue
        out.append(h)
    return out


def hold_back(fresh: list[dict], today) -> tuple[list[dict], list[dict]]:
    """New posts that seem to ask candidates for money (by rule, or flagged by the AI step) are kept
    off the site and listed with the reason. A real employer never asks a candidate for money, but
    the rule can be wrong ("security deposit" in a property job), so a person decides."""
    ok, flagged = [], []
    for j in fresh:
        why = j.get("_flag") or ("asks candidates for money (rule)" if N.asks_for_money(j) else "")
        if not why:
            ok.append(j)
            continue
        log.info("held for review (%s): %s at %s", why, j.get("title"), j.get("company"))
        flagged.append({"id": j.get("id"), "title": j.get("title"), "company": j.get("company"), "source": j.get("source"),
                        "url": j.get("url"), "why": why, "since": today.isoformat()})
    return ok, flagged


# ── the optional AI step ──
def ai_step(fresh: list[dict], conf: dict) -> dict:
    """Never runs unless sources.json says "ai": {"enabled": true}. A missing key stops it politely."""
    if not conf.get("enabled"):
        return {"enabled": False}
    import ai
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    client = ai.Gemini(key, conf.get("models", ["gemini-3.5-flash-lite"]), pause=conf.get("secondsBetweenCalls", 7),
                       max_requests=conf.get("maxCallsPerRun", 12), thinking=conf.get("thinking", "minimal"))
    stats = ai.enrich(fresh, client, ai.fields_from_repo(), posts_per_call=conf.get("postsPerCall", 6),
                      summaries=bool(conf.get("summaries")))
    return {"enabled": True, **stats, "answers": client.answers, "requests": client.requests,
            "model": client.model, "errors": client.errors[:10]}


# ── collecting ──
def collect(sources: list[dict], fetcher, known: set, default_limit: int, districts: list[str]) -> tuple[list[dict], dict]:
    """Every source that is switched on -> (new posts, {source id: info})."""
    fresh, infos = [], {}
    for src in sources:
        sid, kind = src.get("id") or src.get("type"), src.get("type")
        limit = int(src.get("limit") or default_limit)
        try:
            if kind == "nextjobz":
                got, info = nextjobz.collect(fetcher, known, limit=limit), {}
            elif kind == "alljobs":
                got, info = alljobs.collect(fetcher, known, districts, limit=limit), {}
            elif kind == "remote_boards":
                got, info = remote_boards.collect(fetcher, known), {}
            elif kind == "company_pages":
                got, info = company_pages.collect(fetcher, known, str(HERE / "companies.json")), {}
            elif is_board(src):
                got, info = ats.collect_one(fetcher, src, known, limit=min(limit, 60))
            else:
                got, info = [], {"error": f"unknown type {kind}"}
        except Exception as e:                       # one broken site never stops the run
            got, info = [], {"error": f"{type(e).__name__}: {e}"}
            log.exception("%s failed, carrying on with the others", sid)
        fresh.extend(got)
        infos[sid] = {**info, "collected": len(got)}
    return fresh, infos


def main() -> int:
    ap = argparse.ArgumentParser(description="Collect today's jobs into jobs.json")
    ap.add_argument("--limit", type=int, default=300, help="new pages per source this run")
    ap.add_argument("--only", help="run one source: its id in robot/sources.json (nextjobz, alljobs, remote, companies, ...)")
    ap.add_argument("--dry-run", action="store_true", help="do not write jobs.json")
    ap.add_argument("--out", help="for testing: write the jobs to this file, and the report beside it, instead of jobs.json and robot/report.json")
    args = ap.parse_args()
    jobs_file = pathlib.Path(args.out) if args.out else JOBS_FILE
    report_file = jobs_file.with_name("report.json") if args.out else REPORT_FILE

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    from fetcher import Fetcher                      # needs `requests`; imported here so the rest can be tested without it
    started = datetime.now(DHAKA)
    today = started.date()

    cfg = load_config()
    sources = cfg["sources"]
    switched_on = [s for s in sources if s.get("enabled", True)]
    running = [s for s in switched_on if not args.only or args.only in (s.get("id"), s.get("type"))]
    if args.only and not running:
        log.error("no source with the id %r is switched on in sources.json", args.only)
        return 2

    existing = read_jobs()
    log.info("jobs.json holds %d posts", len(existing))
    existing, switched_off = drop_switched_off(existing, sources)
    held = held_back(REPORT_FILE, today)             # posts waiting for a person to look at them
    known = {j["id"] for j in existing if j.get("id")} | {h["id"] for h in held}

    fetcher = Fetcher()
    districts = alljobs.districts_from((ROOT / "src" / "locations.js").read_text(encoding="utf-8"))
    fresh, infos = collect(running, fetcher, known, args.limit, districts)

    closed, notes = 0, {}
    for src in running:
        if is_board(src):
            existing, n, note = drop_closed(existing, src, infos.get(src.get("id")) or {})
            closed += n
            if note:
                notes[src.get("id")] = note

    keywords = add_keywords(fresh)
    places = add_places(existing + fresh, org_places())
    ai_report = ai_step(fresh, cfg.get("ai") or {})
    fresh, newly_flagged = hold_back(fresh, today)   # hidden until someone approves them (admin page, later)
    flagged = held + newly_flagged

    boards = tuple(p for s in switched_on if is_board(s) for p in prefixes(s))
    merged, counts = clean(existing + fresh, today, keep_while_listed=boards)
    merged = [N.public(j) for j in merged]          # descriptions are never written to jobs.json

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
        "collectedPerSource": {sid: i.get("collected", 0) for sid, i in infos.items()},
        "postsInFilePerSource": by_source,
        "removed": {**counts, "closed_on_company_board": closed, "source_switched_off": switched_off,
                    "held_for_review": len(newly_flagged), "over_size_limit": over_size},
        "sourceFailures": {sid: i["error"] for sid, i in infos.items() if i.get("error")},
        "sources": [{"id": s.get("id"), "type": s.get("type"), "enabled": bool(s.get("enabled", True)),
                     **{k: v for k, v in (infos.get(s.get("id")) or {}).items() if k in ("collected", "listed", "how", "error")},
                     **({"note": notes[s.get("id")]} if s.get("id") in notes else {})} for s in sources],
        "notRead": cfg.get("notRead", []),
        "keywords": keywords,
        "governmentPlaces": places,
        "ai": ai_report,
        "flagged": flagged[-100:],                   # the review queue: not on the site until a person approves them
        "pagesRead": fetcher.pages_read(),
        "blockedByRobotsTxt": fetcher.blocked[:20],
        "requestsFailed": fetcher.failed[:20],
    }

    if args.dry_run:
        log.info("dry run: jobs.json not written")
    else:
        jobs_file.write_text(json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        log.info("wrote %s with %d posts", jobs_file.name, len(merged))
    report_file.write_text(json.dumps(report, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    log.info("per source: %s", report["collectedPerSource"])
    log.info("removed: %s", report["removed"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
