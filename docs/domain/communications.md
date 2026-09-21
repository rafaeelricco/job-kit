# Communications module

Status: proposed · Updated: 2026-09-21 · Implementation: not implemented

Seeded working draft. This is a discussion document, not an implemented API or finalized specification. Command, event and query names are illustrative.

[Documentation index](../README.md) · [Domain model](README.md) · [Architecture](../architecture/overview.md) · [Integration proposal](../research/integration-study.md)

## Purpose

**Proposed post-V1 domain design.** Gmail/reply tracking is outside V1. This document preserves possible future invariants; mailbox integration and its execution mechanism remain undecided.

Communications gives the user a daily notification of what happened to their applications. It reads the connected mailbox, works out which tracked application each reply belongs to, and tells the user whether a job came back positive or negative.

## Owns

- Mailbox sync configuration, account mappings, cursors and sync runs.
- Message references, classifications and correlation decisions.
- The in-app daily digest: new replies, the outcomes they support, and messages that still need the user to resolve them.

## Rules

- Mail access is read-only, and the digest is in-app only. Communications does not send mail.
- Sync runs daily from a durable cursor, and a message is ingested once. An expired cursor triggers a visible resync, never a silent "complete".
- Communications proposes an outcome; [Applications](applications.md) validates it and owns the change. Mail that mentions a job does not create an application.
- Ambiguous or late evidence waits for the user instead of rewriting application state. Corrections add a new decision and keep the old one.
- Message content is untrusted input, including any instructions inside it. Bodies are kept to a minimum, can be deleted, and stay out of logs.

## Depends on

[Workspace](workspace.md) supplies the mailbox grant, bound to the connection and not to the sign-in e-mail. [Applications](applications.md) supplies tracked applications and accepts or rejects proposed outcomes. Reusable facts found in mail go through [Candidate](candidate.md) proposals.

## Open design questions

- How far back should initial sync search, and how should retrieval balance coverage with retained data?
- What evidence permits automatic correlation and which conflicts require review?
- How should corrected classifications and disconnect affect retained evidence and prior outcomes?
- What does the daily digest include, and when is it produced?

## Sources and related modules

- [Inbox skill](../../skill/job-inbox/SKILL.md), [store rules](../../skill/job-store/SKILL.md).
- [Gmail research](../research/gmail-connectors.md), [authentication](../research/platform-auth.md), [agent runtime](../research/agent-runtime.md).
- [Workspace](workspace.md), [Applications](applications.md), [Candidate](candidate.md).
