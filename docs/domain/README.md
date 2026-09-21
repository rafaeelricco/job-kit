# Domain model

Status: proposed · Updated: 2026-09-21 · Implementation: not implemented

Read the [product overview](../product/overview.md) first. Module documents own business invariants and acceptance scenarios. The [submission journey](journeys/application-submission.md) connects them; [persistence](../architecture/persistence.md) owns shared mechanics.

Selective event sourcing is the accepted, not implemented, persistence direction ([decision 0002](../decisions/0002-selective-event-sourcing.md)). Applications and Communications below preserve proposed post-V1 invariants and examples; they do not add those capabilities or select a future execution mechanism. There is no selected companion or local executor.

This guide applies the [event-sourcing handbook](/Users/rafaelricco/Projects/ambar/event-storming/event-sourcing-thinking-and-implementation.md) in order. It starts from the scenario and the command, moves through authoritative inputs and the invariant, then records committed facts. It follows reactions and projections, and ends with recovery. Names remain illustrative rather than implemented contracts.

## Questions history must answer

- Which candidate facts, posting snapshot, and assessment informed this package?
- What authorized submission of these exact answers and artifacts?
- What evidence establishes whether submission happened?
- Why did the application's outcome change?

A task completing is not evidence that an application was submitted. A model proposing an answer is not a candidate confirming it. Recording these distinctions is more useful than emitting an event for every database write.

## Information categories

| Information                  | Authority and purpose                                                   | Job Kit example                                                  |
| ---------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Command                      | Requests a decision that may be rejected                                | `AuthorizeSubmission`                                            |
| Domain event                 | Authoritative record of an accepted business fact                       | `SubmissionAuthorized`                                           |
| Decision state               | Reconstructed facts needed to enforce the next decision's rules         | Authorized package revision and unresolved attempt               |
| Versioned controlled content | Authoritative content stored separately from lifecycle history          | Published profile content, CV bytes, accepted assessment details |
| Projection                   | Rebuildable interpretation of retained facts for a query                | Application timeline and submission status                       |
| Operational record           | Authoritative progress for an execution mechanism, not business history | Mail cursor, work lease, retry count                             |

Only meaningful decisions should be event-sourced. Being persisted does not turn something into a domain event: credentials, sessions and document bodies stay out, and so do mail cursors and leases. An operational record can be authoritative for its own purpose without becoming the application's business event store.

Each module should state what events reconstruct and what requires separately retained content. Events must retain enough decision metadata to explain the accepted outcome. That metadata includes relevant identities and revisions, actor or policy authority, and recorded decision time. It also includes the outcome and evidence references. The system should not copy secrets or full documents into permanent history. References and digests can still be sensitive.

History can reconstruct that a package was authorized and confirmed even after supporting content is deleted. It cannot recreate the deleted CV or reevaluate a claim whose required evidence is gone. Such content remains unavailable. A new decision requiring it must obtain suitable evidence or remain blocked; replay does not manufacture it.

## Ownership map

| Module                              | Decision history                                       | Separate information                                  |
| ----------------------------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| [Workspace](workspace.md)           | Connections, revocations, automation policies          | Encrypted provider credentials and controlled content |
| [Candidate](candidate.md)           | Confirmation, correction, publication                  | Drafts and controlled evidence                        |
| [Discovery](discovery.md)           | Search definitions, run outcomes, posting observations | Fetch telemetry, checkpoints, result lists            |
| [Evaluation](evaluation.md)         | Accepted assessments bound to input revisions          | Model execution and detailed result content           |
| [Applications](applications.md)     | Pursuit, packages, authority, attempts, outcomes       | Documents and browser execution evidence              |
| [Communications](communications.md) | Classification and correlation decisions               | Cursors, message bodies and the daily digest          |

These are ownership areas, not six aggregate definitions. Each stream follows the invariant that must hold when its next decision commits. Workspace separates grant decisions from policy publication. Evaluation protects completion of a particular request. Applications must coordinate an opportunity's authorization and unresolved attempts. The module documents explain the proposed boundaries and remaining questions.

Workspace is the user's private space. Candidate publishes reusable confirmed facts. Discovery scouts postings, asks Evaluation to assess them, and presents the results. Applications and Communications describe proposed post-V1 application and reply-tracking invariants; their future product and execution mechanisms remain undecided. A consumer requests a decision from its owning module rather than directly editing that module's records.

The design should start with workspace-scoped posting identity and observations. Provider identities and URL aliases resolve to stable internal IDs. Shared public collection is deferred. Posting availability, preparation progress, submission state, and application outcome remain separate: a posting can close while an application remains in interview.
