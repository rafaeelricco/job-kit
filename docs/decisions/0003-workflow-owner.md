# Workflow owner

Status: superseded · Updated: 2026-09-21 · Implementation: not implemented
Superseded by: [Decision 0008: Self-hosted platform](0008-self-hosted-platform.md)

## Historical context

The September 19–20 proposal needed durable coordination for daily ingestion, companion waits, and recoverable tasks.

## Historical decision (superseded)

Use Trigger.dev Cloud with permanent business idempotency and a transactional outbox in PostgreSQL.

## Alternatives considered

Temporal, Inngest, pg-boss; custom event delivery is a separate concern.

## Historical consequences and open work

The original proposal left Trigger.dev Cloud capabilities and deduplication windows for validation. It retained application authority and reconciliation responsibilities.

## Supersession and historical evidence

[Decision 0008](0008-self-hosted-platform.md) supersedes this workflow choice. The current target runs services on the owner's VPS with Docker Compose and dispatches through `pg-boss`, backed by application-owned durable intent and operation idempotency. Queue retention does not define business idempotency. The [execution design](../architecture/execution.md) and [scheduler study](../research/schedulers.md) distinguish this target from vendor research. This ADR preserves the original proposal as historical evidence; it does not assert implementation or capability validation.
