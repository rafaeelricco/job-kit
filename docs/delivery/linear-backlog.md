# V1 Linear backlog

Status: accepted · Updated: 2026-09-21 · Implementation: not implemented

[Job Kit AI project](https://linear.app/r1cco/project/job-kit-ai-76a302695ebf/overview) · [Agreed V1 specification](https://linear.app/r1cco/document/v1-platform-specification-agreed-scope-22e7266690a9) · [Delivery roadmap](roadmap.md) · [Machine-readable manifest](linear-backlog.json)

Created **35 V1 issues across five new milestones**, plus **two Post-V1 issues**. All are Backlog and unassigned, with no deadline or estimate. The manifest records stable backlog keys, Linear UUIDs/identifiers, self-contained requirements and actual blocked-by relationships.

Milestones describe user outcomes; dependencies determine implementation order. Shared API/database infrastructure belongs to Login, its first consuming milestone. Shared posting/import contracts are established there so profile/dossier import does not wait for scout orchestration. Provider and browser-source experiments are unresolved implementation blockers, not completed integrations.

## Preserved existing work

The **Scout reliability** milestone (`30f96333-63c7-4e60-8de8-0b9d5ce407ec`) and R1C-227, R1C-228, R1C-229 and R1C-230 retain their original descriptions, states, labels and relations. They are separate from this platform backlog.

## 01 · Login

Linear milestone: `4d38713c-0be1-4cd2-bb87-5e18bfdb9a86`.

| Issue                                                                                                          | Work package                                                 | Blocked by       |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------- |
| [R1C-231](https://linear.app/r1cco/issue/R1C-231/define-the-shared-fastify-api-and-typed-contracts)            | Define the shared Fastify API and typed contracts            | None             |
| [R1C-232](https://linear.app/r1cco/issue/R1C-232/containerize-postgresql-and-establish-drizzle-migrations)     | Containerize PostgreSQL and establish Drizzle migrations     | R1C-231          |
| [R1C-233](https://linear.app/r1cco/issue/R1C-233/implement-google-sign-in-and-emailed-login-codes)             | Implement Google sign-in and emailed login codes             | R1C-231, R1C-232 |
| [R1C-234](https://linear.app/r1cco/issue/R1C-234/enforce-the-pilot-allowlist-and-private-workspace-isolation)  | Enforce the pilot allowlist and private workspace isolation  | R1C-233          |
| [R1C-235](https://linear.app/r1cco/issue/R1C-235/add-the-login-ui-and-authenticated-shell-to-the-existing-app) | Add the login UI and authenticated shell to the existing app | R1C-234          |
| [R1C-236](https://linear.app/r1cco/issue/R1C-236/extend-vps-deployment-with-health-checks-and-backuprestore)   | Extend VPS deployment with health checks and backup/restore  | R1C-234          |

## 02 · Onboarding

Linear milestone: `f344a720-35b4-458b-8330-2a60977eefd5`.

| Issue                                                                                                              | Work package                                                       | Blocked by                                  |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------- |
| [R1C-237](https://linear.app/r1cco/issue/R1C-237/persist-encrypted-ai-connections-and-execution-readiness)         | Persist encrypted AI connections and execution readiness           | R1C-234                                     |
| [R1C-238](https://linear.app/r1cco/issue/R1C-238/prove-and-implement-the-openai-hosted-connector)                  | Prove and implement the OpenAI hosted connector                    | R1C-237                                     |
| [R1C-239](https://linear.app/r1cco/issue/R1C-239/prove-and-implement-the-gemini-hosted-connector)                  | Prove and implement the Gemini hosted connector                    | R1C-237                                     |
| [R1C-240](https://linear.app/r1cco/issue/R1C-240/prove-and-implement-the-anthropic-hosted-connector)               | Prove and implement the Anthropic hosted connector                 | R1C-237                                     |
| [R1C-241](https://linear.app/r1cco/issue/R1C-241/prove-and-implement-the-xai-hosted-connector)                     | Prove and implement the xAI hosted connector                       | R1C-237                                     |
| [R1C-242](https://linear.app/r1cco/issue/R1C-242/build-guided-web-onboarding-for-all-four-ai-providers)            | Build guided web onboarding for all four AI providers              | R1C-235, R1C-238, R1C-239, R1C-240, R1C-241 |
| [R1C-243](https://linear.app/r1cco/issue/R1C-243/handle-waiting-cancellation-reconnection-and-manual-ai-switching) | Handle waiting, cancellation, reconnection and manual AI switching | R1C-242, R1C-236                            |

## 03 · AI profile

Linear milestone: `08b68724-f7c4-4d24-9dd1-a803373ef22a`.

| Issue                                                                                                               | Work package                                                      | Blocked by       |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------- |
| [R1C-244](https://linear.app/r1cco/issue/R1C-244/persist-confirmed-profile-revisions-and-replayable-decisions)      | Persist confirmed profile revisions and replayable decisions      | R1C-243          |
| [R1C-245](https://linear.app/r1cco/issue/R1C-245/add-private-pdf-upload-and-text-extraction)                        | Add private PDF upload and text extraction                        | R1C-244, R1C-236 |
| [R1C-246](https://linear.app/r1cco/issue/R1C-246/guide-profile-intake-review-and-explicit-confirmation)             | Guide profile intake, review and explicit confirmation            | R1C-245          |
| [R1C-247](https://linear.app/r1cco/issue/R1C-247/import-existing-profiles-and-dossiers-with-conflict-review)        | Import existing profiles and dossiers with conflict review        | R1C-244, R1C-232 |
| [R1C-248](https://linear.app/r1cco/issue/R1C-248/migrate-existing-profile-and-settings-pages-to-authenticated-apis) | Migrate existing profile and settings pages to authenticated APIs | R1C-246, R1C-247 |
| [R1C-249](https://linear.app/r1cco/issue/R1C-249/export-editable-profiles-with-compatible-evidence-references)      | Export editable profiles with compatible evidence references      | R1C-244, R1C-248 |

## 04 · First scout

Linear milestone: `3d50046b-62c7-4ffa-84f5-62b75e8a7b3e`.

| Issue                                                                                                         | Work package                                                  | Blocked by                                           |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| [R1C-250](https://linear.app/r1cco/issue/R1C-250/define-the-starter-employer-catalog-and-supported-url-rules) | Define the starter employer catalog and supported URL rules   | R1C-231                                              |
| [R1C-251](https://linear.app/r1cco/issue/R1C-251/persist-durable-scout-runs-posting-identity-and-snapshots)   | Persist durable scout runs, posting identity and snapshots    | R1C-232, R1C-234                                     |
| [R1C-252](https://linear.app/r1cco/issue/R1C-252/implement-the-greenhouse-public-jobs-adapter)                | Implement the Greenhouse public jobs adapter                  | R1C-250, R1C-251                                     |
| [R1C-253](https://linear.app/r1cco/issue/R1C-253/implement-the-lever-public-jobs-adapter)                     | Implement the Lever public jobs adapter                       | R1C-250, R1C-251                                     |
| [R1C-254](https://linear.app/r1cco/issue/R1C-254/implement-the-ashby-public-jobs-adapter)                     | Implement the Ashby public jobs adapter                       | R1C-250, R1C-251                                     |
| [R1C-255](https://linear.app/r1cco/issue/R1C-255/prove-browsermodel-compatibility-on-the-first-public-source) | Prove browser/model compatibility on the first public source  | R1C-238, R1C-239, R1C-240, R1C-241, R1C-236, R1C-250 |
| [R1C-256](https://linear.app/r1cco/issue/R1C-256/implement-isolated-vps-browser-worker-lifecycle)             | Implement isolated VPS browser worker lifecycle               | R1C-255, R1C-251, R1C-243                            |
| [R1C-257](https://linear.app/r1cco/issue/R1C-257/create-durable-independent-matching-requests-from-discovery) | Create durable independent matching requests from discovery   | R1C-251, R1C-244, R1C-243                            |
| [R1C-258](https://linear.app/r1cco/issue/R1C-258/add-search-controls-durable-progress-retry-and-cancellation) | Add search controls, durable progress, retry and cancellation | R1C-248, R1C-252, R1C-253, R1C-254, R1C-256, R1C-257 |

## 05 · Check matches

Linear milestone: `aa453fb4-4468-443c-8b58-8cd565ba4516`.

| Issue                                                                                                               | Work package                                                       | Blocked by                         |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------- |
| [R1C-259](https://linear.app/r1cco/issue/R1C-259/expose-the-existing-python-scorer-through-a-versioned-contract)    | Expose the existing Python scorer through a versioned contract     | R1C-231                            |
| [R1C-260](https://linear.app/r1cco/issue/R1C-260/integrate-typesafe-classification-validation-and-user-ai-fallback) | Integrate TypeSafe classification, validation and user-AI fallback | R1C-259, R1C-243                   |
| [R1C-261](https://linear.app/r1cco/issue/R1C-261/implement-a-recoverable-assessment-worker)                         | Implement a recoverable assessment worker                          | R1C-257, R1C-260                   |
| [R1C-262](https://linear.app/r1cco/issue/R1C-262/automatically-reassess-saved-postings-after-profile-confirmation)  | Automatically reassess saved postings after profile confirmation   | R1C-261, R1C-244                   |
| [R1C-263](https://linear.app/r1cco/issue/R1C-263/add-scoped-sorted-and-paginated-dossier-queries)                   | Add scoped, sorted and paginated dossier queries                   | R1C-261                            |
| [R1C-264](https://linear.app/r1cco/issue/R1C-264/migrate-the-existing-dossiers-ui-to-ranked-api-results)            | Migrate the existing dossiers UI to ranked API results             | R1C-263, R1C-262                   |
| [R1C-265](https://linear.app/r1cco/issue/R1C-265/verify-the-complete-invited-user-v1-journey-and-recovery-cases)    | Verify the complete invited-user V1 journey and recovery cases     | R1C-236, R1C-249, R1C-258, R1C-264 |

## Post-V1

These issues have the Post-V1 label and no V1 milestone.

| Issue                                                                                                          | Work package                                                 | Blocked by |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------- |
| [R1C-266](https://linear.app/r1cco/issue/R1C-266/provide-optional-job-kit-funded-ai-access-after-v1)           | Provide optional Job Kit-funded AI access after V1           | R1C-265    |
| [R1C-267](https://linear.app/r1cco/issue/R1C-267/review-the-application-mechanism-and-define-its-future-scope) | Review the application mechanism and define its future scope | R1C-265    |

## Verification and resumption

Read back all 37 issue descriptions, labels, milestone assignments and **71 blocking relationships**, along with the project overview and specification. Confirmed the original four issues and Scout reliability milestone remain unchanged. Checked documentation links, the acyclic dependency graph, settled-decision coverage and preservation of the existing frontend/export baseline.

The documentation is local and not yet published to GitHub. Linear descriptions are self-contained and name their owning repository paths. Local application files and the existing staged diff were preserved; no deployment, commit or runtime tests were part of this task.

To resume or revise this backlog, use the identifiers in [linear-backlog.json](linear-backlog.json), read the matching Linear records, and update existing issues. Before retrying any uncertain create, search the project for its exact title and `Backlog key`; do not create another copy solely because a response or local write was interrupted.
