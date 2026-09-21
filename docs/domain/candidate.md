# Candidate module

Status: proposed · Updated: 2026-09-21 · Implementation: not implemented

Seeded working draft. This is a discussion document, not an implemented API or finalized specification. Command, event and query names are illustrative.

[Documentation index](../README.md) · [Domain model](README.md) · [Architecture](../architecture/overview.md) · [Integration proposal](../research/integration-study.md)

## Purpose

A candidate is the user's profile inside their [Workspace](workspace.md). Google and email OTP are authentication methods for the same user; each authenticated user has one candidate and workspace.

## Owns

- The account's professional profile: drafts and published revisions, confirmed facts, reusable answers, preferences and constraints.
- Evidence, interview stories and reusable resume sources.
- PDF CV intake (text extraction only; scanned or unreadable PDFs use manual entry) and manual questionnaire intake.
- Profile import with conflict review, source provenance, and no invented historical events; editable profile export remains available.
- Search preferences with required target roles, locations, and work models.

## Rules

- One candidate per authenticated user ID. Google and email OTP sign-in methods resolve through the authentication service to the same user identity; email comparison never merges accounts.
- A generated claim never becomes a confirmed fact by itself. The user confirms it, and the confirmation records who and from what source.
- Each confirmed profile publication is an immutable whole-profile snapshot. An evaluation or package keeps the snapshot it was built from.
- Confirmed changes publish a new immutable whole-profile snapshot and automatically request reassessment of affected current matches; old assessments and history remain intact.
- Missing salary, authorization, dates or metrics stay unknown. Story wording cannot turn team work into individual credit or add unsupported numbers.
- Deleted evidence stays deleted; replay does not bring it back.
- An import records the known source and dates, never fabricates past confirmations or other domain events, and presents conflicts for user review before changing confirmed state.

## Depends on

[Workspace](workspace.md) supplies the scope and authorization. [Evaluation](evaluation.md) and [Applications](applications.md) read profile snapshots, and [Discovery](discovery.md) reads preferences. They can propose facts or questions through Candidate, but none of them can confirm a fact.

## Open design questions

- How should self-attestation differ from document-supported verification?
- Which PDF text extraction limits and manual fallback details should the intake explain?

## Sources and related modules

- [Profile skill](../../skill/job-profile/SKILL.md), [stories](../../skill/job-stories/SKILL.md), [resume refinement](../../skill/job-resume-refine/SKILL.md), [wording refinement](../../skill/job-humanize/SKILL.md).
- [Agent-runtime research](../research/agent-runtime.md).
- [Workspace](workspace.md), [Evaluation](evaluation.md), [Applications](applications.md), [Discovery](discovery.md).
