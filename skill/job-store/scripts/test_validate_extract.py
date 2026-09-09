import unittest
from typing import Dict, List, Mapping, Tuple

from validate_extract import validate, validate_payload

UNKNOWN = "—"

# Every REQUIRED key, each a complete printed phrase.
CLEAN: Dict[str, object] = {
    "url": "https://boards.greenhouse.io/acme/jobs/123",
    "status": "live",
    "work_auth": "Must be legally authorized to work in the UK",
    "hiring_route": "contractor / B2B",
    "eligibility": "confirmed",
    "eligibility_evidence": "Remote, anywhere in the UK",
    "location": "London, United Kingdom",
    "salary": "£80,000 - £100,000",
    "equity": "0.1% - 0.3%",
    "seniority": "Senior",
    "work_model": "Remote",
    "years_experience": "5+",
    "required_skills": "TypeScript, Python",
    "jd_date": "2026-08-01",
}

# (row override, expected errors). The first three are the corpus defects.
CASES: Tuple[Tuple[Mapping[str, object], List[str]], ...] = (
    ({}, []),
    ({"work_auth": "based insights (e"}, ["work_auth: cut mid-phrase"]),
    (
        {"work_auth": ": Position is 100% remote, but candidates must reside in South America."},
        ["work_auth: starts mid-sentence"],
    ),
    ({"required_skills": "TypeScript | Python"}, ["required_skills: contains a pipe"]),
    ({key: UNKNOWN for key in CLEAN if key not in ("url", "status", "eligibility")}, []),
    ({"status": "open"}, ["status: not in live|dead|uncertain"]),
    ({"eligibility": "maybe"}, ["eligibility: not in confirmed|incompatible|unknown"]),
    ({"jd_date": "08/01/2026"}, ["jd_date: not YYYY-MM-DD or —"]),
)


def row(override: Mapping[str, object]) -> Dict[str, object]:
    merged = dict(CLEAN)
    merged.update(override)
    return merged


class ValidateTests(unittest.TestCase):
    def test_golden_table(self):
        for override, expected in CASES:
            with self.subTest(override=override):
                self.assertEqual(validate(row(override)), expected)

    def test_missing_key_reports_only_shape(self):
        broken = row({"status": "open"})
        del broken["location"]
        self.assertEqual(validate(broken), ["location: missing or not a string"])

    def test_non_string_key_is_missing(self):
        self.assertEqual(validate(row({"salary": 100})), ["salary: missing or not a string"])

    def test_eligibility_row_is_optional(self):
        without = row({})
        del without["eligibility"]
        self.assertEqual(validate(without), [])

    def test_unknown_jd_date_passes(self):
        self.assertEqual(validate(row({"jd_date": UNKNOWN})), [])


class PayloadTests(unittest.TestCase):
    def test_batch_keeps_order(self):
        first = row({})
        second = row({"url": "https://jobs.lever.co/acme/0f1e2d3c", "work_auth": "based insights (e"})
        code, result = validate_payload({"rows": [first, second]})
        self.assertEqual(
            (code, result),
            (
                0,
                {
                    "rows": [
                        {"url": first["url"], "errors": []},
                        {"url": second["url"], "errors": ["work_auth: cut mid-phrase"]},
                    ]
                },
            ),
        )

    def test_bad_shape(self):
        for payload in ("nope", {"rows": "x"}, {"rows": [1]}, {"urls": []}):
            with self.subTest(payload=payload):
                code, result = validate_payload(payload)
                self.assertEqual(code, 1)
                self.assertIn("rows array", str(result["validate_error"]))


if __name__ == "__main__":
    unittest.main()
