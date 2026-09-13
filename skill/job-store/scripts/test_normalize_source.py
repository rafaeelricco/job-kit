import unittest

from normalize_source import ALIASES, PREFIX, canonical, normalize_payload

# (raw, folded). A row that changes here changes what a Provenance line means.
CASES = (
    ("linkedin.com", "linkedin-jobs"),
    ("linkedin", "linkedin-jobs"),
    ("hiring.cafe", "hiring-cafe"),
    ("hiringcafe", "hiring-cafe"),
    ("hiringcafe.com", "hiring-cafe"),
    ("workatastartup", "work-at-a-startup"),
    ("workatastartup.com", "work-at-a-startup"),
    ("x.com", "x-funding"),
    ("jobs.ashbyhq.com", "ashby"),
    ("job-boards.greenhouse.io", "greenhouse"),
)

# A host-shaped id is legal for an ad-hoc pack, so it must survive untouched.
PASSTHROUGH = ("lever", "greenhouse", "ashby", "example.test", "jobs.gem.com", "")


class CanonicalTests(unittest.TestCase):
    def test_alias_table(self):
        self.assertEqual(len(ALIASES), 10)
        self.assertEqual(CASES, tuple(ALIASES.items()))
        for raw, expected in CASES:
            with self.subTest(raw=raw):
                self.assertEqual(canonical(raw), expected)

    def test_targets_fold_to_themselves(self):
        for target in ALIASES.values():
            with self.subTest(target=target):
                self.assertEqual(canonical(target), target)

    def test_idempotent(self):
        for raw, _expected in CASES + tuple((p, p) for p in PASSTHROUGH):
            with self.subTest(raw=raw):
                once = canonical(raw)
                self.assertEqual(canonical(once), once)

    def test_strips_legacy_prefix(self):
        self.assertEqual(PREFIX, "source ")
        self.assertEqual(canonical("source lever"), "lever")
        self.assertEqual(canonical("source linkedin.com"), "linkedin-jobs")
        self.assertEqual(canonical("  source   linkedin  "), "linkedin-jobs")

    def test_unknown_passes_through(self):
        for raw in PASSTHROUGH:
            with self.subTest(raw=raw):
                self.assertEqual(canonical(raw), raw)
        self.assertEqual(canonical("  some-new-pack  "), "some-new-pack")


class PayloadTests(unittest.TestCase):
    def test_batch_keeps_order(self):
        code, result = normalize_payload(
            {"sources": ["x.com", "lever", "source linkedin", "hiringcafe"]}
        )
        self.assertEqual(code, 0)
        self.assertEqual(
            result["sources"], ["x-funding", "lever", "linkedin-jobs", "hiring-cafe"]
        )

    def test_unknown_is_deduped_and_sorted(self):
        code, result = normalize_payload(
            {
                "sources": ["linkedin.com", "lever", "linkedin", "zulip", "lever"],
                "ids": ["linkedin-jobs", "ashby"],
            }
        )
        self.assertEqual(code, 0)
        self.assertEqual(
            result["sources"],
            ["linkedin-jobs", "lever", "linkedin-jobs", "zulip", "lever"],
        )
        self.assertEqual(result["unknown"], ["lever", "zulip"])
        self.assertNotIn("linkedin-jobs", result["unknown"])

    def test_no_vocabulary_means_no_unknown(self):
        for payload in ({"sources": ["lever", "zulip"]}, {"sources": ["lever"], "ids": []}):
            with self.subTest(payload=payload):
                code, result = normalize_payload(payload)
                self.assertEqual(code, 0)
                self.assertEqual(result["unknown"], [])

    def test_empty_batch(self):
        self.assertEqual(
            normalize_payload({"sources": [], "ids": ["ashby"]}),
            (0, {"sources": [], "unknown": []}),
        )

    def test_bad_shape(self):
        cases = (
            ("nope", "sources array"),
            (None, "sources array"),
            ({}, "sources array"),
            ({"sources": "linkedin"}, "sources array"),
            ({"sources": [1]}, "sources array"),
            ({"sources": ["linkedin"], "ids": "ashby"}, "ids array"),
            ({"sources": ["linkedin"], "ids": [2]}, "ids array"),
        )
        for payload, fragment in cases:
            with self.subTest(payload=payload):
                code, result = normalize_payload(payload)
                self.assertEqual(code, 1)
                self.assertIn(fragment, result["normalize_error"])


if __name__ == "__main__":
    unittest.main()
