#!/usr/bin/env python3
"""Build JobShathi into dist/.

dist/index.html  one self-contained page: src/index.html with every
                 <!-- @inline name --> line replaced by the file src/name
dist/worker.js   the job reader that runs away from the screen: src/taxonomy.js,
                 src/locations.js, src/engine.js and src/worker.js in one file
dist/manifest.webmanifest, dist/sw.js, dist/icons/   copied from pwa/ (sw.js is told
                 the worker's address, so the app opens offline with it)
dist/version.json  the fingerprint of this build
dist/jobs.json   copied from jobs.json when that file exists (the job robot writes it)

The fingerprint covers the page and the worker, so it changes whenever either does. The page loads
worker.js?v=<fingerprint>: a new page never runs with an old worker from a browser's cache.

Run:  python3 build.py
"""
import hashlib
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC, PWA, DIST = ROOT / 'src', ROOT / 'pwa', ROOT / 'dist'
VERSION_MARK = '__APP_VERSION__'
WORKER_MARK = '__WORKER_URL__'
WORKER_PARTS = ('taxonomy.js', 'locations.js', 'engine.js', 'worker.js')
INLINE = re.compile(r'^<!-- @inline ([\w.-]+) -->$', re.M)


def inline(match):
    text = (SRC / match.group(1)).read_text(encoding='utf-8')
    return text[:-1] if text.endswith('\n') else text


def main():
    page = INLINE.sub(inline, (SRC / 'index.html').read_text(encoding='utf-8'))
    worker = '\n'.join((SRC / name).read_text(encoding='utf-8') for name in WORKER_PARTS)
    # The fingerprint changes only when the page or the worker changes (not when jobs.json does).
    # The running app compares it with version.json to offer "Update available"; the worker uses it
    # to know when its saved reading of the jobs was made by other rules.
    version = hashlib.sha256((page + '\0' + worker).encode('utf-8')).hexdigest()[:12]
    worker_url = f'worker.js?v={version}'
    page = page.replace(VERSION_MARK, version).replace(WORKER_MARK, worker_url)
    worker = worker.replace(VERSION_MARK, version)
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    (DIST / 'index.html').write_text(page, encoding='utf-8')
    (DIST / 'worker.js').write_text(worker, encoding='utf-8')
    for item in PWA.iterdir():
        target = DIST / item.name
        shutil.copytree(item, target) if item.is_dir() else shutil.copy2(item, target)
    sw = (DIST / 'sw.js').read_text(encoding='utf-8')
    (DIST / 'sw.js').write_text(sw.replace(WORKER_MARK, worker_url), encoding='utf-8')
    (DIST / 'version.json').write_text(json.dumps({'v': version}), encoding='utf-8')
    jobs = ROOT / 'jobs.json'
    if jobs.exists():
        shutil.copy2(jobs, DIST / 'jobs.json')
    size = (DIST / 'index.html').stat().st_size
    print(f'Built dist/ (index.html {size / 1024:.0f} KB, worker.js {len(worker.encode()) / 1024:.0f} KB, version {version})')


if __name__ == '__main__':
    main()
