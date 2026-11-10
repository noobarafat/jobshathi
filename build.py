#!/usr/bin/env python3
"""Build JobShathi into dist/.

dist/index.html  one self-contained page: src/index.html with every
                 <!-- @inline name --> line replaced by the file src/name
dist/manifest.webmanifest, dist/sw.js, dist/icons/   copied from pwa/
dist/jobs.json   copied from jobs.json when that file exists (the job robot writes it)

Run:  python3 build.py
"""
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC, PWA, DIST = ROOT / 'src', ROOT / 'pwa', ROOT / 'dist'
INLINE = re.compile(r'^<!-- @inline ([\w.-]+) -->$', re.M)


def inline(match):
    text = (SRC / match.group(1)).read_text(encoding='utf-8')
    return text[:-1] if text.endswith('\n') else text


def main():
    page = INLINE.sub(inline, (SRC / 'index.html').read_text(encoding='utf-8'))
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    (DIST / 'index.html').write_text(page, encoding='utf-8')
    for item in PWA.iterdir():
        target = DIST / item.name
        shutil.copytree(item, target) if item.is_dir() else shutil.copy2(item, target)
    jobs = ROOT / 'jobs.json'
    if jobs.exists():
        shutil.copy2(jobs, DIST / 'jobs.json')
    size = (DIST / 'index.html').stat().st_size
    print(f'Built dist/ (index.html {size / 1024:.0f} KB)')


if __name__ == '__main__':
    main()
