"""Reading schema.org JobPosting data out of a page.

Most job portals and company career pages publish a JSON-LD JobPosting block.
Reading that is far steadier than CSS selectors: a redesign does not break it.
"""
from __future__ import annotations

import json
import re

BLOCK = re.compile(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
                   re.I | re.S)


def _walk(node, out):
    if isinstance(node, list):
        for x in node:
            _walk(x, out)
    elif isinstance(node, dict):
        t = node.get("@type")
        types = t if isinstance(t, list) else [t]
        if any(str(x).lower() == "jobposting" for x in types if x):
            out.append(node)
        for key in ("@graph", "itemListElement", "mainEntity"):
            if key in node:
                _walk(node[key], out)


def job_postings(page_html: str) -> list[dict]:
    """Every JobPosting object a page carries."""
    found: list[dict] = []
    for raw in BLOCK.findall(page_html or ""):
        raw = raw.strip()
        if "JobPosting" not in raw:
            continue
        try:
            _walk(json.loads(raw), found)
        except (ValueError, TypeError):
            # some sites emit trailing commas or stray HTML comments
            cleaned = re.sub(r"<!--.*?-->", "", raw, flags=re.S)
            cleaned = re.sub(r",\s*([}\]])", r"\1", cleaned)
            try:
                _walk(json.loads(cleaned), found)
            except (ValueError, TypeError):
                continue
    return found


def first(node, *path, default=None):
    """Safe nested read: first(ld, 'hiringOrganization', 'name')."""
    cur = node
    for key in path:
        if isinstance(cur, list):
            cur = cur[0] if cur else None
        if not isinstance(cur, dict):
            return default
        cur = cur.get(key)
    if isinstance(cur, list):
        cur = cur[0] if cur else None
    return default if cur is None else cur


def place_of(ld) -> tuple[str, bool]:
    """A JobPosting's location line, and whether it is remote."""
    from normalise import place_text, text_of
    remote = "telecommute" in str(ld.get("jobLocationType", "")).lower()
    loc = ld.get("jobLocation")
    if isinstance(loc, list):
        loc = loc[0] if loc else None
    addr = (loc or {}).get("address") if isinstance(loc, dict) else None
    if isinstance(addr, str):
        return text_of(addr), remote
    addr = addr or {}
    line = place_text(addr.get("streetAddress"), addr.get("addressLocality"),
                      addr.get("addressRegion"))
    if not line and remote:
        line = "Remote"
    return line, remote


def salary_of(ld) -> str:
    """baseSalary -> the short wording the engine reads, e.g. 'Tk. 20000 - 25000'."""
    from normalise import text_of
    base = ld.get("baseSalary")
    if isinstance(base, list):
        base = base[0] if base else None
    if not isinstance(base, dict):
        return text_of(base) if base else ""
    value = base.get("value")
    if isinstance(base.get("value"), list):
        value = base["value"][0] if base["value"] else None
    if not isinstance(value, dict):
        return text_of(value) if value else ""
    lo, hi, one = value.get("minValue"), value.get("maxValue"), value.get("value")
    cur = str(base.get("currency") or "").upper()
    unit = "Tk." if cur in ("BDT", "") else cur
    if lo and hi and str(lo) != str(hi):
        return f"{unit} {lo} - {hi}"
    only = one or lo or hi
    return f"{unit} {only}" if only else ""
