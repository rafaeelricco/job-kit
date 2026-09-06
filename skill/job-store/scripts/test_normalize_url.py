import unittest

from normalize_url import normalize, normalize_payload

ENCORA = "https://hiringcafe.com/job/6vby83d1s9bapqd1"
GEM = "https://jobs.gem.com/motion/am9icG9zdDpktrCe7hRhdG29--GTTBHD"
HN = "https://news.ycombinator.com/item?id=49552714"
NEWROCKET = "https://www.newrocket.com/careers/job?gh_jid=6163518004"

# (raw, normalized). A row that changes here changes every dossier's identity.
CASES = (
    # hiring.cafe: slug is mutable, trailing 16-char id is the posting
    ("https://hiringcafe.com/job/senior-software-engineer-python-encora-brazil-6vby83d1s9bapqd1", ENCORA),
    ("https://hiringcafe.com/job/senior-software-engineer-python-coforge-brazil-6vby83d1s9bapqd1", ENCORA),
    (ENCORA, ENCORA),
    ("https://hiringcafe.com/job/not-an-id", "https://hiringcafe.com/job/not-an-id"),
    # query-only ids survive
    (HN, HN),
    (NEWROCKET, NEWROCKET),
    # trailing slash and LinkedIn trackers
    ("https://www.linkedin.com/jobs/view/4123456789/", "https://www.linkedin.com/jobs/view/4123456789"),
    ("https://www.linkedin.com/jobs/view/4123456789/?refId=a&trackingId=b&position=1&pageNum=0", "https://www.linkedin.com/jobs/view/4123456789"),
    ("https://jobs.lever.co/acme/0f1e2d3c?utm_source=x&li_fat_id=y&ref=z", "https://jobs.lever.co/acme/0f1e2d3c?ref=z"),
    ("https://example.test/job?ref=101", "https://example.test/job?ref=101"),
    ("https://example.test/job?ref=102", "https://example.test/job?ref=102"),
    ("https://[2001:db8::1]/jobs/7", "https://[2001:db8::1]/jobs/7"),
    ("https://[2001:db8::1]:8443/jobs/7", "https://[2001:db8::1]:8443/jobs/7"),
    ("https://example.test/job?b=x&id=2&a=y&id=1", "https://example.test/job?a=y&b=x&id=2&id=1"),
    ("https://boards.greenhouse.io/acme/jobs/123?gh_src=abc&b=2&a=1", "https://boards.greenhouse.io/acme/jobs/123?a=1&b=2"),
    # host lowercased, path case kept (ashby company slug, gem base64 id)
    ("HTTPS://Jobs.AshbyHQ.com/Stepful/6a1b-uuid", "https://jobs.ashbyhq.com/Stepful/6a1b-uuid"),
    (GEM, GEM),
    # fragment, root, whitespace
    ("https://boards.greenhouse.io/acme/jobs/123#app", "https://boards.greenhouse.io/acme/jobs/123"),
    ("https://starbridge.ai/", "https://starbridge.ai/"),
    ("https://starbridge.ai", "https://starbridge.ai/"),
    ("  https://example.com/jobs/1?b=2&a=1  ", "https://example.com/jobs/1?a=1&b=2"),
)

REJECTED = ("not a url", "mailto:jobs@example.com", "ftp://example.com/x", "https:///no-host")


class NormalizeTests(unittest.TestCase):
    def test_golden_table(self):
        for raw, expected in CASES:
            with self.subTest(raw=raw):
                self.assertEqual(normalize(raw), expected)

    def test_idempotent(self):
        for raw, _expected in CASES:
            with self.subTest(raw=raw):
                once = normalize(raw)
                self.assertEqual(normalize(once), once)

    def test_tracker_keys_match_case_insensitively(self):
        self.assertEqual(
            normalize("https://x.test/a?TrackingId=1&UTM_Source=2&id=3"),
            "https://x.test/a?id=3",
        )

    def test_rejects_non_http(self):
        for raw in REJECTED:
            with self.subTest(raw=raw):
                with self.assertRaises(ValueError):
                    normalize(raw)


class PayloadTests(unittest.TestCase):
    def test_batch_keeps_order(self):
        code, result = normalize_payload({"urls": [CASES[1][0], HN]})
        self.assertEqual((code, result), (0, {"urls": [ENCORA, HN]}))

    def test_bad_shape_and_bad_item(self):
        cases = (
            ("nope", "urls array"),
            ({"urls": [1]}, "urls array"),
            ({"urls": ["mailto:x"]}, "urls[0]"),
        )
        for payload, fragment in cases:
            with self.subTest(payload=payload):
                code, result = normalize_payload(payload)
                self.assertEqual(code, 1)
                self.assertIn(fragment, result["normalize_error"])


if __name__ == "__main__":
    unittest.main()
