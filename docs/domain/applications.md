# Applications module

Status: proposed · Updated: 2026-09-21 · Implementation: not implemented

Seeded working draft. This is a discussion document, not an implemented API or finalized specification. Command, event and query names are illustrative.

[Documentation index](../README.md) · [Domain model](README.md) · [Architecture](../architecture/overview.md) · [Integration proposal](../research/integration-study.md)

## Purpose and user journeys

**Proposed post-V1 domain design.** Applications, submission, and copy-apply-prompt flows are outside V1. This document preserves possible future invariants; future product and execution mechanisms remain undecided. No companion or local executor is selected.

Applications manages a user's pursuit of a posting. The user saves an opportunity, prepares a package, resolves missing answers, and submits under chosen authority. Applications then tracks outcomes. It distinguishes a requested action from evidence that the external action happened.

## Decision status

The accepted constraint is private workspace scope. The automation authority examples below remain proposals; no companion, local execution, or application automation mechanism is selected.

The recommendations are to separate opportunity, package and attempt records, to freeze inputs, and to reconcile uncertain submissions before retrying irreversible actions.

Still open: the launch adapter, the live-change policy, and the reconciliation UX.

## Owned records and event boundaries

Applications owns opportunities, package revisions and tailored artifacts. It also owns package-specific authorization evidence, attempts and application outcomes. Discovery owns posting identity and availability. Candidate owns reusable facts and resume sources. Evaluation owns assessments.

The design should event-source saved and dismissed opportunities, package preparation and authorization decisions. It should also event-source submission transitions and outcomes. Documents, answers and screenshots remain private controlled content referenced by lifecycle records and digests.

Posting availability, preparation, submission and outcome states should stay separate. A closed posting can still have an active interview.

## Decision boundary and retained evidence

For this example, the design proposes one application stream per opportunity. Its package lifecycle, concrete authorization, cancellation, and active or uncertain attempts share the boundary because those facts jointly determine whether submission may begin. Separate package and attempt records do not require separate aggregate streams. Attempt IDs identify external operations within the pursuit.

Decision state should stay limited to facts needed for subsequent rules: relevant package/input identities, authorization, cancellation, and attempt outcomes. Detailed documents and screenshots remain controlled content. Timelines and action queues are projections. The complete lifecycle history can contain facts that do not enlarge decision state.

Changing answers or artifacts creates a new package revision and requires a new recorded authorization decision. Existing automation can supply that decision when its policy permits. Bounded live edits are an open extension, not part of the [exact-package example](journeys/application-submission.md). New candidate information does not rewrite old packages or historical authorizations.

Applications should use authoritative Workspace grant and policy state when deciding whether work is permitted. It should also protect mutable read dependencies as well as the application reservation: all participating writers, including revocation, must follow a shared database locking or version-validation protocol. An expected revision on the application stream alone does not establish that a separately read grant remained valid. The precise store protocol belongs to the [shared transaction guarantees](../architecture/persistence.md).

By contrast, an immutable profile revision intentionally selected for preparation or evaluation is the correct historical input even if a newer profile now exists. Current eligibility checks before submission must be explicit; they cannot silently replace the package's frozen inputs. Any required new package goes through preparation and authorization again.

Applications should recheck online execution authority immediately before issuing the external action. The database and remote website do not share a transaction: revocation can commit after that check while an action is already being issued. It should stop future authorizations and reconcile effects already in flight. Applications should not promise that revocation or cancellation can undo a submitted application.

See the [submission journey](journeys/application-submission.md) for the cross-module walkthrough and [persistence](../architecture/persistence.md) for the transaction protocol.

## Workflows and illustrative contracts

1. `SaveOpportunity` links a user's pursuit to a posting. `PrepareApplication` freezes profile, posting, answer and relevant evaluation revisions.
2. Preparation progresses from requested to preparing, then ready or needs-answer. `RecordPreparedPackage` binds artifacts and digests. Missing facts go through Candidate commands.
3. `AuthorizeSubmission` records explicit authority or an applicable Workspace policy revision. It should recheck grants, eligibility, package revision and cancellation immediately before execution.
4. `StartSubmissionAttempt` durably claims the operation before Submit. Workers should use `ConfirmSubmission` with evidence, or `MarkSubmissionUnconfirmed` when the effect is uncertain.
5. `ReconcileSubmission` resolves uncertainty from evidence or requests user action. `RecordApplicationOutcome` validates later evidence against application history.

Illustrative events: `OpportunitySaved`, `ApplicationPackagePrepared`, `SubmissionStarted`, `SubmissionConfirmed`, `SubmissionUnconfirmed`, `ApplicationOutcomeRecorded`. Queries: `GetApplication`, `GetPreparedPackage`, `ListApplicationsNeedingAction`.

## Dependencies and ownership contracts

Applications should read Candidate/Discovery snapshots through their interfaces and request updates through their commands. Communications supplies evidence but cannot overwrite application state. Workspace owns policy. Applications owns the concrete authorization decision and attempt.

If a future implementation is selected, durable work must coordinate with a supported browser mechanism and re-inspect pages when resuming. A durable workflow does not restore arbitrary lost tabs. No execution mechanism is selected here.

Changed facts or artifacts require a new package revision unless the recorded policy permits bounded live changes and captures the final package. The shared transactional event/receipt/work-intent pattern is accepted in [decision 0002](../decisions/0002-selective-event-sourcing.md); application-specific workflow initiation and execution remain undecided. Projection replay must not submit applications or rerun paid generation.

## Failure handling, privacy and authorization

Applications should distinguish several failure states: missing answers, stale packages, closed postings and expired sessions. It should also distinguish challenges, cancellation and uncertain submissions. Durable reservations prevent concurrent logical attempts. A lost lease is not proof a remote click failed.

Applications should reconcile before clicking again when Submit may have succeeded. It should use provider idempotency where available, and it should not promise exactly-once effects for arbitrary websites. Cancellation cannot undo completed submission.

Credentials should stay behind browser adapters. Artifact and evidence access should be restricted by workspace, and screenshot/form-content retention should be minimized.

## Acceptance scenarios

- Given an authorized package that is submitted, when its history is reconstructed, then authorization is bound to the exact submitted package.
- Given cancellation after a submission was issued, when valid confirmation arrives later, then confirmation is retained as evidence of the completed effect.
- Given an uncertain attempt, when another worker resumes the operation, then it reconciles the outcome and uncertainty blocks resubmission.
- Concurrent requests and repeated workflow starts create one logical attempt.
- Changed packages cannot reuse exact-package authorization without the necessary new decision.
- Worker loss after Submit records uncertainty and never automatically clicks again.
- Ambiguous mail leaves state unchanged; posting closure does not erase interview history.
- Projection replay causes no external submission, email or model call.

## Open design questions

- Which ATS and browser mode define the first supported submission journey?
- What live changes may automation authorize, and which require a new package decision?
- Which evidence confirms submission, and when should reconciliation request user intervention?

## Sources and related modules

- [Apply skill](../../skill/job-apply/SKILL.md), [preparation](../../skill/job-prep/SKILL.md), [resume refinement](../../skill/job-resume-refine/SKILL.md), [store rules](../../skill/job-store/SKILL.md).
- [Browser research](../research/browser-applications.md), [schedulers](../research/schedulers.md), [agent runtime](../research/agent-runtime.md).
- [Workspace](workspace.md), [Candidate](candidate.md), [Discovery](discovery.md), [Evaluation](evaluation.md), [Communications](communications.md).
