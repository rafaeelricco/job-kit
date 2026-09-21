# Evaluation module

Status: proposed · Updated: 2026-09-21 · Implementation: not implemented

Seeded working draft. This is a discussion document, not an implemented API or finalized specification. Command, event and query names are illustrative.

[Documentation index](../README.md) · [Domain model](README.md) · [Architecture](../architecture/overview.md) · [Integration proposal](../research/integration-study.md)

## Purpose

Evaluation assesses how well a posting fits a candidate, following the [match skill](../../skill/job-match/SKILL.md). User AI powers profile generation and browser-agent work. TypeSafe remains a separate platform-funded matching service.

## Owns

- Evaluation requests, immutable assessments, rubric and scorer revisions, and evidence mappings.
- For each assessment: the profile revision, posting snapshot, rubric, engine and version that produced it.

## Rules

- TypeSafe AI is the platform-funded default match path. If it is unavailable, the selected user-funded AI connection supplies judgment factors; the system never changes user accounts or billing routes automatically.
- Scoring stays deterministic. TypeSafe or the selected user AI answers judgment factors, and the existing Python [scorer](../../skill/job-match/scripts/score.py) computes the 0–100 fit behind a versioned contract.
- An answer below the engine's confidence floor is unknown, not zero. Confidence means how much evidence covers the score, not the chance of an offer.
- One accepted result per request. A reassessment is a new request, and an earlier result stays valid for the inputs it was pinned to.
- A confirmed profile change automatically requests reassessment for affected current postings. If selected user AI is unavailable, work remains saved and waits for reconnect or an explicit manual account switch.
- A generated interpretation cannot confirm a candidate fact. A high score does not authorize a submission.
- Replay uses recorded results and never calls a model again. Only the inputs a match needs are sent to the provider.

## Depends on

[Candidate](candidate.md) supplies profile snapshots and [Discovery](discovery.md) supplies posting snapshots and requests matches. [Applications](applications.md) reads assessments during preparation but owns eligibility and authorization.

## Open design questions

- Who can customize rubrics, and which changes require reassessment?
- How should user disagreement be recorded without rewriting the original result?
- Which TypeSafe failure states should use selected user AI, and how is the source shown in the result?

## Sources and related modules

- [Match skill](../../skill/job-match/SKILL.md), [TypeSafe adapter](../../skill/job-match/scripts/typesafe_match.py), [scorer](../../skill/job-match/scripts/score.py), [scout skill](../../skill/job-scout/SKILL.md).
- [Agent-runtime research](../research/agent-runtime.md), [provider connections](../research/provider-connections.md).
- [Candidate](candidate.md), [Discovery](discovery.md), [Applications](applications.md).
