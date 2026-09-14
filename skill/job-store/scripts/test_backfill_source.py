import unittest

from backfill_source import repair_line


class RepairLineTests(unittest.TestCase):
    def test_host_shaped_alias_is_kept(self):
        line = "source linkedin.com · channel ats · date 2026-01-01"
        self.assertIsNone(repair_line(line))

    def test_bare_alias_still_folds(self):
        self.assertEqual(
            repair_line("source linkedin · channel ats · date 2026-01-01"),
            "source linkedin-jobs · channel ats · date 2026-01-01",
        )

    def test_x_com_is_kept(self):
        line = "source x.com · channel social · date 2026-01-01"
        self.assertIsNone(repair_line(line))


if __name__ == "__main__":
    unittest.main()
