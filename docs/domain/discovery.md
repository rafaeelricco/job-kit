# Discovery module

Status: proposed · Updated: 2026-09-21 · Implementation: not implemented

Seeded working draft. This is a discussion document, not an implemented API or finalized specification. Command, event and query names are illustrative.

[Documentation index](../README.md) · [Domain model](README.md) · [Architecture](../architecture/overview.md) · [Integration proposal](../research/integration-study.md)

## Purpose

Discovery is the whole process of finding new jobs for the user. It scouts postings, asks [Evaluation](evaluation.md) to match them against the candidate, and shows the user the result.

## Owns

- Search definitions and their revisions, discovery runs and source references.
- Suggested employer catalog and user-supplied supported company links; unsupported links remain visible as unsupported.
- Legacy dossier imports with conflict review, deduplication, source provenance and known dates; imported content never invents domain events.
- Posting identities, URL aliases, snapshots and availability observations.
- The result list shown to the user: which postings a run found, scout's 0–10 required-skill coverage, and a reference to each posting's Evaluation assessment.

## Rules

- Discovery orchestrates the match; Evaluation owns the assessment. Scout's 0–10 coverage and match's 0–100 fit stay separate scores.
- Posting identity is workspace-scoped and stable. Company and title similarity never merges two requisitions.
- Observations are immutable evidence. Arrival order does not decide availability, and a partial or failed run never closes a posting.
- Rate limits, expired logins and parser errors are failures, not zero results.
- Public sources only: Greenhouse, Lever, and Ashby HTTP adapters plus a selected public browser source after its proof. Login walls and challenges are blocked; no login takeover is available. Keep provenance and workspace privacy.
- The user's selected AI connection powers browser-agent calls. When unavailable, the run waits for reconnect or an explicit manual account switch; no platform-funded or alternate-account AI fallback occurs.
- Persist scout observations before independently queueing evaluation. Evaluation retries or failure never erase discovered postings; opening a posting page does not rerun a model.

## Depends on

[Candidate](candidate.md) supplies versioned preferences. [Evaluation](evaluation.md) supplies the match. [Applications](applications.md) saves postings as opportunities through its own commands and asks Discovery for a fresh observation before submitting. [Workspace](workspace.md) supplies grants and policies, and the scheduler coordinates runs.

## Open design questions

- Which first employer source and measured numeric run/capacity limits should bound the initial proof?
- When should suspected duplicates require review, and when is shared public caching justified?

## Sources and related modules

- [Discovery research](../research/job-discovery.md), [browser research](../research/browser-applications.md), [schedulers](../research/schedulers.md).
- [Scout skill](../../skill/job-scout/SKILL.md), [store rules](../../skill/job-store/SKILL.md).
- [Evaluation](evaluation.md), [Applications](applications.md), [Candidate](candidate.md).
