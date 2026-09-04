"""Pin the agreements no single shipped script can assert about itself.

``validate_guidance`` imports from ``models``, ``scaffold_guidance`` and ``score``,
so a constant that drifts between those four files is a runtime break rather than a
style nit. The scoring weights, the decision bands, the guidance enums and the
seniority ladder each live in one module but are read by another, or by the prose
contracts an operator follows; every test here reads both sides and compares them.

``score._contains_token`` and the matcher inside ``check_parse.check`` are the one
pair that crosses a skill boundary: ``job-match`` and ``job-resume-refine`` install
independently, so nothing but a test keeps their idea of a whole token in step.
That pair is driven through ``check_parse``'s own public ``check`` entry point, not
through a copied regex, so a rewrite of either matcher shows up here.
"""

import unittest
from dataclasses import dataclass, fields
from pathlib import Path
from typing import Dict, FrozenSet, Mapping, Optional, Sequence, Tuple, get_args
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))

import harness  # noqa: E402

models = harness.load(harness.MATCH / "models.py")
score = harness.load(harness.MATCH / "score.py")
scaffold_guidance = harness.load(harness.MATCH / "scaffold_guidance.py")
validate_guidance = harness.load(harness.MATCH / "validate_guidance.py")
check_parse = harness.load(harness.REFINE / "check_parse.py")

CONTRACT_MATCH: Path = harness.MATCH.parent / "references" / "contract-match.md"
CONTRACT_GUIDANCE: Path = (
    harness.MATCH.parent / "references" / "contract-resume-guidance.md"
)
JOB_PREP: Path = harness.SKILL / "job-prep" / "SKILL.md"
FLOW_PREP: Path = harness.SKILL / "job-prep" / "references" / "flow-prep.md"
FLOW_APPLY: Path = harness.SKILL / "job-apply" / "references" / "flow-apply.md"
CONTRACT_SCREENING: Path = (
    harness.SKILL / "job-apply" / "references" / "contract-screening.md"
)


@dataclass(frozen=True)
class BoundaryCase:
    """One text/token pair both whole-token matchers must agree on."""

    text: str
    token: str
    expected: bool


BOUNDARY_CASES: Tuple[BoundaryCase, ...] = (
    BoundaryCase("reactñ stack", "react", False),
    BoundaryCase("ongoing work", "go", False),
    BoundaryCase("c# and .net", "c#", True),
    BoundaryCase("node.js dev", "node.js", True),
    BoundaryCase("gestão de café", "café", True),
    BoundaryCase("react native", "react", True),
)


@dataclass(frozen=True)
class ScaffoldCase:
    """One candidate/job pair to scaffold and hand to the validator."""

    name: str
    candidate: Mapping[str, object]
    job: Mapping[str, object]


# The two ResumeGuidance fields scaffold_guidance leaves for the worker to fill.
# Validation errors naming these are expected on a raw skeleton; anything else
# means the scaffold got a field it owns wrong.
WORKER_OWNED_FIELDS: Tuple[str, ...] = ("priority_roles", "warnings")


SCAFFOLD_CASES: Tuple[ScaffoldCase, ...] = (
    ScaffoldCase(
        name="empty candidate skills",
        candidate={"skills": [], "experience": []},
        job={
            "url": "https://example.test/a",
            "title": "Frontend Engineer",
            "required_skills": ["React"],
            "preferred_skills": [],
        },
    ),
    ScaffoldCase(
        name="empty required skills",
        candidate={"skills": ["React"], "experience": []},
        job={
            "url": "https://example.test/b",
            "title": "Frontend Engineer",
            "required_skills": [],
            "preferred_skills": ["TypeScript"],
        },
    ),
    ScaffoldCase(
        name="duplicate job terms",
        candidate={"skills": ["React", "React"], "experience": []},
        job={
            "url": "https://example.test/c",
            "title": "Frontend Engineer",
            "required_skills": ["React", "React"],
            "preferred_skills": ["React"],
        },
    ),
    ScaffoldCase(
        name="mixed case direct hold",
        candidate={"skills": ["React.js"], "experience": []},
        job={
            "url": "https://example.test/d",
            "title": "Frontend Engineer",
            "required_skills": ["react"],
            "preferred_skills": ["REACT"],
        },
    ),
    ScaffoldCase(
        name="matching candidate role",
        candidate={
            "skills": ["React"],
            "experience": [
                {
                    "company": "Acme",
                    "position": "Frontend Engineer",
                    "date": "2020-2024",
                }
            ],
        },
        job={
            "url": "https://example.test/e",
            "title": "Frontend Engineer",
            "required_skills": ["React"],
            "preferred_skills": [],
        },
    ),
)

DUPLICATE_URL: str = "https://example.test/duplicate"
DUPLICATE_MESSAGE: str = "duplicate JobProfile url"


def check_parse_contains(text: str, token: str) -> bool:
    """Run ``check_parse``'s own matcher by asking ``check`` for one identity token.

    ``check`` reports a token it never found under ``missing``; the out-of-order
    branch cannot fire for a single identity token, whose cursor is always 0. So an
    empty ``missing`` list is exactly "the real matcher found this token".
    """
    expected: Dict[str, object] = {
        "identity": [token],
        "roles": [],
        "skills": [],
    }
    verdict = check_parse.check(text, expected)
    return not verdict["missing"]


def instruction_text(path: Path) -> str:
    """Read shipped instructions with wrapping removed and case normalized."""
    return " ".join(harness.read(path).lower().split())


def instruction_section(path: Path, start: str, end: str) -> str:
    """Return one normalized markdown section, bounded by its next heading."""
    text = instruction_text(path)
    _before, marker, after = text.partition(start.lower())
    if not marker:
        raise AssertionError(f"missing instruction heading {start!r} in {path}")
    section, marker, _remainder = after.partition(end.lower())
    if not marker:
        raise AssertionError(f"missing instruction heading {end!r} in {path}")
    return section


def emittable_warnings() -> FrozenSet[str]:
    """Every code ``scaffold_guidance.source_warnings`` can return, derived by call.

    The four combinations of empty/non-empty candidate skills and job required
    skills cover both of the function's independent branches, so their union is the
    whole emittable set without any code being named here.
    """
    skill_choices: Tuple[Tuple[str, ...], ...] = ((), ("React",))
    required_choices: Tuple[Tuple[str, ...], ...] = ((), ("React",))
    found = set()
    for skills in skill_choices:
        for required in required_choices:
            candidate = models.CandidateProfile(skills=skills)
            job = models.JobProfile(url="https://example.test/w", required_skills=required)
            found.update(scaffold_guidance.source_warnings(candidate, job))
    return frozenset(found)


def scaffolded(case: ScaffoldCase) -> Dict[str, object]:
    """Return ``scaffold``'s output for one case, as JSON, worker untouched."""
    candidate = models.CandidateProfile.from_json(case.candidate)
    job = models.JobProfile.from_json(case.job)
    return scaffold_guidance.scaffold(candidate, job).to_json()


def identity_worker(guidance: Dict[str, object]) -> Dict[str, object]:
    """The no-op worker: guidance is handed to validation exactly as scaffolded."""
    return guidance


def guidance_payload(case: ScaffoldCase) -> Dict[str, object]:
    """Assemble the payload ``validate_guidance`` reads for one scaffolded case."""
    return {
        "candidate": dict(case.candidate),
        "jobs": [dict(case.job)],
        "guidance": [identity_worker(scaffolded(case))],
    }


def duplicate_sources() -> Tuple[Dict[str, object], Tuple[Dict[str, object], ...]]:
    """One candidate and one jobs list carrying the same url twice."""
    candidate: Dict[str, object] = {"skills": ["React"], "experience": []}
    job: Dict[str, object] = {
        "url": DUPLICATE_URL,
        "title": "Frontend Engineer",
        "required_skills": ["React"],
        "preferred_skills": [],
    }
    return candidate, (dict(job), dict(job))


def score_duplicate_message() -> Optional[str]:
    """Return the ``score_error`` ``score_all`` reports for the duplicated url."""
    candidate, jobs = duplicate_sources()
    payload = {
        "candidate": candidate,
        "jobs": [dict(job) for job in jobs],
        "matches": [{"url": DUPLICATE_URL, "score_breakdown": {"location": 10}}],
    }
    rows: Sequence[Dict[str, object]] = score.score_all(payload)
    errors = tuple(
        row["score_error"] for row in rows if isinstance(row.get("score_error"), str)
    )
    return str(errors[0]) if errors else None


def validate_duplicate_message() -> Optional[str]:
    """Return the validation error ``validate_guidance`` reports for the same urls."""
    candidate, jobs = duplicate_sources()
    payload = {
        "candidate": candidate,
        "jobs": [dict(job) for job in jobs],
        "guidance": [],
    }
    result = validate_guidance.validate_payload(payload)
    invalid = result["invalid"]
    messages = tuple(
        str(message)
        for row in invalid
        if row.get("url") == DUPLICATE_URL
        for message in row.get("errors", ())
    )
    return messages[0] if messages else None


class WeightTests(unittest.TestCase):
    def test_weights_sum_to_one_hundred(self):
        self.assertEqual(sum(score.WEIGHTS.values()), 100)

    def test_every_weight_is_a_breakdown_field(self):
        names = frozenset(field.name for field in fields(models.ScoreBreakdown))
        for name in score.WEIGHTS:
            with self.subTest(weight=name):
                self.assertIn(name, names)

    def test_source_is_the_only_extra_breakdown_field(self):
        names = frozenset(field.name for field in fields(models.ScoreBreakdown))
        self.assertEqual(names - frozenset(score.WEIGHTS), frozenset({"source"}))


class BandTests(unittest.TestCase):
    def test_floors_strictly_descend(self):
        floors = tuple(floor for floor, _decision in score.BANDS)
        for earlier, later in zip(floors, floors[1:]):
            with self.subTest(earlier=earlier, later=later):
                self.assertGreater(earlier, later)

    def test_band_names_are_decisions(self):
        decisions = frozenset(get_args(models.Decision))
        for _floor, decision in score.BANDS:
            with self.subTest(decision=decision):
                self.assertIn(decision, decisions)

    def test_skip_is_the_fallthrough(self):
        named = frozenset(decision for _floor, decision in score.BANDS)
        self.assertIn("skip", get_args(models.Decision))
        self.assertNotIn("skip", named)


class EnumDriftTests(unittest.TestCase):
    def test_allowed_status_matches_models(self):
        self.assertEqual(
            validate_guidance.ALLOWED_STATUS,
            frozenset(get_args(models.GuidanceStatus)),
        )

    def test_allowed_kind_matches_models(self):
        self.assertEqual(
            validate_guidance.ALLOWED_KIND,
            frozenset(get_args(models.RequirementKind)),
        )

    def test_allowed_warnings_matches_scaffold(self):
        self.assertEqual(
            validate_guidance.ALLOWED_WARNINGS,
            emittable_warnings() | frozenset({"no_relevant_role"}),
        )

    def test_seniority_ladder_is_documented_in_both_contracts(self):
        contracts = (
            (CONTRACT_MATCH, harness.read(CONTRACT_MATCH).lower()),
            (CONTRACT_GUIDANCE, harness.read(CONTRACT_GUIDANCE).lower()),
        )
        for rung in validate_guidance.SENIORITY_LADDER:
            for path, text in contracts:
                with self.subTest(rung=rung, contract=path.name):
                    self.assertIn(rung, text)


class BoundaryAgreementTests(unittest.TestCase):
    def test_score_matcher_agrees_with_table(self):
        for case in BOUNDARY_CASES:
            with self.subTest(text=case.text, token=case.token):
                self.assertEqual(
                    score._contains_token(case.text, case.token), case.expected
                )

    def test_check_parse_matcher_agrees_with_table(self):
        for case in BOUNDARY_CASES:
            with self.subTest(text=case.text, token=case.token):
                self.assertEqual(
                    check_parse_contains(case.text, case.token), case.expected
                )

    def test_both_matchers_agree_with_each_other(self):
        for case in BOUNDARY_CASES:
            with self.subTest(text=case.text, token=case.token):
                self.assertEqual(
                    score._contains_token(case.text, case.token),
                    check_parse_contains(case.text, case.token),
                )


class PolicyAgreementTests(unittest.TestCase):
    def test_duplicate_url_message_is_shared(self):
        from_score = score_duplicate_message()
        from_validate = validate_duplicate_message()
        self.assertEqual(from_score, DUPLICATE_MESSAGE)
        self.assertEqual(from_validate, DUPLICATE_MESSAGE)
        self.assertEqual(from_score, from_validate)

    def test_scaffold_errors_are_confined_to_worker_fields(self):
        """A raw scaffold is a skeleton, so validation is expected to reject it —
        but only ever for the two fields the worker owns. Every field the
        scaffold itself fills (url, schema_version, and the requirement list's
        contents, kinds and order) must already be correct, for any pair."""
        for case in SCAFFOLD_CASES:
            with self.subTest(case=case.name):
                result = validate_guidance.validate_payload(guidance_payload(case))
                errors = tuple(
                    error
                    for row in result["invalid"]
                    for error in row["errors"]
                )
                scaffold_owned = tuple(
                    error
                    for error in errors
                    if not error.startswith(WORKER_OWNED_FIELDS)
                )
                self.assertEqual(
                    scaffold_owned,
                    (),
                    f"scaffold produced errors outside the worker's fields: {scaffold_owned}",
                )

    def test_direct_skill_hold_is_directional(self):
        cases = (
            ("React.js", "React", True),
            ("React", "React.js", False),
        )
        for candidate_term, job_term, expected in cases:
            with self.subTest(candidate=candidate_term, job=job_term):
                self.assertEqual(
                    models.direct_skill_hold(candidate_term, job_term), expected
                )


class JobPrepApplyInstructionTests(unittest.TestCase):
    def test_from_match_is_exact_and_never_backfills(self):
        skill = instruction_text(JOB_PREP)
        select = instruction_section(FLOW_PREP, "## 1. Select", "## 2. Liveness")

        self.assertIn("--from-match", skill)
        self.assertIn("--from-match", select)
        self.assertRegex(select, r"\bexact(?:ly)?\b")
        self.assertRegex(
            select,
            r"(?:never|no|do not)[^.]{0,100}\bbackfill",
        )
        self.assertRegex(
            select,
            r"(?:never|no|do not)[^.]{0,140}"
            r"(?:fall through to default selection|fall back|fallback)",
        )

    def test_digest_visibility_and_send_eligibility_are_separate(self):
        digest = instruction_text(FLOW_PREP)

        self.assertIn("keep every valid current plan", digest)
        for category in ("ready to send", "needs answers", "external blockers"):
            with self.subTest(category=category):
                self.assertIn(category, digest)
        self.assertRegex(digest, r"ready when `needs_you` is empty")
        self.assertRegex(
            digest,
            r"answers when `walls` is empty and `needs_you` is non-empty",
        )
        self.assertRegex(
            digest,
            r"external when `walls` is non-empty",
        )

    def test_only_ready_s_ids_route_to_yolo(self):
        digest = instruction_text(FLOW_PREP)

        self.assertIn(
            "only displayed `s` ids after `send` map to "
            "`/job-apply --yolo {slug}.md`",
            digest,
        )
        self.assertIn(
            "map displayed `a`/`b` ids after `review` to normal "
            "`/job-apply {slug}.md`",
            digest,
        )
        self.assertRegex(digest, r"an `a` or `b` id in `send`[^.]*stops before browser")

    def test_operator_reply_is_transient_same_session_context_not_approval(self):
        screening = instruction_text(CONTRACT_SCREENING)

        self.assertIn("operator reply", screening)
        self.assertIn("transient", screening)
        self.assertRegex(screening, r"same[- ]session")
        self.assertRegex(screening, r"(?:not|never)[^.]{0,160}\bapproval\b")

    def test_unreadable_prepared_cv_is_stale_not_ignored(self):
        apply = instruction_text(FLOW_APPLY)

        # Only a url mismatch may be ignored entirely: a plan for a different
        # posting is not a stale plan for this one.
        self.assertRegex(
            apply,
            r"a plan whose `url` does not match is ignored entirely",
        )
        # An unreadable `cv` is stale, so rule 0's `--yolo` clause covers it
        # instead of falling through to rule 1 and re-refining a fresh PDF.
        self.assertRegex(
            apply,
            r"a plan whose `cv` does not open,\s*"
            r"or opens but no longer matches `cv_sha256`, is stale",
        )
        self.assertNotRegex(
            apply,
            r"`cv` does not open, is ignored entirely",
        )
        self.assertRegex(
            apply,
            r"is stale: print `plan stale · \{slug\}`\. with `--yolo`, "
            r"skip this posting",
        )
        self.assertRegex(
            apply,
            r"never fall through under advance approval",
        )

    def test_yolo_is_consumed_before_unpreviewed_or_new_fields(self):
        apply = instruction_text(FLOW_APPLY)

        self.assertNotIn("skipping §5's unpreviewed-fields gate too", apply)
        self.assertRegex(
            apply,
            r"(?:--yolo[^.]{0,160}consum|consum[^.]{0,160}--yolo)",
        )
        self.assertRegex(apply, r"\bunpreviewed[- ]fields?\b")
        self.assertRegex(apply, r"\b(?:new fields?|fields? the live form added)\b")
        self.assertRegex(
            apply,
            r"new field[^.]{0,100}consum[^.]{0,200}standalone[^.]{0,80}\byes\b",
        )
        self.assertRegex(
            apply,
            r"field the approved package did not carry.{0,320}"
            r"consume `--yolo`.{0,200}standalone `yes`",
        )


if __name__ == "__main__":
    unittest.main()
