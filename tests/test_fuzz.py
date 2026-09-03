"""Run the seeded property fuzzer as a deterministic gate.

The whole corpus is generated once, under a fixed seed, and every property is
reported in its own ``subTest`` so one violated invariant names itself instead of
hiding behind the first failure. A failure prints the shrunk payload as JSON, so
the reproduction is a copy and a paste away.
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import fuzz  # noqa: E402

SEED = 0
RUNS = 200


class FuzzProperties(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.failures = fuzz.run(seed=SEED, runs=RUNS)

    def test_properties_hold_on_hostile_payloads(self):
        first = {}
        for failure in self.failures:
            first.setdefault(failure.property_name, failure)
        for prop in fuzz.PROPERTIES:
            with self.subTest(property=prop.name):
                failure = first.get(prop.name)
                if failure is not None:
                    self.fail(failure.describe())

    def test_generator_reaches_the_hostile_shapes(self):
        import random

        corpus = fuzz.payloads(random.Random(SEED), RUNS)
        scored = sum(len(fuzz._scored(payload)) for payload in corpus)
        with self.subTest(shape="payloads"):
            self.assertEqual(len(corpus), RUNS)
        with self.subTest(shape="scored rows"):
            self.assertGreater(scored, 0)


class FuzzIsRepeatable(unittest.TestCase):
    def test_same_seed_gives_the_same_failures(self):
        first = tuple(item.describe() for item in fuzz.run(seed=7, runs=10))
        second = tuple(item.describe() for item in fuzz.run(seed=7, runs=10))
        self.assertEqual(first, second)


if __name__ == "__main__":
    unittest.main()
