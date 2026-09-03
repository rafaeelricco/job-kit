# ResumeGuidance v1

A read-only projection from CandidateProfile and JobProfile. It prioritizes
source tokens; it is not a Fact source and contains no finished resume prose.

```json
{
  "schema_version": 1,
  "url": "",
  "requirements": [
    {
      "kind": "required",
      "job_term": "",
      "status": "held",
      "profile_term": ""
    }
  ],
  "priority_roles": [
    {
      "company": "",
      "position": "",
      "matched_on": ["role_type"]
    }
  ],
  "warnings": []
}
```

- `kind` is `required` or `preferred`.
- `status` is `held`, `not_evidenced`, or `unknown`.
- `held` follows `contract-match.md` Skill hold and requires an exact candidate token.
- `not_evidenced` means a discrete skill has no direct hold in CandidateProfile;
  it never means the candidate definitively lacks that experience.
- Non-skill or incomparable requirements are `unknown`.
- `profile_term` is the candidate token for `held`, otherwise `null`.
- Requirement terms come only from the corresponding JobProfile list.
- Priority roles are exact CandidateProfile company/position pairs and match only
  on `role_type` or `seniority`. `role_type` uses contract-match's normalized
  whole-position phrase within the JobProfile title. `seniority` uses the same
  or a one-step neighbor on its intern–junior–mid–senior–staff–principal ladder.
- Warning codes are `candidate_skills_empty`, `no_required_skills`, or
  `no_relevant_role`.
- No Summary, bullet, outcome, responsibility, score, or apply verdict is allowed.
