#!/usr/bin/env python3
"""Build JobShathi into dist/.

dist/index.html  one self-contained page: src/index.html with every
                 <!-- @inline name --> line replaced by the file src/name
dist/manifest.webmanifest, dist/sw.js, dist/icons/   copied from pwa/
dist/version.json  the fingerprint of this build of the page
dist/jobs.json   copied from jobs.json when that file exists (the job robot writes it)

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
INLINE = re.compile(r'^<!-- @inline ([\w.-]+) -->$', re.M)


def inline(match):
    text = (SRC / match.group(1)).read_text(encoding='utf-8')
    return text[:-1] if text.endswith('\n') else text


def main():
    page = INLINE.sub(inline, (SRC / 'index.html').read_text(encoding='utf-8'))
    # The fingerprint changes only when the page itself changes (not when jobs.json does).
    # The running app compares it with version.json to offer "Update available".
    version = hashlib.sha256(page.encode('utf-8')).hexdigest()[:12]
    page = page.replace(VERSION_MARK, version)
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    (DIST / 'index.html').write_text(page, encoding='utf-8')
    for item in PWA.iterdir():
        target = DIST / item.name
        shutil.copytree(item, target) if item.is_dir() else shutil.copy2(item, target)
    (DIST / 'version.json').write_text(json.dumps({'v': version}), encoding='utf-8')
    jobs = ROOT / 'jobs.json'
    if jobs.exists():
        shutil.copy2(jobs, DIST / 'jobs.json')
    size = (DIST / 'index.html').stat().st_size
    print(f'Built dist/ (index.html {size / 1024:.0f} KB, version {version})')


if __name__ == '__main__':
    main()
