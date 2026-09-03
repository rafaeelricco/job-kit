import copy
import unittest

from validate_guidance import validate_payload


class GuidanceValidationTests(unittest.TestCase):
    def setUp(self):
        self.candidate = {
            "skills": ["TypeScript", "Node.js", "PostgreSQL"],
            "experience": [
                {
                    "date": "Jan 2021 – Present",
                    "company": "Example Co",
                    "position": "Senior Software Engineer",
                }
            ],
        }
        self.job = {
            "url": "https://example.test/jobs/1",
            "title": "Senior Software Engineer",
            "seniority": "Senior",
            "required_skills": ["TypeScript", "GraphQL"],
            "preferred_skills": ["PostgreSQL"],
        }
        self.guidance = {
            "schema_version": 1,
            "url": self.job["url"],
            "requirements": [
                {
                    "kind": "required",
                    "job_term": "TypeScript",
                    "status": "held",
                    "profile_term": "TypeScript",
                },
                {
                    "kind": "required",
                    "job_term": "GraphQL",
                    "status": "not_evidenced",
                    "profile_term": None,
                },
                {
                    "kind": "preferred",
                    "job_term": "PostgreSQL",
                    "status": "held",
                    "profile_term": "PostgreSQL",
                },
            ],
            "priority_roles": [
                {
                    "company": "Example Co",
                    "position": "Senior Software Engineer",
                    "matched_on": ["role_type", "seniority"],
                }
            ],
            "warnings": [],
        }

    def payload(self, guidance=None, jobs=None):
        return {
            "candidate": copy.deepcopy(self.candidate),
            "jobs": copy.deepcopy([self.job] if jobs is None else jobs),
            "guidance": copy.deepcopy(
                [self.guidance] if guidance is None else guidance
            ),
        }

    def test_accepts_source_grounded_guidance(self):
        payload = self.payload()
        original = copy.deepcopy(payload)

        result = validate_payload(payload)

        self.assertEqual(result, {"valid": [self.guidance], "invalid": []})
        self.assertEqual(payload, original)

    def test_rejects_wrong_required_preferred_kind(self):
        guidance = copy.deepcopy(self.guidance)
        guidance["requirements"][0]["kind"] = "preferred"

        result = validate_payload(self.payload([guidance]))

        self.assertEqual(result["valid"], [])
        self.assertTrue(
            any("source kind" in error for error in result["invalid"][0]["errors"])
        )

    def test_rejects_unknown_job_or_profile_term(self):
        with self.subTest("unknown job term"):
            guidance = copy.deepcopy(self.guidance)
            guidance["requirements"][0]["job_term"] = "Rust"
            result = validate_payload(self.payload([guidance]))
            self.assertEqual(result["valid"], [])
            self.assertTrue(
                any(
                    "every JobProfile requirement" in error
                    for error in result["invalid"][0]["errors"]
                )
            )

        with self.subTest("unknown candidate term"):
            guidance = copy.deepcopy(self.guidance)
            guidance["requirements"][0]["profile_term"] = "Java"
            result = validate_payload(self.payload([guidance]))
            self.assertEqual(result["valid"], [])
            self.assertTrue(
                any(
                    "exact candidate skill" in error
                    for error in result["invalid"][0]["errors"]
                )
            )

    def test_rejects_downgraded_direct_hold(self):
        for status in ("not_evidenced", "unknown"):
            with self.subTest(status=status):
                guidance = copy.deepcopy(self.guidance)
                guidance["requirements"][0].update(
                    status=status, profile_term=None
                )
                result = validate_payload(self.payload([guidance]))
                self.assertEqual(result["valid"], [])
                self.assertIn(
                    "requirements[0].status must be held for a directly held skill",
                    result["invalid"][0]["errors"],
                )

    def test_requires_warnings_the_sources_decide(self):
        with self.subTest("missing emptiness codes"):
            self.candidate["skills"] = []
            self.job["required_skills"] = []
            self.job["preferred_skills"] = []
            guidance = copy.deepcopy(self.guidance)
            guidance["requirements"] = []
            result = validate_payload(self.payload([guidance]))
            self.assertEqual(result["valid"], [])
            self.assertIn(
                "warnings must equal the codes the sources decide: "
                "candidate_skills_empty, no_required_skills",
                result["invalid"][0]["errors"],
            )
            guidance["warnings"] = ["candidate_skills_empty", "no_required_skills"]
            self.assertEqual(validate_payload(self.payload([guidance]))["invalid"], [])

        self.setUp()
        with self.subTest("invented no_relevant_role beside a matched role"):
            guidance = copy.deepcopy(self.guidance)
            guidance["warnings"] = ["no_relevant_role"]
            result = validate_payload(self.payload([guidance]))
            self.assertEqual(result["valid"], [])
            self.assertIn(
                "warnings must equal the codes the sources decide: none",
                result["invalid"][0]["errors"],
            )

        with self.subTest("dropped no_relevant_role with no priority role"):
            guidance = copy.deepcopy(self.guidance)
            guidance["priority_roles"] = []
            result = validate_payload(self.payload([guidance]))
            self.assertEqual(result["valid"], [])
            self.assertIn(
                "warnings must equal the codes the sources decide: no_relevant_role",
                result["invalid"][0]["errors"],
            )
            guidance["warnings"] = ["no_relevant_role"]
            self.assertEqual(validate_payload(self.payload([guidance]))["invalid"], [])

        with self.subTest("spurious emptiness code"):
            guidance = copy.deepcopy(self.guidance)
            guidance["warnings"] = ["candidate_skills_empty"]
            result = validate_payload(self.payload([guidance]))
            self.assertEqual(result["valid"], [])

    def test_rejects_unrelated_held_skill(self):
        guidance = copy.deepcopy(self.guidance)
        guidance["requirements"][1].update(
            status="held", profile_term="TypeScript"
        )

        result = validate_payload(self.payload([guidance]))

        self.assertIn(
            "requirements[1].profile_term does not directly hold job_term",
            result["invalid"][0]["errors"],
        )

    def test_accepts_react_js_as_a_direct_react_hold(self):
        candidate = copy.deepcopy(self.candidate)
        candidate["skills"].append("React.js")
        job = {
            **self.job,
            "required_skills": ["React"],
            "preferred_skills": [],
        }
        guidance = copy.deepcopy(self.guidance)
        guidance["requirements"] = [
            {
                "kind": "required",
                "job_term": "React",
                "status": "held",
                "profile_term": "React.js",
            }
        ]

        result = validate_payload(
            {"candidate": candidate, "jobs": [job], "guidance": [guidance]}
        )

        self.assertEqual(result["valid"], [guidance])

    def test_rejects_invented_role_pair(self):
        guidance = copy.deepcopy(self.guidance)
        guidance["priority_roles"][0]["company"] = "Invented Inc"

        result = validate_payload(self.payload([guidance]))

        self.assertEqual(result["valid"], [])
        self.assertTrue(
            any(
                "exact candidate role" in error
                for error in result["invalid"][0]["errors"]
            )
        )

    def test_rejects_unrelated_priority_role_claims(self):
        candidate = copy.deepcopy(self.candidate)
        candidate["experience"].append(
            {
                "date": "Jan 2018 – Dec 2020",
                "company": "Sales Co",
                "position": "Sales Manager",
            }
        )
        guidance = copy.deepcopy(self.guidance)
        guidance["priority_roles"] = [
            {
                "company": "Sales Co",
                "position": "Sales Manager",
                "matched_on": ["role_type", "seniority"],
            }
        ]

        result = validate_payload(
            {
                "candidate": candidate,
                "jobs": [self.job],
                "guidance": [guidance],
            }
        )

        errors = result["invalid"][0]["errors"]
        self.assertIn(
            "priority_roles[0].matched_on role_type is unsupported", errors
        )
        self.assertIn(
            "priority_roles[0].matched_on seniority is unsupported", errors
        )

    def test_accepts_adjacent_priority_role_seniority(self):
        candidate = copy.deepcopy(self.candidate)
        candidate["experience"].append(
            {
                "date": "Jan 2020 – Dec 2020",
                "company": "Staff Co",
                "position": "Staff Software Engineer",
            }
        )
        guidance = copy.deepcopy(self.guidance)
        guidance["priority_roles"] = [
            {
                "company": "Staff Co",
                "position": "Staff Software Engineer",
                "matched_on": ["seniority"],
            }
        ]

        result = validate_payload(
            {
                "candidate": candidate,
                "jobs": [self.job],
                "guidance": [guidance],
            }
        )

        self.assertEqual(result["valid"], [guidance])

    def test_rejects_extra_prose_field_and_invalid_enum(self):
        guidance = copy.deepcopy(self.guidance)
        guidance["summary"] = "Ready-made resume prose"
        guidance["requirements"][1]["status"] = "missing"

        result = validate_payload(self.payload([guidance]))

        errors = result["invalid"][0]["errors"]
        self.assertEqual(result["valid"], [])
        self.assertTrue(any("unknown keys: summary" in error for error in errors))
        self.assertTrue(any("status is invalid" in error for error in errors))

    def test_rejects_extra_payload_field(self):
        payload = self.payload()
        payload["narrative"] = "not part of the validator contract"

        result = validate_payload(payload)

        self.assertEqual(result["valid"], [])
        self.assertEqual(
            result["invalid"][0]["errors"],
            ["payload unknown keys: narrative"],
        )

    def test_rejects_missing_or_duplicate_job_guidance(self):
        with self.subTest("missing"):
            result = validate_payload(self.payload([]))
            self.assertEqual(result["valid"], [])
            self.assertEqual(
                result["invalid"][0]["errors"],
                ["missing guidance for JobProfile"],
            )

        with self.subTest("duplicate"):
            result = validate_payload(
                self.payload([self.guidance, copy.deepcopy(self.guidance)])
            )
            self.assertEqual(result["valid"], [])
            self.assertEqual(
                result["invalid"][0]["errors"],
                ["duplicate guidance for JobProfile"],
            )

    def test_one_invalid_row_does_not_drop_valid_rows(self):
        second_job = {
            "url": "https://example.test/jobs/2",
            "required_skills": ["Node.js"],
            "preferred_skills": [],
        }
        second_guidance = {
            "schema_version": 2,
            "url": second_job["url"],
            "requirements": [
                {
                    "kind": "required",
                    "job_term": "Node.js",
                    "status": "held",
                    "profile_term": "Node.js",
                }
            ],
            "priority_roles": [],
            "warnings": ["no_relevant_role"],
        }

        result = validate_payload(
            self.payload(
                [self.guidance, second_guidance],
                jobs=[self.job, second_job],
            )
        )

        self.assertEqual(result["valid"], [self.guidance])
        self.assertEqual(result["invalid"][0]["url"], second_job["url"])
        self.assertIn("schema_version must be 1", result["invalid"][0]["errors"])


if __name__ == "__main__":
    unittest.main()
