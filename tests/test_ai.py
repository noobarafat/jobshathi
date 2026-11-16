"""Tests for the AI step (robot/ai.py). No network: the Gemini service is faked.

Run from the repository root:  python3 -m unittest discover -s tests -p "test_*.py"
"""
import json
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "robot"))
sys.path.insert(0, str(ROOT / "tests"))

import ai                                    # noqa: E402
import normalise as N                        # noqa: E402
from fake_gemini import FakeResponse, FakeSession, good_item, interactions_payload   # noqa: E402

FIELDS = ai.fields_from_repo()
KEY = "TEST-KEY-123"


def posts(n):
    return [N.post(id=f"t:{i}", title=f"Job {i}", company="Test Co", loc="Dhaka", url=f"https://example.com/{i}",
                   text="We need a developer who knows JavaScript.") for i in range(1, n + 1)]


def client(session, **kw):
    kw.setdefault("max_requests", 20)
    return ai.Gemini(KEY, ["model-a", "model-b"], pause=0, session=session, sleep=lambda s: None, **kw)


def reply(items, status="completed"):
    return FakeResponse(200, interactions_payload({"jobs": items}, status))


class Enrich(unittest.TestCase):
    def test_every_post_gets_fields_and_both_summaries(self):
        s, jobs = FakeSession(), posts(8)
        stats = ai.enrich(jobs, client(s), FIELDS, posts_per_call=6)
        self.assertEqual(len(s.calls), 2)                       # 6 + 2 posts: two requests, not eight
        self.assertEqual(stats["done"], 8)
        for j in jobs:
            self.assertEqual(j["ai"]["field"], "it")
            self.assertEqual(j["ai"]["skills"], ["JavaScript", "React"])
            self.assertTrue(j["_sum"]["en"] and j["_sum"]["bn"])
            self.assertNotIn("aiSkip", j)

    def test_a_post_is_never_sent_twice(self):
        s, jobs = FakeSession(), posts(5)
        c = client(s)
        ai.enrich(jobs, c, FIELDS)
        before = len(s.calls)
        stats = ai.enrich(jobs, c, FIELDS)
        self.assertEqual(len(s.calls), before)
        self.assertEqual(stats["wanted"], 0)

    def test_a_bad_answer_is_asked_for_once_more(self):
        bad = good_item(2, field="astrology")
        s = FakeSession(script=[reply([good_item(1), bad, good_item(3)])])
        jobs = posts(3)
        stats = ai.enrich(jobs, client(s), FIELDS)
        self.assertEqual(len(s.calls), 2)
        self.assertEqual(FakeSession.numbers(s.calls[1]["body"]), [2])      # only the failed post goes again
        self.assertEqual(stats["done"], 3)
        self.assertEqual(stats["askedAgain"], 1)

    def test_failing_twice_keeps_the_post_with_basic_fields_only(self):
        bad = good_item(1, bn="This is not Bangla at all, sorry.")
        s = FakeSession(script=[reply([bad]), reply([bad])])
        jobs = posts(1)
        c = client(s)
        stats = ai.enrich(jobs, c, FIELDS)
        self.assertEqual(stats["failedCheck"], 1)
        self.assertEqual(jobs[0]["aiSkip"], "invalid")
        self.assertNotIn("ai", jobs[0])
        self.assertEqual(jobs[0]["title"], "Job 1")              # the basic fields are untouched
        ai.enrich(jobs, c, FIELDS)
        self.assertEqual(len(s.calls), 2)                        # and it is not sent a third time

    def test_an_answer_that_is_not_json_is_retried(self):
        s = FakeSession(script=[FakeResponse(200, interactions_payload("Sorry, I cannot do that."))])
        jobs = posts(2)
        stats = ai.enrich(jobs, client(s), FIELDS)
        self.assertEqual(stats["done"], 2)
        self.assertEqual(len(s.calls), 2)

    def test_a_cut_off_answer_is_retried(self):
        s = FakeSession(script=[reply([good_item(1)], status="incomplete")])
        jobs = posts(1)
        self.assertEqual(ai.enrich(jobs, client(s), FIELDS)["done"], 1)

    def test_json_inside_code_fences_is_read(self):
        text = "```json\n" + json.dumps({"jobs": [good_item(1)]}, ensure_ascii=False) + "\n```"
        s = FakeSession(script=[FakeResponse(200, interactions_payload(text))])
        self.assertEqual(ai.enrich(posts(1), client(s), FIELDS)["done"], 1)

    def test_links_never_come_from_the_ai(self):
        s = FakeSession(item=lambda n: good_item(n, url="https://evil.example/apply", applyLink="https://evil.example"))
        jobs = posts(1)
        ai.enrich(jobs, client(s), FIELDS)
        self.assertEqual(jobs[0]["url"], "https://example.com/1")
        self.assertNotIn("evil.example", json.dumps(jobs[0]))

    def test_a_scam_flag_is_carried_with_its_reason(self):
        s = FakeSession(item=lambda n: good_item(n, scam=True, scamWhy="Asks for a registration fee"))
        jobs = posts(1)
        ai.enrich(jobs, client(s), FIELDS)
        self.assertEqual(jobs[0]["_flag"], "Asks for a registration fee")

    def test_descriptions_and_private_keys_never_reach_the_file(self):
        jobs = posts(1)
        ai.enrich(jobs, client(FakeSession()), FIELDS)
        out = N.public(jobs[0])
        self.assertNotIn("_text", out)
        self.assertNotIn("_sum", out)
        self.assertIn("ai", out)


class Service(unittest.TestCase):
    def test_rate_limit_once_waits_and_goes_on(self):
        s = FakeSession(script=[FakeResponse(429, {"error": {"status": "RESOURCE_EXHAUSTED", "message": "slow down"}})])
        c = client(s)
        stats = ai.enrich(posts(2), c, FIELDS)
        self.assertEqual(stats["done"], 2)
        self.assertEqual(c.waits, 1)

    def test_rate_limit_twice_stops_and_leaves_posts_for_the_next_run(self):
        limit = FakeResponse(429, {"error": {"message": "quota"}})
        s = FakeSession(script=[limit, limit])
        jobs = posts(3)
        stats = ai.enrich(jobs, client(s), FIELDS)
        self.assertIn("rate limit", stats["stopped"])
        self.assertTrue(all(ai.needs_ai(j) for j in jobs))        # not marked as failed: they get another chance

    def test_request_cap_stops_the_run(self):
        s, jobs = FakeSession(), posts(12)
        stats = ai.enrich(jobs, client(s, max_requests=1), FIELDS, posts_per_call=6)
        self.assertEqual(len(s.calls), 1)
        self.assertEqual(stats["done"], 6)
        self.assertIn("cap", stats["stopped"])
        self.assertEqual(sum(1 for j in jobs if ai.needs_ai(j)), 6)

    def test_a_refused_request_shape_falls_back_and_is_remembered(self):
        refuse = FakeResponse(400, {"error": {"message": "Unknown field schema"}})
        s = FakeSession(script=[refuse])
        c = client(s)
        stats = ai.enrich(posts(8), c, FIELDS, posts_per_call=6)
        self.assertEqual(stats["done"], 8)
        self.assertEqual(c.shape, "interactions+json")
        self.assertEqual(len(s.calls), 3)                         # 1 refused + 2 that worked
        self.assertNotIn("schema", s.calls[2]["body"]["response_format"])

    def test_an_unknown_model_moves_on_to_the_next_model(self):
        gone = FakeResponse(404, {"error": {"message": "model not found"}})
        s = FakeSession(script=[gone, gone])
        c = client(s)
        self.assertEqual(ai.enrich(posts(1), c, FIELDS)["done"], 1)
        self.assertEqual(c.model, "model-b")
        self.assertIn("generateContent", s.calls[1]["url"])       # the older API was tried for model-a first

    def test_the_older_api_answer_is_understood(self):
        gone = FakeResponse(404, {"error": {"message": "no such method"}})
        old = FakeResponse(200, {"candidates": [{"content": {"parts": [{"text": json.dumps({"jobs": [good_item(1)]}, ensure_ascii=False)}]}}],
                                 "usageMetadata": {"promptTokenCount": 10, "candidatesTokenCount": 5}})
        s = FakeSession(script=[gone, old])
        c = client(s)
        self.assertEqual(ai.enrich(posts(1), c, FIELDS)["done"], 1)
        self.assertEqual(c.shape, "generateContent")
        self.assertEqual(c.usage["input"], 10)

    def test_a_refused_key_stops_at_once_and_is_never_shown(self):
        s = FakeSession(script=[FakeResponse(403, {"error": {"message": f"API key {KEY} is not valid"}})])
        jobs = posts(2)
        c = client(s)
        stats = ai.enrich(jobs, c, FIELDS)
        self.assertIn("refused", stats["stopped"])
        self.assertNotIn(KEY, stats["stopped"])
        self.assertNotIn(KEY, " ".join(c.errors))
        self.assertEqual(len(s.calls), 1)
        self.assertTrue(all(ai.needs_ai(j) for j in jobs))

    def test_no_key_means_no_request(self):
        s = FakeSession()
        c = ai.Gemini("", ["model-a"], pause=0, session=s, sleep=lambda x: None)
        stats = ai.enrich(posts(1), c, FIELDS)
        self.assertIn("GEMINI_API_KEY", stats["stopped"])
        self.assertEqual(len(s.calls), 0)

    def test_the_key_travels_only_in_the_header_and_nothing_is_stored(self):
        s = FakeSession()
        ai.enrich(posts(1), client(s), FIELDS)
        call = s.calls[0]
        self.assertEqual(call["headers"]["x-goog-api-key"], KEY)
        self.assertNotIn(KEY, call["url"])
        self.assertNotIn(KEY, json.dumps(call["body"]))
        self.assertIs(call["body"]["store"], False)


class Checks(unittest.TestCase):
    def test_empty_and_unknown_values_are_not_stored(self):
        got = ai.check_item(good_item(1, minYears=-1, maxYears=-1, area="", nice=[], salary="", mode="unknown", deadline="soon"), FIELDS)
        for k in ("minYears", "maxYears", "area", "nice", "salary", "mode", "deadline"):
            self.assertNotIn(k, got["ai"])

    def test_wrong_values_are_refused(self):
        for over in ({"field": "magic"}, {"level": "expert"}, {"skills": "JavaScript"}, {"scam": "no"},
                     {"minYears": 99}, {"en": ""}, {"bn": "only english here"}, {"en": "বাংলা লেখা ইংরেজি ঘরে, যা ভুল।" * 2}):
            with self.assertRaises(ValueError, msg=str(over)):
                ai.check_item(good_item(1, **over), FIELDS)

    def test_skills_are_trimmed_deduplicated_and_capped(self):
        got = ai.check_item(good_item(1, skills=["React", "react", " SQL. "] + [f"S{i}" for i in range(20)]), FIELDS)
        self.assertEqual(got["ai"]["skills"][:2], ["React", "SQL"])
        self.assertEqual(len(got["ai"]["skills"]), 10)

    def test_fields_come_from_the_sites_own_dictionary(self):
        self.assertEqual(len(FIELDS), 20)
        self.assertEqual(FIELDS["it"], "IT & Software")
        self.assertIn("other", ai.schema(FIELDS)["properties"]["jobs"]["items"]["properties"]["field"]["enum"])

    def test_the_prompt_carries_the_post_and_its_text(self):
        text = ai.user_prompt([(1, posts(1)[0])])
        self.assertIn("### POST 1", text)
        self.assertIn("knows JavaScript", text)


if __name__ == "__main__":
    unittest.main()
