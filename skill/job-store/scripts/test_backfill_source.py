import os
import tempfile
import unittest
from unittest import mock

import backfill_source
from backfill_source import acquire, read_owner, release, repair_line


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


class LockTests(unittest.TestCase):
    def setUp(self):
        self._tmpdir = tempfile.TemporaryDirectory()
        self.lock = os.path.join(self._tmpdir.name, "url-test.lock")

    def tearDown(self):
        self._tmpdir.cleanup()

    def test_acquire_writes_owner(self):
        token = acquire(self.lock)
        self.assertIsNotNone(token)
        self.assertEqual(read_owner(self.lock), token)
        self.assertTrue(os.path.isdir(self.lock))

    def test_release_wrong_token_leaves_lock(self):
        token = acquire(self.lock)
        self.assertIsNotNone(token)
        release(self.lock, "other")
        self.assertTrue(os.path.isdir(self.lock))
        self.assertEqual(read_owner(self.lock), token)

    def test_reclaim_skips_rmtree_when_recheck_is_fresh(self):
        os.mkdir(self.lock)
        with mock.patch.object(backfill_source, "LOCK_SLEEP", 0), mock.patch.object(
            backfill_source, "stale", side_effect=[True, False]
        ), mock.patch.object(backfill_source.shutil, "rmtree") as rmtree:
            token = acquire(self.lock)
        self.assertIsNone(token)
        rmtree.assert_not_called()
        self.assertTrue(os.path.isdir(self.lock))


if __name__ == "__main__":
    unittest.main()
