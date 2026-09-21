# Workspace-scoped posting identity

Status: proposed · Updated: 2026-09-20 · Implementation: not implemented

## Context

Aliases evolve and private observations must remain isolated.

## Decision

The platform should start with stable internal posting IDs and workspace-scoped observations. Provider IDs and normalized URLs are aliases.

The V1 requirements now rely on that minimal identity boundary for imports and discovery. This record remains proposed for the detailed uniqueness and observation-precedence protocol below; those implementation choices are not yet finalized. Shared public collection is not a V1 dependency.

## Alternatives considered

URL as permanent aggregate identity; shared public collection from the outset.

## Consequences and open work

Authoritative uniqueness and observation precedence need implementation. Shared caching is deferred.

## Design owner and evidence

[Owning design or study](../domain/discovery.md). This record extracts the disposition documented in the original September 19–20 proposals; it does not assert new implementation or provider validation.
