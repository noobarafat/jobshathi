#!/usr/bin/env python3
"""A small trial run of the job pipeline.

Reads a few posts from the sources listed under "pilot" in robot/sources.json, puts them
through the same steps as the daily robot (keywords from the full text, then the site's
own matcher), and writes what came out for a person to check:

  robot/pilot/report.md    the readable report (sources, time, how well posts were read, every sample job)
  robot/pilot/result.json  the same data as JSON

It NEVER touches jobs.json and nothing it writes is published on the site.
Job descriptions are read but not written to either file.

The AI step runs only when robot/sources.json says "ai": {"enabled": true}. It is off:
this script then needs no key at all.

Run from the repository root:
  python3 robot/pilot.py
  python3 robot/pilot.py --fake-ai    # exercise the AI step with a stand-in service (no key needed)
"""
from __future__ import annotations

import argparse
import gzip
import json
import logging
import os
import pathlib
import sys
import time
import traceback
from datetime import datetime, timedelta, timezone

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))

import ai                                    # noqa: E402
import normalise as N                        # noqa: E402
import run as robot                          # noqa: E402
from sources import ats, nextjobz            # noqa: E402

DHAKA = timezone(timedelta(hours=6))
log = logging.getLogger("robot.pilot")
compact = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":"))   # noqa: E731


def collect(cfg: dict, fetcher) -> tuple[list[dict], list[dict]]:
    pilot = cfg["pilot"]
    by_id = {s["id"]: s for s in cfg["sources"]}
    jobs, rows = [], []
    for sid in pilot["sources"]:
        src = by_id.get(sid)
        if not src:
            rows.append({"id": sid, "type": "?", "error": "not in sources.json", "read": 0, "seconds": 0})
            continue
        t0 = time.monotonic()
        if src["type"] == "nextjobz":
            try:
                got = nextjobz.collect(fetcher, set(), limit=pilot.get("nextjobzPosts", 8))
                info = {"how": "sitemap, then each job page's schema.org data", "listed": None, "read": len(got)}
            except Exception as e:
                got, info = [], {"how": "", "listed": None, "read": 0, "error": f"{type(e).__name__}: {e}"}
        else:
            got, info = ats.collect_one(fetcher, src, set(), limit=pilot.get("postsPerSource", 3))
        for j in got:
            j["_src"], j["_kind"] = sid, src["type"]
        jobs.extend(got)
        rows.append({"id": sid, "type": src["type"], "company": src.get("company", ""),
                     **{k: v for k, v in info.items() if k != "ids"}, "seconds": round(time.monotonic() - t0, 1)})
    return jobs, rows


def quality(jobs: list[dict]) -> tuple[list[dict], dict]:
    """The rules that need no AI: a post must have a link, and money-asking posts are flagged."""
    kept, counts = [], {"noApplyLink": 0, "flaggedByRules": 0}
    for j in jobs:
        if not str(j.get("url") or "").lower().startswith(("http://", "https://")):
            counts["noApplyLink"] += 1
            continue
        if N.asks_for_money(j):
            j["_flag"] = "asks candidates for money (rule)"
            counts["flaggedByRules"] += 1
        kept.append(j)
    return kept, counts


def pick(jobs: list[dict], most: int) -> list[dict]:
    """Up to `most` posts, taken in turn from each kind of source so the sample is mixed
    (otherwise the many small company boards would crowd out the local job portal)."""
    groups: dict[str, list[dict]] = {}
    for j in jobs:
        groups.setdefault(j["_kind"], []).append(j)
    out = []
    while len(out) < most and any(groups.values()):
        for sid in list(groups):
            if groups[sid] and len(out) < most:
                out.append(groups[sid].pop(0))
    return out


def read_all(jobs: list[dict]) -> dict:
    """How the site's matcher reads each post, as it would be stored (without the description)."""
    return robot.ask_dictionary([{"id": j["id"], "post": N.public(j)} for j in jobs if j.get("id")])


def rates(jobs: list[dict]) -> dict:
    """Of the posts the matcher read: how many got a field, a role, a place, a level, a skill."""
    read = [j["_read"] for j in jobs if j.get("_read")]
    n = len(read)

    def share(test):
        hit = sum(1 for r in read if test(r))
        return {"count": hit, "percent": round(100 * hit / n, 1) if n else 0}
    return {"posts": n,
            "field": share(lambda r: r["field"]), "role": share(lambda r: r["role"]), "place": share(lambda r: r["located"]),
            "experienceStated": share(lambda r: r["experience"]),
            "experienceLevel": share(lambda r: r["experience"] or r["levelFromTitle"]),
            "education": share(lambda r: r["education"] is not None), "skill": share(lambda r: r["skills"]),
            "skillsPerPost": round(sum(len(r["skills"]) for r in read) / n, 1) if n else 0}


def sizes(jobs: list[dict]) -> dict:
    """What a post costs in jobs.json, measured on this run's posts."""
    out = {"sample": len(jobs)}
    path = ROOT / "jobs.json"
    if path.exists():
        data = json.loads(path.read_text(encoding="utf-8"))
        rows = data.get("jobs") if isinstance(data, dict) else data
        raw = compact(data).encode()
        out.update(posts=len(rows), nowRaw=len(raw), nowGzip=len(gzip.compress(raw, 6)), nowPerPost=round(len(raw) / max(1, len(rows))))
    if jobs:
        each = [len(compact(N.public(j)).encode()) for j in jobs]
        out["pilotPerPost"] = round(sum(each) / len(each))
    return out


# ── the report ──
def kb(n) -> str:
    return f"{n / 1024:,.0f} KB"


def level_words(r: dict) -> str:
    e = r.get("experience")
    if e:
        if e.get("fresher") and not e.get("min"):
            return "freshers can apply (stated)"
        return f"{e['min']:g}" + (f" to {e['max']:g}" if e.get("max") else "+") + " years (stated)"
    if r.get("levelFromTitle"):
        return f"{r['levelFromTitle']} (from the title; the post states none)"
    return "NOT FOUND"


def report_md(r: dict) -> str:
    L = []
    L.append("# JobShathi pilot run\n")
    L.append(f"Run at {r['startedAt']} (Bangladesh time). This run did not change `jobs.json` and published nothing.\n")

    q = r["rates"]
    L.append("## 1. Result in short\n")
    L.append(f"- Posts collected: **{r['collected']}** from {len(r['sources'])} sources "
             f"({r['quality']['noApplyLink']} dropped for having no apply link)")
    L.append(f"- AI step: **{'on' if r['ai']['enabled'] else 'off'}**"
             + ("" if r["ai"]["enabled"] else " (switched off in `robot/sources.json`; no key is needed and none was read)"))
    L.append(f"- Keywords: the dictionary read the full text of {r['keywords'].get('postsRead', 0)} posts "
             f"and found skills in {r['keywords'].get('postsWithSkills', 0)}"
             + ("" if r["keywords"].get("ran") else " (**the dictionary step did not run**)"))
    L.append(f"- Time: collecting {r['seconds']['collect']}s, reading {r['seconds']['read']}s, total {r['seconds']['total']}s")
    L.append(f"- Flagged as possible scam: {r['flagged']} (by rules: {r['quality']['flaggedByRules']})")
    if r.get("crash"):
        L.append(f"- **The run hit an error:** `{r['crash']}`")
    L.append("")
    if q.get("posts"):
        L.append(f"How well the site's matcher read these {q['posts']} posts, with rules only (no AI):\n")
        L.append("| | Found in | |")
        L.append("| --- | --- | --- |")
        for label, key in (("Field", "field"), ("Role", "role"), ("Place", "place"), ("Experience stated in the post", "experienceStated"),
                           ("Experience level (stated, or from the title)", "experienceLevel"), ("Education", "education"), ("At least one skill", "skill")):
            L.append(f"| {label} | {q[key]['count']} of {q['posts']} | {q[key]['percent']}% |")
        L.append(f"\nSkills found per post, on average: {q['skillsPerPost']}\n")

    L.append("## 2. Sources\n")
    L.append("| Source | System | How it is read | Live jobs listed | Read in this pilot | Seconds | Problem |")
    L.append("| --- | --- | --- | --- | --- | --- | --- |")
    for s in r["sources"]:
        listed = "not counted" if s.get("listed") is None else s.get("listed", 0)
        L.append(f"| {s['id']} | {s['type']} | {s.get('how', '')} | {listed} | {s.get('read', 0)} | {s.get('seconds', 0)} | {s.get('error', '')} |")
    L.append("")
    if r["blocked"] or r["failed"]:
        L.append(f"Blocked by robots.txt: {r['blocked'] or 'none'}. Requests that failed: {r['failed'] or 'none'}.\n")
    L.append("Deliberately not read:\n")
    for n in r["notRead"]:
        L.append(f"- {n['name']}: {n['why']}")
    L.append("")

    z = r["sizes"]
    L.append("## 3. File size\n")
    if z.get("posts") and z.get("pilotPerPost"):
        L.append(f"`jobs.json` today: {z['posts']:,} posts, {kb(z['nowRaw'])} ({kb(z['nowGzip'])} compressed, which is what a phone downloads), "
                 f"{z['nowPerPost']} bytes a post. A post from this run is {z['pilotPerPost']} bytes. "
                 "No summaries and no AI fields are stored, so a new post costs about the same as an old one.\n")
    else:
        L.append("Not measured.\n")

    L.append(f"## 4. Sample jobs ({len(r['jobs'])})\n")
    L.append("\"From the source\" is what is stored. \"The matcher reads\" is what the site makes of it with rules only. Open the link to compare with the real post.\n")
    for i, j in enumerate(r["jobs"], 1):
        L.append(f"### {i}. {j.get('title', '')} ({j.get('company', '') or 'no company'})\n")
        L.append(f"Source: {j.get('source', '')} · posted {j.get('postedAt', 'date not given')} · [original post]({j.get('url', '')})\n")
        bits = [f"place: {j['loc']}" if j.get("loc") else "", f"type: {j['type']}" if j.get("type") else "",
                f"category: {j['cat']}" if j.get("cat") else "", f"experience: {j['exp']}" if j.get("exp") else "",
                f"education: {j['edu']}" if j.get("edu") else "", f"salary: {j['salary']}" if j.get("salary") else "",
                f"deadline: {j['deadline']}" if j.get("deadline") else ""]
        L.append("- **From the source:** " + ("; ".join(b for b in bits if b) or "title and link only"))
        L.append(f"- **Keywords kept:** {j.get('req') or 'none'}")
        m = j.get("read")
        if not m:
            L.append("- **The matcher reads:** nothing (the post has expired or has no title)\n")
            continue
        field = f"{m['fieldName']}" + (f" / {m['roleName']}" if m.get("roleName") else " / no role") if m.get("field") else "NOT FOUND"
        where = "remote" if m.get("remote") and not m.get("place") else (m.get("place") or ("anywhere in Bangladesh" if m.get("anywhere") else "NOT FOUND"))
        if m.get("placeFrom") == "title" and m.get("place"):
            where += " (from the title)"
        L.append(f"- **The matcher reads:** field and role: **{field}** (by {m['how']}) · place: **{where}**"
                 f" · experience: **{level_words(m)}** · type: {m.get('type')}")
        L.append(f"- **Skills found:** {', '.join(m.get('skills') or []) or 'NONE'}")
        if j.get("ai"):
            L.append(f"- **AI:** {compact(j['ai'])}")
        if j.get("flag"):
            L.append(f"- **Scam flag:** YES: {j['flag']}")
        L.append("")
    if r["ai"].get("problems") or r["ai"].get("errors"):
        L.append("## 5. Problems the AI step met\n")
        for p in (r["ai"].get("errors", []) + r["ai"].get("problems", []))[:40]:
            L.append(f"- {p}")
        L.append("")
    return "\n".join(L) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser(description="Trial run of the job pipeline (never writes jobs.json)")
    ap.add_argument("--fake-ai", action="store_true", help="run the AI step with a stand-in for Gemini (no key needed)")
    ap.add_argument("--out", default=str(HERE / "pilot"))
    args = ap.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

    started = datetime.now(DHAKA)
    t_start = time.monotonic()
    cfg = robot.load_config()
    cfg.setdefault("pilot", {"sources": [s["id"] for s in cfg["sources"] if s.get("type") == "nextjobz"]})
    conf = dict(cfg.get("ai") or {})
    r = {"startedAt": started.isoformat(timespec="seconds"), "notRead": cfg.get("notRead", []), "sources": [], "collected": 0,
         "flagged": 0, "jobs": [], "quality": {"noApplyLink": 0, "flaggedByRules": 0}, "blocked": [], "failed": [], "sizes": {},
         "keywords": {}, "rates": {}, "ai": {"enabled": False}, "seconds": {"collect": 0, "read": 0, "total": 0}}
    key = ""
    try:
        from fetcher import Fetcher
        fetcher = Fetcher()
        jobs, r["sources"] = collect(cfg, fetcher)
        r["collected"] = len(jobs)
        r["blocked"], r["failed"] = fetcher.blocked[:20], fetcher.failed[:20]
        r["seconds"]["collect"] = round(time.monotonic() - t_start, 1)
        jobs, r["quality"] = quality(jobs)

        t_read = time.monotonic()
        r["keywords"] = robot.add_keywords(jobs)

        if args.fake_ai:                          # only to exercise the AI code path: never the real service
            sys.path.insert(0, str(ROOT / "tests"))
            from fake_gemini import FakeSession
            client = ai.Gemini("fake-key", conf.get("models", ["fake"]), pause=0, max_requests=conf.get("maxCallsPerRun", 12), session=FakeSession())
            stats = ai.enrich(pick(jobs, cfg["pilot"].get("maxPostsToAI", 30)), client, ai.fields_from_repo(),
                              posts_per_call=conf.get("postsPerCall", 6), summaries=bool(conf.get("summaries")))
            r["ai"] = {"enabled": True, "fake": True, **stats, "answers": client.answers, "requests": client.requests, "errors": client.errors[:20]}
        elif conf.get("enabled"):
            key = os.environ.get("GEMINI_API_KEY", "").strip()
            r["ai"] = robot.ai_step(pick(jobs, cfg["pilot"].get("maxPostsToAI", 30)), conf)

        found = read_all(jobs)
        for j in jobs:
            j["_read"] = (found.get(j["id"]) or {}).get("read")
        r["seconds"]["read"] = round(time.monotonic() - t_read, 1)
        r["rates"] = rates(jobs)
        r["flagged"] = sum(1 for j in jobs if j.get("_flag"))
        r["sizes"] = sizes(jobs)
        for j in pick(list(jobs), cfg["pilot"].get("maxPostsToShow", 45)):     # what is written: never the description
            out = N.public(j)
            out["read"] = j.get("_read")
            if j.get("_flag"):
                out["flag"] = j["_flag"]
            r["jobs"].append(out)
    except Exception as e:                        # the report is written even when the run breaks
        log.exception("pilot failed")
        last = traceback.extract_tb(e.__traceback__)[-1]
        r["crash"] = f"{type(e).__name__}: {e} ({pathlib.Path(last.filename).name}:{last.lineno})".replace(key or "\0", "***")
    r["seconds"]["total"] = round(time.monotonic() - t_start, 1)

    out_dir = pathlib.Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "result.json").write_text(json.dumps(r, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    (out_dir / "report.md").write_text(report_md(r), encoding="utf-8")
    log.info("wrote %s (%d sample jobs)", out_dir / "report.md", len(r["jobs"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
