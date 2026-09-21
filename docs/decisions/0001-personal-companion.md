# Personal companion execution

Status: superseded · Updated: 2026-09-21 · Implementation: not implemented
Superseded by: [Decision 0007: Web-only product platform](0007-web-only-platform.md)

## Historical context

The September 19–20 proposal treated existing AI subscriptions and authenticated local browsers as product priorities.

## Historical decision (superseded)

The product uses a web platform plus an enrolled personal companion. The cloud remains authoritative; device execution is bounded.

Scope clarification on 2026-09-21: self-hosted discovery runs public browser searches on the VPS with Browser Use and a dedicated Chrome. The companion remains for personal-runtime work and later authenticated local workflows; it is not required for V1 public navigation. Decision 0007 supersedes the companion portion of this clarification; [Decision 0006](0006-self-hosted-discovery-browser.md) retains the VPS public-browser choice.

## Alternatives considered

Fully hosted execution; skills/MCP integration entirely inside an existing host.

## Historical consequences and open work

Under this proposal, device availability can delay personal work. Provider permission and implementation choices remain unresolved; acceptance of that product direction did not accept every runtime vendor.

## Supersession and historical evidence

[Decision 0007](0007-web-only-platform.md) replaces the companion direction. The [execution design](../architecture/execution.md) records current work ownership. This ADR preserves the original proposal as historical evidence; it does not assert implementation or provider validation.
