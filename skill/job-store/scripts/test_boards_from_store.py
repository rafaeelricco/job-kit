import unittest

from boards_from_store import board_of, boards_payload


class BoardTests(unittest.TestCase):
    def test_ats_url_yields_board(self):
        self.assertEqual(
            board_of("https://jobs.ashbyhq.com/greatquestion/094067c8/application", "Great Question"),
            {
                "ats": "ashby",
                "slug": "greatquestion",
                "company": "Great Question",
                "url": "https://jobs.ashbyhq.com/greatquestion",
            },
        )

    def test_non_ats_host_is_skipped(self):
        self.assertIsNone(board_of("https://www.linkedin.com/jobs/view/1", "Acme"))

    def test_first_company_wins_per_slug(self):
        code, out = boards_payload(
            {
                "dossiers": [
                    {"url": "https://jobs.lever.co/acme/1", "company": "Acme"},
                    {"url": "https://jobs.lever.co/acme/2", "company": "ACME Inc"},
                ]
            }
        )
        boards = out["boards"]
        self.assertEqual((code, len(boards), boards[0]["company"]), (0, 1, "Acme"))

    def test_greenhouse_embed_slug_comes_from_for_param(self):
        self.assertEqual(
            board_of("https://boards.greenhouse.io/embed/job_app?for=beta&token=456", "Beta"),
            {"ats": "greenhouse", "slug": "beta", "company": "Beta", "url": "https://job-boards.greenhouse.io/beta"},
        )
        self.assertIsNone(board_of("https://boards.greenhouse.io/embed/job_app?token=456", "Beta"))

    def test_lever_eu_instance_is_skipped(self):
        self.assertIsNone(board_of("https://jobs.eu.lever.co/acme/0f1e2d3c", "Acme"))
        self.assertIsNone(board_of("https://api.eu.lever.co/v0/postings/acme", "Acme"))

    def test_bad_payload_is_error(self):
        self.assertEqual(boards_payload({"dossiers": [{"url": 1, "company": "x"}]})[0], 1)
        self.assertEqual(boards_payload({"dossiers": [{"url": "not a url", "company": "x"}]})[0], 1)


if __name__ == "__main__":
    unittest.main()
