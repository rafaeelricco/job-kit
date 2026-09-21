# Persistence and recovery

Status: proposed · Updated: 2026-09-21 · Implementation: not implemented

This is the selected shared design for selective event sourcing, command receipts, durable work intent, `pg-boss` delivery, projections, and replay. [Decision 0002](../decisions/0002-selective-event-sourcing.md) accepts the event-sourcing boundary. [Domain modules](../domain/README.md) own the invariants those mechanisms protect; [execution](execution.md) owns the job lifecycle and external work.

## Event sourcing boundaries

Record consequential lifecycle decisions as immutable domain events: opportunity saved or dismissed, profile revision confirmed, evaluation accepted, and, when later application work is designed, package prepared or an application outcome recorded. Keep append-only history selective. Do not event-source every field or use events as storage for controlled content. Preserve evaluations and document versions as immutable results referenced by appropriate records.

Contact details, CVs, full prompts, provider credentials, mail bodies, and browser-session material stay in separately controlled records or private persistent volumes. Events carry only the decision metadata and references required to explain and rebuild state. References and hashes can still be sensitive. Deletion must cover source content, private files, derived projections, workflow payloads, traces, and backups under a defined retention policy. Replay after deletion preserves lifecycle state and marks evidence unavailable; it never resurrects deleted content.

A proposed event envelope carries `eventId`, `workspaceId`, `streamType`, `streamId`, and `streamVersion`. It also carries `eventType`, `schemaVersion`, `occurredAt`, `recordedAt`, actor, command ID, correlation ID, causation ID, run ID, and payload. Keep routing affinity separate from causation. Store UTC instants and the workspace timezone; recurring schedules and user-visible calendar dates use the intended timezone.

## Command transaction and durable intent

The command transaction must:

1. Verify authenticated workspace access and a scoped idempotency key plus semantic request fingerprint.
2. Read authoritative state and enforce the expected version and domain rules.
3. Append domain events where the operation is event-sourced, update the stream head, and save the command result and durable operation/work intent atomically.
4. Return the committed operation identity and revision so the UI can show progress while projections catch up.

The transaction never calls a model, a website, a file parser, or an external provider. Cross-stream invariants require an explicit shared reservation, unique constraint, lock, or Serializable transaction with bounded retries. Prepare external artifacts before an accepted record references them because PostgreSQL cannot roll back a private-volume write.

The dispatcher publishes durable intent to `pg-boss` with a stable operation identity and records acknowledgement. A crash after enqueue but before acknowledgement can publish a duplicate queue message. Workers must claim/check the durable operation and unique effect key before running; duplicate dispatch returns the existing result or resumes the same operation. Application intent, receipts, and external-attempt identity outlive `pg-boss` retention. Queue deduplication or job retention is not the permanent business idempotency boundary.

## Receipts, projections, and retry boundaries

Projection consumers commit their changes and `(consumerVersion, eventId)` receipt in the same transaction. Rebuild into versioned projection tables with separate receipts and a controlled cutover. Preserve required per-stream ordering, detect version gaps, and avoid assuming order across unrelated streams. A rebuild never starts historical submissions or sends mail.

Keep three kinds of repetition distinct:

| Repetition     | Identity and recovery boundary                                     | Required result                                                                           |
| -------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Command retry  | Workspace-scoped command identity and semantic request fingerprint | Return the committed result; reject changed input under that identity                     |
| Queue delivery | Durable operation and effect identity plus worker receipt          | Acknowledge a completed operation or resume it without creating another logical operation |
| External retry | Durable attempt identity and available provider contract           | Resolve prior completion, retry only when justified, or reconcile uncertainty             |

An outbox dispatcher can retry failed enqueue operations. It must track individual rows rather than assume that an increasing database sequence is commit order or skip late commits behind a cursor. User answers, confirmed profile edits, and cancellation decisions use the same durable command and intent handoff. A job's exit code or lost response is not proof that an external effect failed; inspect persisted evidence and reconcile before retrying consequential work.

## Read models and replay

Queries may combine business state with live operation status deliberately. Operational waits and leases need not become permanent domain events, and a rebuilt business projection does not reconstruct a live lease. A temporarily missing projection row does not prove that an accepted command failed.

| Query need     | Derived business information                              | Separate execution information                              |
| -------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| `GetProfile`   | Confirmed snapshot, preferences, proposed facts, and gaps | Pending profile generation or provider wait                 |
| `GetScoutRun`  | Persisted sources, postings, provenance, and coverage     | Collection progress, retry state, and browser capacity wait |
| `ListDossiers` | Current fit and retained result history                   | Pending or incomplete reassessment                          |

Replay applies recorded decisions without reauthorizing them under today's policy. It does not reread mail, refetch postings, regenerate documents, invoke models, or dispatch external actions. Recorded time contributes to deterministic reconstruction; a new command separately applies current-time rules. Retain historical payload fixtures and distinguish event schema versions, stream revisions, and business-policy versions.

Posting identity remains a stable internal ID scoped to a workspace. Source IDs and normalized URLs are aliases, not permanent aggregate identity. Shared public caching remains a separate deferred refinement under [posting identity](../decisions/0004-posting-identity.md).
