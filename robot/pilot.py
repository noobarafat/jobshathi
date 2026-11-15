#!/usr/bin/env python3
"""A small trial run of the AI pipeline.

Reads a few posts from the sources listed under "pilot" in robot/sources.json, sends
them through the AI step, and writes what came back for a person to check:

  robot/pilot/report.md    the readable report (sources, time, AI calls, sizes, every sample job)
  robot/pilot/result.json  the same data as JSON

It NEVER touches jobs.json and nothing it writes is published on the site.
Job descriptions are read but not written to either file.

Run from the repository root:
  python3 robot/pilot.py              # needs GEMINI_API_KEY in the environment
  python3 robot/pilot.py --fake-ai    # no key needed: a stand-in service, to test the plumbing
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
from fetcher import Fetcher                  # noqa: E402
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
            j["_src"] = sid
        jobs.extend(got)
        rows.append({"id": sid, "type": src["type"], "company": src.get("company", ""), **info,
                     "seconds": round(time.monotonic() - t0, 1)})
    return jobs, rows


def quality(jobs: list[dict]) -> tuple[list[dict], dict]:
    """The rules that need no AI: a post must have a link, and money-asking posts are flagged."""
    kept, counts = [], {"noApplyLink": 0, "flaggedByRules": 0}
    for j in jobs:
        if not str(j.get("url") or "").lower().startswith(("http://", "https://")):
            counts["noApplyLink"] += 1
            continue
        if N.is_scam(j.get("_text", ""), j.get("req", ""), j.get("title", ""), j.get("salary", "")):
            j["_flag"] = "asks candidates for money (rule)"
            counts["flaggedByRules"] += 1
        kept.append(j)
    return kept, counts


def pick(jobs: list[dict], most: int) -> list[dict]:
    """Up to `most` posts, taken in turn from each source so the sample is mixed."""
    groups: dict[str, list[dict]] = {}
    for j in jobs:
        groups.setdefault(j["_src"], []).append(j)
    out = []
    while len(out) < most and any(groups.values()):
        for sid in list(groups):
            if groups[sid] and len(out) < most:
                out.append(groups[sid].pop(0))
    return out


def sizes(done: list[dict]) -> dict:
    """How much the AI data would add to jobs.json, measured on this sample."""
    out = {"sample": len(done)}
    path = ROOT / "jobs.json"
    if path.exists():
        data = json.loads(path.read_text(encoding="utf-8"))
        rows = data.get("jobs") if isinstance(data, dict) else data
        raw = compact(data).encode()
        out.update(posts=len(rows), nowRaw=len(raw), nowGzip=len(gzip.compress(raw, 6)))
    if not done:
        return out
    short = [(',"ai":' + compact(j["ai"])).encode() for j in done]
    summ = [(',"sum":' + compact(j["_sum"])).encode() for j in done]
    out["shortPerPost"] = round(sum(map(len, short)) / len(done))
    out["summariesPerPost"] = round(sum(map(len, summ)) / len(done))
    # a small sample compresses worse than a big file, so these two are on the careful side
    out["shortGzipRatio"] = round(len(gzip.compress(b"".join(short), 6)) / sum(map(len, short)), 2)
    out["summariesGzipRatio"] = round(len(gzip.compress(b"".join(summ), 6)) / sum(map(len, summ)), 2)
    return out


# ── the report ──
def kb(n) -> str:
    return f"{n / 1024:,.0f} KB"


def report_md(r: dict) -> str:
    a, L = r["ai"], []
    L.append("# JobShathi pilot run: AI job pipeline\n")
    L.append(f"Run at {r['startedAt']} (Bangladesh time). This run did not change `jobs.json` and published nothing.\n")

    L.append("## 1. Result in short\n")
    L.append(f"- Posts collected: **{r['collected']}** from {len(r['sources'])} sources "
             f"({r['quality']['noApplyLink']} dropped for having no apply link)")
    L.append(f"- Posts sent to the AI: **{a['wanted']}**. Came back correct: **{a['done']}**. "
             f"Failed the check twice (kept with basic fields only): **{a['failedCheck']}**")
    L.append(f"- AI calls that returned an answer: **{a['answers']}** (HTTP requests sent in all: {a['requests']}; "
             f"waits after a rate limit or server error: {a['waits']}; posts asked for a second time: {a['askedAgain']})")
    L.append(f"- Model: `{a['model'] or 'none'}`, request type: `{a['shape'] or 'none'}`"
             + ("  **(stand-in service, not the real AI)**" if r["fake"] else ""))
    L.append(f"- Tokens: {a['usage']['input']:,} in, {a['usage']['output']:,} out, {a['usage']['thinking']:,} thinking")
    L.append(f"- Time: collecting {r['seconds']['collect']}s, AI {r['seconds']['ai']}s, total {r['seconds']['total']}s")
    L.append(f"- Flagged as possible scam: {r['flagged']} (by rules: {r['quality']['flaggedByRules']})")
    if a["stopped"]:
        L.append(f"- **The AI step stopped early:** {a['stopped']}")
    if r.get("crash"):
        L.append(f"- **The run hit an error:** `{r['crash']}`")
    L.append("")

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
    if z.get("posts") and z.get("shortPerPost"):
        n = z["posts"]
        short_raw, sum_raw = z["shortPerPost"] * n, z["summariesPerPost"] * n
        short_gz, sum_gz = short_raw * z["shortGzipRatio"], sum_raw * z["summariesGzipRatio"]
        L.append(f"Measured on the {z['sample']} sample posts, then multiplied by the {n:,} posts in today's `jobs.json`. "
                 "Phones download the compressed (gzip) size.\n")
        L.append("| | Raw | Compressed (what a phone downloads) |")
        L.append("| --- | --- | --- |")
        L.append(f"| `jobs.json` today | {kb(z['nowRaw'])} | {kb(z['nowGzip'])} |")
        L.append(f"| + short AI fields ({z['shortPerPost']} bytes a post) | +{kb(short_raw)} | about +{kb(short_gz)} |")
        L.append(f"| + both summaries ({z['summariesPerPost']} bytes a post) | +{kb(sum_raw)} | about +{kb(sum_gz)} |")
        L.append(f"| **A. Everything in `jobs.json`** | {kb(z['nowRaw'] + short_raw + sum_raw)} | about {kb(z['nowGzip'] + short_gz + sum_gz)} |")
        L.append(f"| **B. Short fields in `jobs.json`, summaries in separate files** | {kb(z['nowRaw'] + short_raw)} | about {kb(z['nowGzip'] + short_gz)} |")
        L.append("\nThe compressed figures are estimates from a small sample, so they lean high.\n")
    else:
        L.append("Not measured (no AI answers, or no `jobs.json`).\n")

    L.append(f"## 4. Sample jobs ({len(r['jobs'])})\n")
    L.append("\"From the source\" is what the site has today without AI. \"AI\" is what Gemini returned. Open the link to compare with the real post.\n")
    for i, j in enumerate(r["jobs"], 1):
        x = j.get("ai") or {}
        L.append(f"### {i}. {j.get('title', '')} ({j.get('company', '') or 'no company'})\n")
        L.append(f"Source: {j.get('source', '')} · posted {j.get('postedAt', 'date not given')} · "
                 f"[original post]({j.get('url', '')}) · the AI read {j.get('textChars', 0):,} characters of it\n")
        src_bits = [f"place: {j['loc']}" if j.get("loc") else "", f"type: {j['type']}" if j.get("type") else "",
                    f"category: {j['cat']}" if j.get("cat") else "", f"experience: {j['exp']}" if j.get("exp") else "",
                    f"salary: {j['salary']}" if j.get("salary") else "", f"deadline: {j['deadline']}" if j.get("deadline") else ""]
        L.append("- **From the source:** " + ("; ".join(b for b in src_bits if b) or "title and link only"))
        if not x:
            L.append(f"- **AI:** none ({'failed the check twice' if j.get('aiSkip') else 'not sent in this run'})\n")
            continue
        yrs = ""
        if "minYears" in x or "maxYears" in x:
            lo, hi = x.get("minYears"), x.get("maxYears")
            yrs = f" ({lo if lo is not None else '?'}" + (f" to {hi}" if hi is not None else "+") + " years)"
        L.append(f"- **AI title:** {x.get('title', '(same)')}")
        L.append(f"- **Field:** {x.get('field', '?')} ({r['fields'].get(x.get('field'), 'other')}) · **Level:** {x.get('level', 'not stated')}{yrs}"
                 f" · **Type:** {x.get('type', 'not stated')} · **Mode:** {x.get('mode', 'not stated')}")
        L.append(f"- **City / area:** {x.get('city', 'not stated')} / {x.get('area', 'not stated')} · **Education:** {x.get('edu', 'not stated')}"
                 f" · **Salary:** {x.get('salary', 'not stated')} · **Deadline:** {x.get('deadline', 'not stated')}")
        L.append(f"- **Required skills:** {', '.join(x.get('skills', [])) or 'none found'}")
        L.append(f"- **Nice to have:** {', '.join(x.get('nice', [])) or 'none found'}")
        L.append(f"- **English:** {j['sum']['en']}")
        L.append(f"- **বাংলা:** {j['sum']['bn']}")
        L.append(f"- **Scam flag:** {'YES: ' + j['flag'] if j.get('flag') else 'no'}\n")

    if a["problems"] or a["errors"]:
        L.append("## 5. Problems the AI step met\n")
        for p in (a["errors"] + a["problems"])[:40]:
            L.append(f"- {p}")
        L.append("")
    return "\n".join(L) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser(description="Trial run of the AI pipeline (never writes jobs.json)")
    ap.add_argument("--fake-ai", action="store_true", help="use a stand-in for Gemini (no key needed)")
    ap.add_argument("--out", default=str(HERE / "pilot"))
    args = ap.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

    started = datetime.now(DHAKA)
    t_start = time.monotonic()
    cfg = json.loads((HERE / "sources.json").read_text(encoding="utf-8"))
    fields = ai.fields_from_repo()
    conf = cfg.get("ai", {})
    r = {"startedAt": started.isoformat(timespec="seconds"), "fake": args.fake_ai, "fields": fields,
         "notRead": cfg.get("notRead", []), "sources": [], "collected": 0, "flagged": 0, "jobs": [],
         "quality": {"noApplyLink": 0, "flaggedByRules": 0}, "blocked": [], "failed": [], "sizes": {},
         "seconds": {"collect": 0, "ai": 0, "total": 0},
         "ai": {"wanted": 0, "done": 0, "failedCheck": 0, "askedAgain": 0, "stopped": "", "problems": [], "errors": [],
                "answers": 0, "requests": 0, "waits": 0, "model": None, "shape": None,
                "usage": {"input": 0, "output": 0, "thinking": 0}}}
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    try:
        fetcher = Fetcher()
        jobs, r["sources"] = collect(cfg, fetcher)
        r["collected"] = len(jobs)
        r["blocked"], r["failed"] = fetcher.blocked[:20], fetcher.failed[:20]
        r["seconds"]["collect"] = round(time.monotonic() - t_start, 1)
        jobs, r["quality"] = quality(jobs)
        sample = pick(jobs, cfg["pilot"].get("maxPostsToAI", 30))

        t_ai = time.monotonic()
        session = None
        if args.fake_ai:
            sys.path.insert(0, str(ROOT / "tests"))
            from fake_gemini import FakeSession
            session, key = FakeSession(), "fake-key"
        client = ai.Gemini(key, conf.get("models", ["gemini-3.5-flash-lite"]),
                           pause=0 if args.fake_ai else conf.get("secondsBetweenCalls", 7),
                           max_requests=conf.get("maxCallsPerRun", 12), thinking=conf.get("thinking", "minimal"),
                           session=session)
        stats = ai.enrich(sample, client, fields, posts_per_call=conf.get("postsPerCall", 6))
        r["seconds"]["ai"] = round(time.monotonic() - t_ai, 1)
        r["ai"].update(stats, answers=client.answers, requests=client.requests, waits=client.waits,
                       model=client.model, shape=client.shape, usage=client.usage, errors=client.errors[:20])
        r["flagged"] = sum(1 for j in sample if j.get("_flag"))
        r["sizes"] = sizes([j for j in sample if j.get("ai")])
        for j in sample:                          # what is written: never the description
            out = N.public(j)
            out["textChars"] = len(j.get("_text") or "")     # how much of the post the AI could read (not the text itself)
            if j.get("_sum"):
                out["sum"] = j["_sum"]
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
    log.info("wrote %s (%d sample jobs, %d with AI data)", out_dir / "report.md", len(r["jobs"]), r["ai"]["done"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
