"""Tests for the daily robot's own rules (robot/run.py). No network, no node.

Run from the repository root:  python3 -m unittest discover -s tests -p "test_*.py"
"""
import json
import pathlib
import sys
import tempfile
import unittest
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "robot"))

import normalise as N                        # noqa: E402
import run                                   # noqa: E402

TODAY = date(2026, 11, 16)
POLYGON = {"id": "sr-polygon", "type": "smartrecruiters", "company": "PolygonTechnology", "enabled": True}
SOURCES = [{"id": "nextjobz", "type": "nextjobz", "enabled": True}, {"id": "remote", "type": "remote_boards", "enabled": True}, POLYGON]


def job(jid, title="Officer", company="Acme", posted="2026-11-10", url="https://example.com/job", **more):
    return {"id": jid, "title": title, "company": company, "postedAt": posted, "url": url, "source": "Test", **more}


class Sources(unittest.TestCase):
    def test_the_real_sources_file_is_valid_and_the_ai_step_is_off(self):
        cfg = run.load_config()
        ids = [s["id"] for s in cfg["sources"]]
        self.assertEqual(len(ids), len(set(ids)), "source ids must be unique")
        for s in cfg["sources"]:
            self.assertTrue(run.prefixes(s), f"{s['id']}: unknown type {s.get('type')}")
            self.assertRegex(s["id"], r"^[a-z0-9-]+$")
        self.assertIs(cfg["ai"]["enabled"], False)
        self.assertIs(cfg["ai"].get("summaries"), False)

    def test_a_missing_or_broken_file_falls_back_to_the_original_sources(self):
        with tempfile.TemporaryDirectory() as d:
            bad = pathlib.Path(d) / "sources.json"
            bad.write_text("{ not json", encoding="utf-8")
            for path in (bad, pathlib.Path(d) / "absent.json"):
                cfg = run.load_config(path)
                self.assertEqual([s["id"] for s in cfg["sources"]], ["nextjobz", "alljobs", "remote", "companies"])
                self.assertIs(cfg["ai"]["enabled"], False)

    def test_the_ai_step_does_nothing_and_needs_no_key_when_switched_off(self):
        fresh = [job("nextjobz:1", _text="some text")]
        self.assertEqual(run.ai_step(fresh, {"enabled": False, "models": ["x"]}), {"enabled": False})
        self.assertEqual(run.ai_step(fresh, {}), {"enabled": False})
        self.assertNotIn("ai", fresh[0])

    def test_switching_a_source_off_removes_its_posts(self):
        jobs = [job("nextjobz:1"), job("jobicy:9"), job("remoteok:3"), job("smartrecruiters:PolygonTechnology:7")]
        off = [dict(s, enabled=(s["id"] != "remote")) for s in SOURCES]
        kept, n = run.drop_switched_off(jobs, off)
        self.assertEqual([j["id"] for j in kept], ["nextjobz:1", "smartrecruiters:PolygonTechnology:7"])
        self.assertEqual(n, 2)
        self.assertEqual(run.drop_switched_off(jobs, SOURCES), (jobs, 0))


class Boards(unittest.TestCase):
    def setUp(self):
        self.jobs = [job("smartrecruiters:PolygonTechnology:1"), job("smartrecruiters:PolygonTechnology:2"),
                     job("smartrecruiters:PolygonTechnology:3"), job("smartrecruiters:Other:1"), job("nextjobz:5")]

    def test_a_post_the_board_no_longer_lists_is_removed(self):
        info = {"ok": True, "ids": ["smartrecruiters:PolygonTechnology:1", "smartrecruiters:PolygonTechnology:3"]}
        kept, n, note = run.drop_closed(self.jobs, POLYGON, info)
        self.assertEqual(n, 1)
        self.assertNotIn("smartrecruiters:PolygonTechnology:2", [j["id"] for j in kept])
        self.assertIn("smartrecruiters:Other:1", [j["id"] for j in kept])       # another board is untouched
        self.assertEqual(note, "")

    def test_nothing_is_removed_when_the_board_could_not_be_read(self):
        kept, n, _ = run.drop_closed(self.jobs, POLYGON, {"ok": False, "ids": []})
        self.assertEqual((len(kept), n), (5, 0))
        kept, n, _ = run.drop_closed(self.jobs, POLYGON, {"error": "timeout"})
        self.assertEqual((len(kept), n), (5, 0))

    def test_a_board_that_suddenly_lists_nothing_keeps_its_posts(self):
        kept, n, note = run.drop_closed(self.jobs, POLYGON, {"ok": True, "ids": []})
        self.assertEqual((len(kept), n), (5, 0))
        self.assertIn("kept its 3 posts", note)

    def test_an_old_post_stays_while_its_board_lists_it(self):
        old = job("smartrecruiters:PolygonTechnology:1", title="Engineer", posted="2026-07-02")
        portal = job("nextjobz:1", title="Accountant", posted="2026-07-02")
        kept, counts = run.clean([old, portal], TODAY, keep_while_listed=("smartrecruiters:PolygonTechnology:",))
        self.assertEqual([j["id"] for j in kept], ["smartrecruiters:PolygonTechnology:1"])
        self.assertEqual(counts["too_old"], 1)


class Clean(unittest.TestCase):
    def test_expired_linkless_and_money_asking_posts_are_left_out(self):
        jobs = [job("a:1", title="Good"), job("a:2", title="Expired", deadline="2026-11-01"),
                job("a:3", title="No link", url=""), job("a:4", title="Not a link", url="call 017"),
                job("a:5", title="Scam", req="registration fee Tk. 500"), job("a:6", title="Scam in text", _text="Pay a security deposit first")]
        kept, counts = run.clean(jobs, TODAY)
        self.assertEqual([j["title"] for j in kept], ["Good"])
        self.assertEqual((counts["expired"], counts["no_apply_link"], counts["asks_for_money"]), (1, 2, 2))

    def test_the_thirty_day_rule_is_only_for_posts_with_no_deadline(self):
        open_still = job("a:1", title="Open", posted="2026-09-01", deadline="2026-12-10")
        no_deadline = job("a:2", title="Stale", posted="2026-09-01")
        kept, counts = run.clean([open_still, no_deadline], TODAY)
        self.assertEqual(([j["title"] for j in kept], counts["too_old"]), (["Open"], 1))

    def test_the_same_job_from_two_sources_is_one_post(self):
        a = job("a:1", title="Accountant", company="Shapla Agro Foods Ltd.", source="One")
        b = job("b:1", title="Accountant", company="Shapla Agro Foods Ltd", source="Two", salary="Tk. 20,000")
        kept, counts = run.clean([a, b], TODAY)
        self.assertEqual(len(kept), 1)
        self.assertEqual((kept[0]["alsoOn"], kept[0]["salary"], counts["merged"]), (["Two"], "Tk. 20,000", 1))


class Size(unittest.TestCase):
    def test_the_download_size_is_measured_the_way_the_site_serves_the_file(self):
        import gzip
        data = (json.dumps({"jobs": [job(f"a:{i}", title=f"Officer {i}") for i in range(200)]}, indent=1) + "\n").encode("utf-8")
        size = run.download_size(data)
        self.assertEqual(size["fileBytes"], len(data))
        self.assertEqual(size["downloadBytes"], len(gzip.compress(data, 5)))
        self.assertEqual((size["budgetBytes"], size["withinBudget"]), (350 * 1024, True))
        import os
        self.assertIs(run.download_size(os.urandom(400 * 1024))["withinBudget"], False)     # 400 KB that does not compress


class Keywords(unittest.TestCase):
    def test_skills_found_in_the_text_go_first_and_the_text_is_never_written(self):
        fresh = [job("a:1", req="Freshers are encouraged", _text="We use Excel and Tally every day."), job("a:2", req="x")]
        asked = []
        stats = run.add_keywords(fresh, ask=lambda posts: asked.extend(posts) or {"a:1": {"skills": ["Excel", "Tally"], "place": ""}})
        self.assertEqual([p["id"] for p in asked], ["a:1"])                    # only posts that have text are read
        self.assertEqual(fresh[0]["req"], "Excel, Tally, Freshers are encouraged")
        self.assertEqual(fresh[1]["req"], "x")
        self.assertEqual((stats["postsRead"], stats["postsWithSkills"]), (1, 1))
        self.assertNotIn("_text", N.public(fresh[0]))

    def test_without_node_the_posts_keep_what_they_had(self):
        fresh = [job("a:1", req="Freshers are encouraged", _text="Excel")]
        stats = run.add_keywords(fresh, ask=lambda posts: {})
        self.assertEqual(fresh[0]["req"], "Freshers are encouraged")
        self.assertIs(stats["ran"], False)

    def test_keywords_stay_within_the_size_limit(self):
        req = N.keywords_req([f"Skill {i}" for i in range(80)], "tail")
        self.assertLessEqual(len(req), 300)
        self.assertTrue(req.startswith("Skill 0, Skill 1"))


class Places(unittest.TestCase):
    def test_a_government_post_gets_a_place_only_from_the_file_or_the_organisations_name(self):
        jobs = [job("alljobs:1", company="Bangladesh Parliament Secretariat(BPS)"),
                job("alljobs:2", company="Ashuganj Power Station Company Ltd. (APSCL)"),
                job("alljobs:3", company="Bangladesh Post Office"),
                job("alljobs:4", company="Some Office", loc="Sylhet"),
                job("nextjobz:9", company="Bangladesh Parliament Secretariat")]
        asked = []
        stats = run.add_places(jobs, {"bangladesh parliament secretariat": "Dhaka"},
                               ask=lambda posts: asked.extend(posts) or {"alljobs:2": {"skills": [], "place": "Brahmanbaria"}, "alljobs:3": {"skills": [], "place": ""}})
        self.assertEqual([j.get("loc", "") for j in jobs], ["Dhaka", "Brahmanbaria", "", "Sylhet", ""])
        self.assertEqual([p["id"] for p in asked], ["alljobs:2", "alljobs:3"])  # the file is tried first; other sources are never touched
        self.assertEqual((stats["fromOrgPlacesFile"], stats["fromOrganisationName"], stats["stillWithoutPlace"]), (1, 1, 1))

    def test_the_org_places_file_is_valid(self):
        table = run.org_places()
        self.assertIn("bangladesh parliament secretariat", table)
        districts = set(json.dumps(__import__("re").findall(r"'([A-Z][^']+)'", (ROOT / "src" / "locations.js").read_text(encoding="utf-8"))))
        self.assertTrue(districts)
        for place in table.values():
            self.assertIn(place.split(", ")[-1], (ROOT / "src" / "locations.js").read_text(encoding="utf-8"), place)


class Review(unittest.TestCase):
    def test_a_post_that_seems_to_ask_for_money_is_held_back_and_listed_with_the_reason(self):
        fresh = [job("a:1", title="Good"), job("a:2", title="Fee", _text="Candidates must pay a registration fee of Tk. 500."),
                 job("a:3", title="From the AI", _flag="No real employer is named")]
        ok, flagged = run.hold_back(fresh, TODAY)
        self.assertEqual([j["id"] for j in ok], ["a:1"])
        self.assertEqual([(f["id"], f["why"], f["since"]) for f in flagged],
                         [("a:2", "asks candidates for money (rule)", "2026-11-16"), ("a:3", "No real employer is named", "2026-11-16")])
        self.assertTrue(all(f["url"] and f["title"] for f in flagged))            # enough for a person to open and judge
        self.assertNotIn("_text", json.dumps(flagged))

    def test_a_government_application_fee_is_not_a_scam(self):
        fee = "প্রার্থীগণ পরীক্ষার ফি বাবদ ২২৩/- টাকা জমা প্রদান করবেন। To pay fee send Tk. 112 by Teletalk SMS."
        gov = [job("alljobs:GJOB1", title="Driver", _text=fee),
               job("nextjobz:SSR1793521971346", title="Assistant Manager", _text=fee, url="https://nextjobz.com.bd/gov-jobs/assistant-manager-bd-government-job-SSR1793521971346"),
               job("nextjobz:1", title="Office Assistant", _text=fee, cat="Government")]
        private = job("nextjobz:IJOB1", _text=fee, url="https://nextjobz.com.bd/jobs/officer-IJOB1")
        ok, flagged = run.hold_back(gov + [private], TODAY)
        self.assertEqual([j["id"] for j in ok], [j["id"] for j in gov])
        self.assertEqual([f["id"] for f in flagged], ["nextjobz:IJOB1"])              # the same words from a private employer are held
        kept, counts = run.clean(gov, TODAY)
        self.assertEqual((len(kept), counts["asks_for_money"]), (3, 0))

    def test_the_review_queue_is_remembered_between_runs_and_old_entries_leave(self):
        with tempfile.TemporaryDirectory() as d:
            report = pathlib.Path(d) / "report.json"
            report.write_text(json.dumps({"flagged": [{"id": "a:2", "title": "Fee", "since": "2026-11-10"},
                                                      {"id": "a:9", "title": "Old", "since": "2026-09-01"}, {"title": "no id"}]}), encoding="utf-8")
            held = run.held_back(report, TODAY)
            self.assertEqual([h["id"] for h in held], ["a:2"])                    # so the robot does not fetch it again every run
            self.assertEqual(run.held_back(pathlib.Path(d) / "absent.json", TODAY), [])
            report.write_text("not json", encoding="utf-8")
            self.assertEqual(run.held_back(report, TODAY), [])


class Wording(unittest.TestCase):
    def test_the_experience_and_education_sentences_are_lifted_from_a_description(self):
        text = "Acme has 20 years of experience in the industry. Requirements: 3+ years of experience in Go. Bachelor degree in CSE."
        self.assertEqual(N.experience_line(text), "3+ years of experience")
        self.assertEqual(N.education_line(text), "Bachelor degree in CSE")
        self.assertEqual(N.experience_line("কমপক্ষে ২ বছরের অভিজ্ঞতা থাকতে হবে"), "2 বছরের অভিজ্ঞতা")
        self.assertEqual(N.experience_line("A friendly team and free lunch."), "")


if __name__ == "__main__":
    unittest.main()
