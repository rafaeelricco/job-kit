# Self-hosted platform

Status: accepted · Updated: 2026-09-21 · Implementation: not implemented
Supersedes: [Decision 0003: Workflow owner](0003-workflow-owner.md)

## Context

The product needs an authenticated web API, durable domain state and work, private user files, and isolated workers. The owner has selected the existing VPS as the deployment target. Auth, database, workflow, browser, and file storage should remain under this deployment's operational control; external model providers and public job sites remain explicit integrations.

## Decision

Run the product services on the owner's VPS using Docker Compose. The selected stack is:

- Fastify and TypeScript for the authenticated API and server workers.
- PostgreSQL with Drizzle for domain records, selective event history, operation receipts, and durable work intent.
- Better Auth for Google OAuth or passwordless email OTP; use the existing SMTP account to send OTPs and limit pilot access to the approved email list. Do not enable passwords. Auth-library identity linking owns account association; the application does not merge users by email-string comparison.
- `pg-boss` for queue delivery, with durable application intent and operation/effect receipts that prevent redelivery from creating duplicate logical work. Queue retention is not the permanent idempotency record.
- Private persistent volumes outside nginx's static root. Access files through authorized server handlers that verify workspace ownership. Provider adapters encrypt credentials and tokens before database persistence and decrypt only for authorized provider operations.
- The Python Browser Use worker and dedicated Chrome runtime selected by [Decision 0006](0006-self-hosted-discovery-browser.md).

No managed auth, database, workflow, browser, or object-storage service is selected in the current or future target. Remote AI APIs and supported public job sources are integrations called through explicit, encrypted or bounded server adapters; their authorization and technical compatibility must be validated separately.

## Alternatives considered

- The earlier Trigger.dev Cloud workflow proposal in [Decision 0003](0003-workflow-owner.md).
- Managed authentication, PostgreSQL, and storage such as Supabase.
- Managed browser and workflow services.

## Consequences and open work

The owner operates database and volume backups, migrations, monitoring, patching, service isolation, key rotation, and recovery. Queue retries are reconciled against durable application operations. File serving and backup retention need deletion-aware policy. Provider login compatibility, access permissions, first public browser source, and measured VPS capacity remain open validation gates; accepting this ADR does not claim those proofs have passed.

## Supersedes and design owner

This decision supersedes [workflow owner](0003-workflow-owner.md). The [platform overview](../architecture/overview.md), [identity and data design](../architecture/identity-and-data.md), [persistence design](../architecture/persistence.md), and [execution design](../architecture/execution.md) own its detail. The selected target is not yet implemented.
