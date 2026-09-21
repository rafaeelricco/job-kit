# Selective event sourcing

Status: accepted · Updated: 2026-09-21 · Implementation: not implemented

## Context

The platform must explain consequential decisions and recover without recreating external effects.

## Decision

The platform selectively event-sources consequential lifecycle decisions and keeps controlled content and operational records separately authoritative for their purposes. It does not event-source every persisted field. PostgreSQL transactions atomically record each accepted domain transition, command receipt, and durable work intent where work must follow. Rebuild and replay apply recorded decisions without repeating external effects.

## Alternatives considered

CRUD with an audit log; event-sourcing every persisted record.

## Consequences and open work

Requires explicit stream invariants, schema compatibility, replay isolation, and deletion-aware reconstruction. Application state, receipts, and work intent remain the idempotency authority; `pg-boss` message retention is not a business guarantee.

## Design owner and evidence

[Owning design](../architecture/persistence.md). This accepted direction is not yet implemented and does not assert any provider validation.
