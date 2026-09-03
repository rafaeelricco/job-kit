import copy
import unittest
from unittest import mock

from check_parse import check, extract

# Shaped like pdftotext default-mode output of the real base: a table row
# splits into blocks, bullets wrap, "--" renders as an en dash.
TEXT = """Rafael Ricco
+55 51 996702804 | rafaelricco10@gmail.com | github.com/rafaeelricco

SUMMARY
Most recently I built Prevou at Ambar for UK estate agencies.

EXPERIENCE
Senior Software Engineer

Sep. 2025 – Present

Ambar
London, United Kingdom | Remote
• Shipped Prevou, a white-label AI sales assistant, from day two to production. It crawls the
agency site and answers visitors by text or voice.
Software Engineer

Jun. 2025 – Sep. 2025

Unvoid
London, United Kingdom | Remote

TECHNICAL SKILLS
Full-Stack: TypeScript, JavaScript, Next.js, Node.js
Backend & Architecture: Event Sourcing, CQRS, OAuth2/OpenID Connect
"""


class ParseCheckTests(unittest.TestCase):
    def setUp(self):
        self.expected = {
            "identity": ["Rafael Ricco", "rafaelricco10@gmail.com", "+55 51 996702804"],
            "roles": [
                {"company": "Ambar", "position": "Senior Software Engineer", "date": "Sep. 2025 -- Present"},
                {"company": "Unvoid", "position": "Software Engineer", "date": "Jun. 2025 -- Sep. 2025"},
            ],
            "skills": ["TypeScript", "Next.js", "Event Sourcing", "OAuth2/OpenID Connect"],
        }

    def test_accepts_round_trip(self):
        result = check(TEXT, self.expected)
        self.assertEqual(result, {"verdict": "PASS", "missing": [], "order": [], "error": None})

    def test_accepts_wrapped_line_and_dash_variants(self):
        expected = copy.deepcopy(self.expected)
        expected["skills"].append("from day two to production. It crawls the agency site")
        expected["roles"][0]["date"] = "Sep. 2025 — Present"
        self.assertEqual(check(TEXT, expected)["verdict"], "PASS")

    def test_rejects_missing_identity_naming_token(self):
        expected = copy.deepcopy(self.expected)
        expected["identity"][2] = "+55 51 99670-2804"
        result = check(TEXT, expected)
        self.assertEqual(result["verdict"], "FAIL")
        self.assertEqual(result["missing"], [{"kind": "identity", "token": "+55 51 99670-2804"}])

    def test_rejects_missing_skill_and_role_field(self):
        with self.subTest("skill"):
            expected = copy.deepcopy(self.expected)
            expected["skills"].append("GraphQL")
            self.assertIn({"kind": "skill", "token": "GraphQL"}, check(TEXT, expected)["missing"])
        with self.subTest("company"):
            expected = copy.deepcopy(self.expected)
            expected["roles"][1]["company"] = "Invented Inc"
            self.assertIn({"kind": "company", "token": "Invented Inc"}, check(TEXT, expected)["missing"])

    def test_summary_fields_cannot_mask_reversed_roles(self):
        text = TEXT.replace(
            "Most recently I built Prevou at Ambar for UK estate agencies.",
            "Software Engineer at Ambar. Most recently I built Prevou for UK estate agencies.",
        ).replace("\nUnvoid\n", "\nAmbar\n")
        expected = copy.deepcopy(self.expected)
        expected["roles"][1]["company"] = "Ambar"
        expected["roles"].reverse()

        result = check(text, expected)

        self.assertEqual(result["verdict"], "FAIL")
        self.assertEqual(result["missing"], [])
        self.assertTrue(
            any("Senior Software Engineer" in line for line in result["order"])
        )

    def test_rejects_roles_out_of_page_order(self):
        expected = copy.deepcopy(self.expected)
        expected["roles"].reverse()
        result = check(TEXT, expected)
        self.assertEqual(result["verdict"], "FAIL")
        self.assertEqual(result["missing"], [])
        self.assertTrue(any("Senior Software Engineer" in line for line in result["order"]))

    def test_extract_reports_missing_pdftotext(self):
        with mock.patch("check_parse.subprocess.run", side_effect=FileNotFoundError):
            with self.assertRaises(FileNotFoundError):
                extract("/nonexistent.pdf")


if __name__ == "__main__":
    unittest.main()
