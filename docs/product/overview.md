# Product overview

Status: proposed · Updated: 2026-09-21 · Implementation: not implemented

Job Kit is a web app for an individual job seeker. Each authenticated user has one private workspace. V1 covers login, onboarding, AI-assisted profile setup, the first scout, and review of matches in the existing dossiers interface, including opening a posting. Application handoffs and other application mechanisms follow after V1.

## Accepted constraints

- The platform runs on the owner's VPS with Docker Compose. The web app keeps its existing React/Vite routes, settings, and design system. Its APIs adapt the existing data access and import/export behavior.
- V1 is web-only. There is no companion, desktop app, enrollment, extension, or device wait. Google sign-in and passwordless email one-time codes are supported by the auth library; the pilot limits access to an approved email list. The auth library owns verified identity linking. Job Kit never merges users by comparing email strings.
- Users must connect their own AI before creating a profile. The initial provider target covers OpenAI, Gemini, Anthropic, and xAI, with the connection methods described in [onboarding](../delivery/steps/02-onboarding.md). Hosted compatibility and authorization remain proof gates; a listed method is not a claim that it is already supported or authorized.
- Selective event sourcing is accepted but not implemented. Durable work and domain events are transactionally recorded, idempotency outlives queue retention, replay has no external effects, and controlled content can be deleted separately. Posting identity remains workspace-scoped with stable internal IDs.
- CV intake accepts text-based PDFs. Unreadable or scanned documents use the manual questionnaire; V1 has no OCR. Existing profile and dossier imports retain provenance, resolve conflicts explicitly, deduplicate, and never invent history. Users can still edit profiles and export them in an editable form.
- Scout discovery and match evaluation are separate durable processes. Public-source evidence remains available when matching is pending or fails. Matching uses TypeSafe as the platform-funded default, then the user's selected AI as fallback; there is no automatic switch between user accounts or billing routes. If the selected AI is unavailable, work waits for reconnection or an explicit manual switch.
- The existing dossiers table, cards, filters, detail view, export, and Open posting action are the V1 review surface. Current accepted fit sorts 0–100 descending, then publication date descending (first discovery when publication is unknown, labeled accurately), then stable ID. Ordering is applied before pagination. Scout coverage (0–10), fit, and evidence confidence stay distinct; unknown is not zero. Incomplete and outdated assessments remain visible after current matches. Confirmed profile changes trigger reassessment. Opening a page does not rerun a model.
- Public discovery uses Greenhouse, Lever, and Ashby HTTP adapters plus a specifically selected public browser source. Source proof, compatibility/authorization proof for each provider route, and measured run/capacity limits are release gates, not assumed guarantees. Login walls and challenges remain blocked in V1.
- Application mechanisms, including copying an apply prompt, integrated preparation or submission, Gmail, and recurring automation, are post-V1. Their proposed domain invariants remain useful, but future mechanisms and surfaces are not selected.

## Product behavior

Job Kit should retain the useful distinctions in the existing skills. Each match has evidence and makes uncertainty visible. Candidate facts require user confirmation. Discovery coverage (0–10), fit (0–100), and confidence are separate measures; missing factors remain unknown rather than zero. Imported records carry their source and known dates, and an incomplete Markdown corpus is not treated as complete event history.

The first-run path explains the product, collects a supported own-AI connection, and guides the user through profile intake and confirmation. A user can begin with a text-based PDF or answer manually, then review search basics before starting a scout. The existing dossiers UI shows persisted postings and independent assessment progress. A user can understand why a match was ranked, open the posting, and return to the same saved work.

When a provider or source fails, Job Kit preserves completed evidence and history. It shows a specific retry, reconnect, or manual action. It does not silently switch AI accounts, billing routes, source types, or model providers. Generated suggestions never become confirmed candidate facts automatically.

## Later product scope

Application preparation and submission, including the existing copy-apply-prompt workflow, follow V1. So do Gmail replies, recurring scouting, policy-controlled automation, and outcome analytics. Their domains retain useful rules for authorization, immutable inputs, and uncertain external outcomes, but the product surface and execution mechanisms remain undecided until those steps are planned.

## Design and delivery

The [domain guide](../domain/README.md) owns business relationships, the [architecture overview](../architecture/overview.md) owns the proposed system, and the [roadmap](../delivery/roadmap.md) owns delivery order and proof gates. The accepted [web-only platform decision](../decisions/0007-web-only-platform.md) and [self-hosted platform decision](../decisions/0008-self-hosted-platform.md) define the current platform direction. Provider and source research retain dated evidence and unresolved compatibility or authorization questions.
