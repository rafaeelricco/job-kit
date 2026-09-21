# Self-hosted browser execution for public discovery

Status: accepted · Updated: 2026-09-21 · Implementation: not implemented

## Context

V1 searches public job sites for hundreds of platform users. The user selected their own VPS-hosted Chrome and Browser Use. An existing Chrome on that VPS is shared by Hermes clients and retains personal authentication.

## Decision

Use the open-source Browser Use Python library with self-hosted Chrome for public browser discovery. Provision an independent Job Kit runtime/profile on the VPS; do not attach platform workers to Hermes's logged-in browser. Keep CDP private.

Retain documented HTTP source adapters and separate scout from matching. This choice does not introduce authenticated sites, applications, arbitrary web crawling, or a requirement for end users to install a companion. Managed Browser Use Cloud is not the selected browser runtime.

## Alternatives considered

Managed browsers; self-hosted Playwright/Crawlee only; personal Aside/companion execution; attaching Job Kit to the existing shared Hermes browser.

## Consequences and open work

The platform owns resource limits, isolation, updates, cleanup, and source-access failures. Browser Use requires a separately configured model; hosting Chrome does not supply inference or transfer a personal chat subscription to the backend.

VPS coexistence, model/provider funding, source catalog, and throughput need validation. Shared public caching remains a proposed implementation refinement. No remote deployment was performed.

## Design owner and earlier decisions

[Browser workers](../architecture/browser-workers.md) owns the design; [scaling research](../research/backend-browser-scaling.md) retains the alternatives. [Decision 0008](0008-self-hosted-platform.md) selects the VPS-hosted platform and Compose services that run this worker.

This public-only browser choice remains in force under the web-only direction in [Decision 0007](0007-web-only-platform.md). The earlier companion proposal in Decision 0001 is superseded. User AI credentials and authorization remain separate from browser hosting and are handled by encrypted server-side provider adapters.
