"""A stand-in for the Gemini service, for tests and for `robot/pilot.py --fake-ai`.

It answers the same request shapes the real service does, with made-up but well-formed
data, so the whole pipeline can be exercised on a computer that has no API key.
Nothing here talks to the network.
"""
from __future__ import annotations

import json
import re


class FakeResponse:
    def __init__(self, status: int, payload, headers=None):
        self.status_code, self._payload, self.headers = status, payload, headers or {}
        self.text = json.dumps(payload) if not isinstance(payload, str) else payload

    def json(self):
        if isinstance(self._payload, str):
            raise ValueError("not JSON")
        return self._payload


def good_item(n: int, **over) -> dict:
    item = {
        "n": n, "title": f"Sample Job {n}", "field": "it", "level": "junior", "minYears": 1, "maxYears": 2,
        "mode": "onsite", "jobType": "full", "city": "Dhaka", "area": "Banani",
        "skills": ["JavaScript", "React"], "nice": ["TypeScript"], "edu": "bachelor",
        "salary": "Tk. 30,000 - 40,000 per month", "deadline": "2026-12-31",
        "en": f"Build and maintain web features for post {n}. Needs 1 to 2 years of JavaScript experience.",
        "bn": "ওয়েব ফিচার তৈরি ও রক্ষণাবেক্ষণের কাজ। JavaScript-এ ১ থেকে ২ বছরের অভিজ্ঞতা লাগবে।",
        "scam": False, "scamWhy": "",
    }
    item.update(over)
    return item


def interactions_payload(obj, status="completed") -> dict:
    return {"id": "fake", "object": "interaction", "status": status,
            "usage": {"total_input_tokens": 900, "total_output_tokens": 400, "total_thought_tokens": 20},
            "steps": [{"type": "thought", "signature": "x"},
                      {"type": "model_output", "content": [{"type": "text", "text": obj if isinstance(obj, str) else json.dumps(obj, ensure_ascii=False)}]}]}


class FakeSession:
    """Scripted replies first (a list of FakeResponse or callables), then well-formed answers."""

    def __init__(self, script=None, item=good_item):
        self.script = list(script or [])
        self.item = item
        self.calls: list[dict] = []          # every request: url, body, headers

    def post(self, url, json=None, headers=None, timeout=None):
        self.calls.append({"url": url, "body": json, "headers": dict(headers or {})})
        if self.script:
            reply = self.script.pop(0)
            return reply(url, json) if callable(reply) else reply
        return FakeResponse(200, interactions_payload({"jobs": [self.item(n) for n in self.numbers(json)]}))

    @staticmethod
    def numbers(body) -> list[int]:
        text = body.get("input") if isinstance(body.get("input"), str) else ""
        if not text:                                             # generateContent shape
            text = " ".join(p.get("text", "") for c in body.get("contents", []) for p in c.get("parts", []))
        return [int(n) for n in re.findall(r"^### POST (\d+)$", text, re.M)]
