import unittest

from years import years_payload

TODAY = "2026-09"


def run(dates, today=TODAY):
    return years_payload({"dates": dates, "today": today})


class YearsTests(unittest.TestCase):
    def test_single_closed_range_is_inclusive(self):
        # Jan 2020 through Dec 2020 is twelve months, one year.
        self.assertEqual(run(["Jan 2020 -- Dec 2020"]), (0, {"years": 1, "unparsed": []}))

    def test_one_month_short_floors_down(self):
        self.assertEqual(run(["Jan 2020 - Nov 2020"])[1]["years"], 0)

    def test_present_is_the_current_month(self):
        # Oct 2023 through Sep 2026 inclusive: 36 months.
        self.assertEqual(run(["Oct 2023 – Present"])[1]["years"], 3)

    def test_overlapping_months_count_once(self):
        dates = ["Jan 2020 -- Dec 2021", "Jun 2021 -- Jun 2022"]
        # Jan 2020 .. Jun 2022 is 30 unique months.
        self.assertEqual(run(dates)[1]["years"], 2)

    def test_gaps_are_not_counted(self):
        dates = ["Jan 2018 -- Jun 2018", "Jan 2020 -- Jun 2020"]
        self.assertEqual(run(dates)[1]["years"], 1)

    def test_every_separator_and_month_spelling(self):
        for text in (
            "Mar 2021--Feb 2022",
            "Mar. 2021 - Feb. 2022",
            "March 2021 – February 2022",
            "march 2021 — FEBRUARY 2022",
        ):
            with self.subTest(text=text):
                self.assertEqual(run([text])[1], {"years": 1, "unparsed": []})

    def test_unparseable_rows_are_skipped_and_named(self):
        dates = ["2019 to 2021", "Jan 2020 -- Dec 2020", "Sept 2020 -- Present"]
        self.assertEqual(run(dates), (0, {"years": 1, "unparsed": [0, 2]}))

    def test_end_before_start_is_unparseable(self):
        self.assertEqual(run(["Dec 2021 -- Jan 2021"])[1], {"years": None, "unparsed": [0]})

    def test_nothing_parseable_is_null_not_zero(self):
        self.assertEqual(run([])[1]["years"], None)
        self.assertEqual(run(["freelance"])[1]["years"], None)

    def test_invalid_payloads_error(self):
        for payload in (None, [], {"dates": "Jan 2020 -- Present"}, {"dates": [1]}):
            with self.subTest(payload=payload):
                code, result = years_payload(payload)
                self.assertEqual(code, 1)
                self.assertIn("years_error", result)
        for today in ("2026-13", "Sep 2026", 202609):
            with self.subTest(today=today):
                self.assertEqual(run(["Jan 2020 -- Present"], today)[0], 1)

    def test_today_defaults_to_the_current_month(self):
        code, result = years_payload({"dates": ["Jan 2000 -- Dec 2000"]})
        self.assertEqual((code, result["years"]), (0, 1))


if __name__ == "__main__":
    unittest.main()
