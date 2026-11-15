"""Tests for the company job-board readers (robot/sources/ats.py). No network.

The pages below are small hand-made copies of each system's layout, not real posts.
"""
import json
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "robot"))

from sources import ats                      # noqa: E402


class FakeFetcher:
    def __init__(self, pages):
        self.pages, self.asked = pages, []

    def get(self, url, *, as_json=False, cap=True):
        self.asked.append(url)
        got = self.pages.get(url)
        if got is None:
            return None
        return json.loads(got) if as_json else got


LEVER = json.dumps([
    {"id": "a1", "text": "Platform Engineer", "categories": {"location": "Dhaka", "team": "Software", "commitment": "Full-time", "allLocations": ["Dhaka"]},
     "descriptionPlain": "Run our platform.", "lists": [{"text": "Requirements", "content": "<li>3+ years of Go</li>"}], "additionalPlain": "",
     "hostedUrl": "https://jobs.lever.co/acme/a1", "createdAt": 1794000000000, "workplaceType": "hybrid"},
    {"id": "b2", "text": "Account Executive", "categories": {"location": "Minnesota", "commitment": "Full-time", "allLocations": ["Minnesota"]},
     "descriptionPlain": "Sell.", "hostedUrl": "https://jobs.lever.co/acme/b2", "createdAt": 1794000000000},
])

TRAKSTAR = json.dumps({"meta": {"total": 1}, "objects": [
    {"id": "fk1", "title": "Software Engineer - PHP", "client_name": "acme", "description": "<p>Laravel and <b>MySQL</b>.</p>",
     "location": {"city": "Dhaka", "state": "Dhaka Division", "country": "Bangladesh"}, "position_type": "full_time",
     "allows_remote": False, "team": "Engineering", "close_date": None, "hosted_url": "https://acme.hire.trakstar.com/jobs/fk1/"}]})

FT_LIST = '<a href="/jobs/AbC123xyz/junior-developer">Junior Developer</a> <a href="/jobs/AbC123xyz/junior-developer">again</a> <a href="/jobs/ZZ9aa8877/designer">Designer</a>'
FT_JOB = '''<html><script type="application/ld+json">{"@context": "http://schema.org/", "@type": "JobPosting",
 "title": "Junior Developer", "datePosted": "2026-11-01 04:32:17 UTC", "employmentType": "FULL_TIME", "remote": "true",
 "hiringOrganization": {"@type": "Organization", "name": "Acme Bangladesh Ltd"},
 "jobLocation": {"@type": "Place", "address": {"@type": "PostalAddress", "addressLocality": "Dhaka", "addressRegion": "Dhaka"}},
 "description": "<p>Write <b>Python</b> every day.</p>"}</script></html>'''

SR_LIST = '''<li class="opening-job"><a href="https://jobs.smartrecruiters.com/Acme/744000111-business-analyst" class="link--block"><h4>Business Analyst</h4></a></li>
<li class="opening-job"><a href="https://jobs.smartrecruiters.com/Acme/744000222-sqa-engineer"><h4>SQA Engineer</h4></a></li>'''
SR_JOB = '''<main itemscope itemtype="http://schema.org/JobPosting"><h1 class="job-title" itemprop="title">Business Analyst</h1>
<ul><li itemprop="jobLocation" itemscope itemtype="http://schema.org/Place"><span itemprop="address" itemscope itemtype="http://schema.org/PostalAddress">
<spl-job-location formattedAddress="x" workplaceType="hybrid"></spl-job-location><meta itemprop="addressCountry" content="Bangladesh"><meta itemprop="addressLocality" content="Dhaka"><meta itemprop="addressRegion" content="Dhaka"></span></li>
<li class="job-detail" itemprop="employmentType">Full-time</li></ul>
<div itemprop="hiringOrganization" itemscope itemtype="http://schema.org/Organization"><meta itemprop="name" content="Acme Technology"><meta itemprop="logo" content="https://c.example.com/logo.png"></div>
<meta itemprop="datePosted" content="2026-11-05T14:27:15.950Z"><meta itemprop="industry" content="Information Technology And Services">
<section><div class="wysiwyg" itemprop="responsibilities"><p>Prepare <strong>tender</strong> documents.</p><div><p>Work with clients.</p></div></div></section>
<section><div class="wysiwyg" itemprop="qualifications"><p>2 to 4 years of experience.</p></div></section></main>'''


class Readers(unittest.TestCase):
    def test_lever_keeps_only_the_wanted_place(self):
        f = FakeFetcher({"https://api.lever.co/v0/postings/acme?mode=json": LEVER})
        jobs, info = ats.collect_one(f, {"id": "x", "type": "lever", "company": "acme", "name": "Acme", "onlyPlaces": ["Dhaka"]})
        self.assertEqual(info["listed"], 1)
        self.assertEqual(len(jobs), 1)
        j = jobs[0]
        self.assertEqual((j["id"], j["title"], j["company"], j["source"]), ("lever:acme:a1", "Platform Engineer", "Acme", "Lever"))
        self.assertEqual(j["loc"], "Dhaka, Hybrid")
        self.assertEqual(j["url"], "https://jobs.lever.co/acme/a1")
        self.assertIn("3+ years of Go", j["_text"])
        self.assertRegex(j["postedAt"], r"^\d{4}-\d{2}-\d{2}$")

    def test_trakstar(self):
        f = FakeFetcher({"https://jsapi.recruiterbox.com/v1/openings?client_name=acme": TRAKSTAR})
        jobs, _ = ats.collect_one(f, {"id": "x", "type": "trakstar", "company": "acme", "name": "Acme Soft"})
        j = jobs[0]
        self.assertEqual((j["id"], j["company"], j["type"]), ("trakstar:acme:fk1", "Acme Soft", "Full-time"))
        self.assertEqual(j["_text"], "Laravel and MySQL .")
        self.assertTrue(j["postedAt"])                             # no date of its own: first seen today
        self.assertNotIn("deadline", j)

    def test_freshteam_reads_each_job_page_once(self):
        base = "https://acme.freshteam.com"
        f = FakeFetcher({base + "/jobs": FT_LIST, base + "/jobs/AbC123xyz/junior-developer": FT_JOB})
        jobs, info = ats.collect_one(f, {"id": "x", "type": "freshteam", "company": "acme"})
        self.assertEqual(info["listed"], 2)                        # the repeated link counts once
        self.assertEqual(len(jobs), 1)                             # the second page could not be read
        j = jobs[0]
        self.assertEqual((j["id"], j["company"], j["postedAt"]), ("freshteam:acme:AbC123xyz", "Acme Bangladesh Ltd", "2026-11-01"))
        self.assertIn("Remote", j["loc"])
        self.assertEqual(j["url"], base + "/jobs/AbC123xyz/junior-developer")

    def test_smartrecruiters_reads_the_public_career_pages(self):
        more = "https://careers.smartrecruiters.com/Acme/api/more"
        f = FakeFetcher({more + "?page=0": SR_LIST, "https://jobs.smartrecruiters.com/Acme/744000111-business-analyst": SR_JOB})
        jobs, info = ats.collect_one(f, {"id": "x", "type": "smartrecruiters", "company": "Acme"})
        self.assertEqual(info["listed"], 2)
        j = jobs[0]
        self.assertEqual((j["id"], j["title"], j["company"]), ("smartrecruiters:Acme:744000111", "Business Analyst", "Acme Technology"))
        self.assertEqual((j["loc"], j["type"], j["postedAt"]), ("Dhaka, Hybrid", "Full-time", "2026-11-05"))
        self.assertEqual(j["logo"], "https://c.example.com/logo.png")
        self.assertIn("tender documents", j["_text"])
        self.assertIn("Work with clients", j["_text"])            # nested blocks are read to the end
        self.assertIn("2 to 4 years", j["_text"])
        self.assertFalse(any("api.smartrecruiters.com" in u for u in f.asked))   # the blocked API host is never asked

    def test_smartrecruiters_location_filter(self):
        more = "https://careers.smartrecruiters.com/Acme/api/more"
        f = FakeFetcher({more + "?type=location&value=Dhaka%2C%20BD&page=0": SR_LIST})
        _, info = ats.collect_one(f, {"id": "x", "type": "smartrecruiters", "company": "Acme", "location": "Dhaka, BD"})
        self.assertEqual(info["listed"], 2)

    def test_known_posts_are_not_fetched_again(self):
        base = "https://acme.freshteam.com"
        f = FakeFetcher({base + "/jobs": FT_LIST, base + "/jobs/AbC123xyz/junior-developer": FT_JOB})
        jobs, _ = ats.collect_one(f, {"id": "x", "type": "freshteam", "company": "acme"},
                                  known_ids={"freshteam:acme:AbC123xyz", "freshteam:acme:ZZ9aa8877"})
        self.assertEqual(jobs, [])
        self.assertEqual(f.asked, [base + "/jobs"])

    def test_a_broken_source_reports_instead_of_crashing(self):
        jobs, info = ats.collect_one(FakeFetcher({}), {"id": "x", "type": "nonsense"})
        self.assertEqual(jobs, [])
        self.assertIn("unknown type", info["error"])
        jobs, info = ats.collect_one(FakeFetcher({}), {"id": "x", "type": "lever", "company": "acme"})
        self.assertEqual((jobs, info["listed"]), ([], 0))


if __name__ == "__main__":
    unittest.main()
