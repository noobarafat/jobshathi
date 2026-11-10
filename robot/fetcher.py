"""Polite HTTP for the JobShathi robot.

Rules every request obeys:
  1. A User-Agent that names the bot and links to the site.
  2. robots.txt is read once per host and every URL is checked against it.
  3. At least MIN_GAP seconds between two requests to the same host.
  4. A timeout, at most RETRIES retries, and a cap on pages read per host per run.
A host that fails is logged and skipped. One broken site never stops the run.
"""
from __future__ import annotations

import logging
import time
import urllib.robotparser
from collections import defaultdict
from urllib.parse import urlparse

import requests

UA = "JobShathiBot/1.0 (+https://noobarafat.github.io/jobshathi)"
MIN_GAP = 2.0          # seconds between requests to the same host
TIMEOUT = 25
RETRIES = 2
PAGE_CAP = 400         # pages per host per run

log = logging.getLogger("robot.fetch")


class Fetcher:
    def __init__(self, min_gap: float = MIN_GAP, page_cap: int = PAGE_CAP, obey_robots: bool = True):
        self.min_gap = min_gap
        self.page_cap = page_cap
        self.obey_robots = obey_robots
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": UA,
            "Accept": "text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8",
            "Accept-Language": "en,bn;q=0.8",
        })
        self._last: dict[str, float] = defaultdict(float)
        self._count: dict[str, int] = defaultdict(int)
        self._robots: dict[str, urllib.robotparser.RobotFileParser | None] = {}
        self.blocked: list[str] = []
        self.failed: list[str] = []

    # ── robots.txt ──
    def _robots_for(self, host: str):
        if host in self._robots:
            return self._robots[host]
        rp = urllib.robotparser.RobotFileParser()
        url = f"https://{host}/robots.txt"
        try:
            r = self.session.get(url, timeout=TIMEOUT)
            ctype = (r.headers.get("content-type") or "").lower()
            # A site with no robots.txt often answers with its app shell. That is not a rules file.
            if r.status_code != 200 or "html" in ctype or "<html" in r.text[:400].lower():
                log.info("%s: no robots.txt (nothing disallowed)", host)
                rp = None
            else:
                rp.parse(r.text.splitlines())
        except requests.RequestException as e:
            log.warning("%s: could not read robots.txt (%s); treating as no rules", host, e)
            rp = None
        self._robots[host] = rp
        return rp

    def allowed(self, url: str) -> bool:
        if not self.obey_robots:
            return True
        host = urlparse(url).netloc
        rp = self._robots_for(host)
        if rp is None:
            return True
        ok = rp.can_fetch(UA, url) and rp.can_fetch("*", url)
        if not ok:
            self.blocked.append(url)
            log.warning("robots.txt disallows %s", url)
        return ok

    def crawl_delay(self, host: str) -> float:
        rp = self._robots_for(host)
        if rp is None:
            return self.min_gap
        try:
            d = rp.crawl_delay(UA) or rp.crawl_delay("*")
        except Exception:
            d = None
        return max(self.min_gap, float(d)) if d else self.min_gap

    # ── one request ──
    def get(self, url: str, *, as_json: bool = False, cap: bool = True):
        """Returns text, parsed JSON, or None. Never raises."""
        host = urlparse(url).netloc
        if not self.allowed(url):
            return None
        if cap and self._count[host] >= self.page_cap:
            log.info("%s: page cap (%d) reached, stopping this host", host, self.page_cap)
            return None

        gap = self.crawl_delay(host)
        for attempt in range(RETRIES + 1):
            wait = gap - (time.monotonic() - self._last[host])
            if wait > 0:
                time.sleep(wait)
            self._last[host] = time.monotonic()
            try:
                r = self.session.get(url, timeout=TIMEOUT)
                self._count[host] += 1
                if r.status_code == 429 or 500 <= r.status_code < 600:
                    raise requests.HTTPError(f"status {r.status_code}")
                if r.status_code != 200:
                    log.warning("%s -> %s", url, r.status_code)
                    return None
                return r.json() if as_json else r.text
            except (requests.RequestException, ValueError) as e:
                if attempt == RETRIES:
                    log.warning("%s failed after %d tries: %s", url, RETRIES + 1, e)
                    self.failed.append(url)
                    return None
                time.sleep(gap * (attempt + 1))
        return None

    def pages_read(self) -> dict[str, int]:
        return dict(self._count)
