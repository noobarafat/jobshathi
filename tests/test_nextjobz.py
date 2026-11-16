"""Tests for the NextJobz reader (robot/sources/nextjobz.py). No network.

The page below is a small hand-made copy of the site's layout, not a real post.
"""
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "robot"))

from sources import nextjobz                  # noqa: E402

GOV_URL = "https://nextjobz.com.bd/gov-jobs/assistant-manager-chemical-bd-government-job-SSR1793521971346"
JOB_URL = "https://nextjobz.com.bd/jobs/junior-accountant-dhaka-IJOB202683272"
GOV_PAGE = '''<html><body><h1>Assistant Manager (Chemical)</h1>
<script type="application/ld+json">{"@context": "https://schema.org/", "@type": "JobPosting", "title": "Assistant Manager (Chemical)",
 "identifier": {"@type": "PropertyValue", "name": "ACME POWER STATION", "value": "SSR1793521971346"},
 "datePosted": "2026-10-28T18:00:00.000Z", "validThrough": "2026-11-30T11:00:00.000Z", "employmentType": "FULL_TIME",
 "hiringOrganization": {"@type": "Organization", "name": "ACME POWER STATION", "sameAs": "https://www.example.gov.bd"},
 "jobLocation": {"@type": "Place", "address": {"@type": "PostalAddress", "addressCountry": "BD"}},
 "qualifications": "শিক্ষাগত যোগ্যতা: স্নাতক ডিগ্রি",
 "description": "<p>প্রার্থীগণ পরীক্ষার ফি বাবদ ২২৩/- টাকা জমা প্রদান করবেন। Tk.112 will be charged as application fee.</p>"}</script></body></html>'''
SITEMAP = f"<urlset><url><loc>{GOV_URL}</loc><lastmod>2026-11-15</lastmod></url><url><loc>{JOB_URL}</loc><lastmod>2026-11-16</lastmod></url></urlset>"


class FakeFetcher:
    def __init__(self, pages):
        self.pages, self.asked = pages, []

    def get(self, url, *, as_json=False, cap=True):
        self.asked.append(url)
        return self.pages.get(url)


class NextJobz(unittest.TestCase):
    def test_a_government_page_is_read_and_filed_under_government(self):
        job = nextjobz._one(GOV_PAGE, GOV_URL)
        self.assertEqual((job["id"], job["title"], job["cat"]), ("nextjobz:SSR1793521971346", "Assistant Manager (Chemical)", "Government"))
        self.assertEqual((job["postedAt"], job["deadline"]), ("2026-10-28", "2026-11-30"))
        self.assertIn("টাকা জমা", job["_text"])                       # the fee wording is passed on; run.py knows a government fee is official

    def test_a_page_already_collected_is_not_fetched_again(self):
        f = FakeFetcher({nextjobz.SITEMAP: SITEMAP, GOV_URL: GOV_PAGE})
        jobs = nextjobz.collect(f, known_ids={"nextjobz:IJOB202683272"}, limit=10)
        self.assertEqual([j["id"] for j in jobs], ["nextjobz:SSR1793521971346"])
        self.assertNotIn(JOB_URL, f.asked)
        again = FakeFetcher({nextjobz.SITEMAP: SITEMAP})
        self.assertEqual(nextjobz.collect(again, known_ids={"nextjobz:IJOB202683272", "nextjobz:SSR1793521971346"}, limit=10), [])
        self.assertEqual(again.asked, [nextjobz.SITEMAP])            # government pages are recognised as known too


if __name__ == "__main__":
    unittest.main()
