# First scout

Status: proposed · Updated: 2026-09-21 · Implementation: not implemented

[Delivery roadmap](../roadmap.md) · [Discovery](../../domain/discovery.md) · [Candidate](../../domain/candidate.md) · [Evaluation](../../domain/evaluation.md)

## Outcome

The user starts a search from their confirmed profile and receives persisted postings. Scout and match run as separate durable processes: scout finds and records postings; match assesses posting snapshots against the confirmed profile. Scout can finish while matching remains pending. Browser-agent work uses the selected own-AI provider and never switches accounts or billing routes automatically.

## Current state

Scouting runs through the existing [job-scout skill](../../../skill/job-scout/SKILL.md). Its [persistence gate](../../../skill/job-scout/references/flows/flow-match-gate.md) currently requires both coverage and match thresholds before creating a dossier. The proposed app separates these processes and persists discovery results before matching. This changes the app design; the existing skills remain unchanged.

## V1 boundaries and dependencies

Use [Candidate](../../domain/candidate.md) preferences and [Discovery](../../domain/discovery.md) ownership. Start with a user-initiated run after [profile setup](03-ai-profile.md), using the supported employer catalog, supported supplied company links, and a specifically selected public browser source. This step delivers scouting and the durable handoff to the separate match process. [Evaluation](../../domain/evaluation.md) owns assessments; [step 05](05-check-matches.md) owns match review. Recurring searches follow V1.

## Search scope

Start with public Greenhouse, Lever, and Ashby HTTP adapters and an explicit catalog of supported employer boards. Adapter support alone does not provide cross-employer search. Show the selected employers and supported coverage before starting; allow users to add supported company career links. Prove pagination, source identifiers and URL aliases, descriptions, publication dates where supplied, duplicate handling, and partial/error outcomes against permitted representative boards before claiming coverage. A missing publication date remains unknown.

Reuse confirmed target roles, locations, work models, posting-age preferences, and exclusions. Changes made for one run do not silently overwrite saved preferences. Freeze the profile and search configuration revisions when the run starts.

Select and name one permitted public browser source before implementation, then prove its query or navigation, pagination, extraction, and recovery through the accepted [VPS Browser Use runtime](../../architecture/browser-workers.md). This is a source-specific proof, not a claim of arbitrary web discovery. Keep login walls, challenges, and authenticated-board support outside V1. Follow [discovery research](../../research/job-discovery.md) for adapter constraints and provenance. Record source-proof gaps and unmeasured source/run/capacity limits as bounded blocker tickets in the [delivery backlog](../linear-backlog.md); do not invent numeric thresholds.

## Separate processes

### Scout

Scout collects postings, extracts and validates their facts, applies search constraints, calculates the 0–10 required-skill coverage when possible, and persists its results. It records source progress, incomplete coverage, exclusions, and extraction failures.

Scout completion depends on its own work, not on a match score or matching-provider availability. A completed run may have no results or partial coverage; those outcomes must remain distinguishable from failure.

### Match

Match consumes persisted posting snapshots and the selected immutable profile revision. It owns a separate request identity, execution state, and accepted assessment. TypeSafe AI is the platform-funded default; when it is unavailable, use the selected user's AI as fallback and record the engine. This does not mean switching automatically between the user's accounts or billing routes. If the selected AI is unavailable, retain work as pending for reconnection or an explicit manual switch. Keep the deterministic Python scorer and existing evidence rules.

Match can run or retry without searching the sources again. Pending, failed, or low-fit assessments do not remove scout results or change the scout run's outcome. Reassessment creates a new request rather than overwriting an accepted result.

### Handoff

As postings become ready for assessment, Discovery automatically records durable requests for Evaluation. Matching may begin before the entire scout run finishes, but scout does not wait for those requests to complete.

Commit the selected posting/profile references and work intent through the [persistence contract](../../architecture/persistence.md). A crash between saving a posting and dispatching matching must leave recoverable work. Retried delivery must not create duplicate logical assessment requests.

Retained discovery results, recommended matches, and user-saved opportunities are different records. Match thresholds may control recommendations; they must not control whether discovery evidence survives.

## Backend implementation direction

Use the proposed [API, persistence, and worker architecture](../../architecture/overview.md). Starting scout returns a persisted run identity promptly; external collection and model work happen outside the request transaction.

Persist the scout run, source attempts and checkpoints, posting identities and snapshots, per-posting outcomes, and references to separate assessment requests. Follow [posting identity](../../decisions/0004-posting-identity.md) for workspace scope, stable internal IDs, and URL aliases.

Public HTTP collection runs in backend workers. Public browser searches run through the open-source Browser Use Python library and a fresh dedicated Chrome/profile per attempt on the user's VPS, under [decision 0006](../../decisions/0006-self-hosted-discovery-browser.md). Keep Job Kit isolated from the existing Hermes browser and profile. Begin the coexistence proof with one Job Kit browser slot; measure host contention and source/run capacity before increasing limits. Use renewable scoped claims, persist progress durably, and clean up Chrome after success, failure, cancellation, or worker loss. Browser-agent AI uses the selected own-AI provider through the hosted encrypted adapter; provider failure preserves completed observations and cannot trigger a hosted/funded fallback. Public navigation does not require a companion.

Retry unfinished work with stable operation identities. Keep posting availability separate from application lifecycle, and never infer closure from a failed or incomplete scan. Persisted job identity remains workspace-scoped and stable even when source URLs or aliases change.

## Frontend journey

1. Show confirmed target roles, locations, work models, selected employers/links, browser-source coverage, and missing prerequisites, followed by **Start search**.
2. Open a persistent run page showing source progress, posting counts, and failures. Refreshing or reopening the page restores the run.
3. Show scout and match progress separately. For example: “Search complete: 18 postings found. Matching: 7 ready, 11 pending.”
4. Make persisted postings available while matching continues. Offer **Review available matches**, **Retry failed sources**, and **Retry failed matches** when applicable; each retry targets its own process.
5. Explain empty results, partial coverage, blocked login/challenges, failed collection, and matching waiting for provider reconnection or an explicit route switch with distinct messages and relevant actions.

Reuse the existing table, cards, filters, and detail-sheet components with API-backed queries. Start with polling persisted progress. Keep existing folder/import and export compatibility through the [repository migration](../../architecture/repository.md#existing-application-migration).

Label required-skill coverage, fit, and evidence coverage separately. Missing scores remain unknown. Detailed explanations, sorting, and outdated-assessment presentation belong to step 05.

## Acceptance criteria

- The user can understand the search scope and run progress.
- Results remain available after interruption.
- Retries do not duplicate postings.
- Empty results are distinguishable from failed or partial scans.
- Scout results persist before matching and remain available when matching fails.
- Scout can finish independently while assessment requests remain pending.
- A failed source can be retried without repeating completed matching; a failed match can be retried without repeating discovery.
- Interrupted handoffs resume without losing requests or accepting duplicate assessment results.
- Profile edits do not change inputs already pinned to a run or assessment.
- Partial or failed scans never close postings.
- Run state, posting evidence, and assessments remain isolated by workspace.
- Browser attempts use isolated Job Kit processes/profiles and cannot use Hermes cookies or interfere with its tabs/services.
- Start the browser coexistence proof with one Job Kit slot. Excess work queues at the measured configured limit; worker failure releases orphaned Chrome processes and resumes durable progress.
- Login walls and challenges report blocked coverage in public-only V1.
- Browser-agent provider failure does not discard completed observations or trigger a silent hosted, funded, or alternate-account fallback.
- Greenhouse, Lever, and Ashby adapter coverage is supported by representative permitted-board evidence, including pagination, extraction, aliases/deduplication, and partial/error outcomes.
- One named permitted public browser source passes an end-to-end source-specific proof. Unmeasured source and run/capacity limits remain explicit blocker tickets until experiments set them.

## Decisions for this step

Scout and match are separate processes with independent persistence, progress, completion, and retry boundaries. The proposed default is an automatic durable handoff.

Before implementation, select the initial employer catalog and the one public browser source, resolve any missing first-scout prerequisites, measure source/run/capacity limits, and define which persisted postings enter matching. Define cancellation behavior for each process. Keep recommendation thresholds, semantic-review policy, and TypeSafe fallback behavior with [Evaluation](../../domain/evaluation.md#open-design-questions), and review behavior with [step 05](05-check-matches.md). Track unresolved source and numeric-threshold proofs as bounded tickets in the [delivery backlog](../linear-backlog.md).

Validate the complete path with permitted representative boards and the selected public browser source before claiming coverage. Include worker interruption, duplicate commands, partial scans, provider failure, reconnect/manual route switching, and a confirmed profile revision change during matching.
