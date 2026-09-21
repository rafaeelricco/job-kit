# Gmail connection and daily synchronization

> **Historical research, not current implementation guidance (updated 2026-09-21).** Preserve the dated evidence and validation limits below. Recommendations for companions, local executors, managed workflow/browser services, Supabase, or platform-selected AI routes are superseded. Current decisions are web-only, self-hosted on the owner's VPS, and user-funded AI connections for OpenAI, Gemini, Anthropic, and xAI; hosted compatibility and authorization remain unproven gates. TypeSafe matching remains platform-funded. If user AI is unavailable, work waits for reconnect or an explicit manual account switch. See the current [decision index](../decisions/README.md) and [platform architecture](../architecture/overview.md).

[Research index](README.md) · [Decision status](../decisions/README.md)

Research date: 2026-09-19. Scope: one private workspace per job seeker; read application replies, classify evidence, and update tracked application status. No actual mailbox was accessed.

## Recommendation

Start with a direct Gmail API adapter behind a small `MailConnection` interface, an explicit Connect Gmail flow, and one daily synchronization job per connected mailbox. The current capability needs only one provider and a narrow set of operations. Add Nango when multiple external account integrations justify a shared authorization service. Composio is another viable integration layer, but its broad agent toolkit is unnecessary for this first mailbox workflow.

A connector in this product means a connection the product owns, with its own authorization flow and lifecycle. An installed Gmail connector inside Codex is useful for the current CLI skills. It is not the hosted product's multi-user integration backend or a transferable authorization grant.

## Scope and authorization

The existing skill requires full inbound message bodies and whole-thread context. `gmail.readonly` is the narrowest Gmail scope that supports those requirements; it is classified as **Restricted**. `gmail.metadata` is also Restricted and omits bodies. Add-on scopes that read the currently opened message do not support unattended daily mailbox scanning. No send, compose, modify, or full-mail scope is needed. [Google Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes)

Google sign-in and Gmail authorization are different product capabilities. Use basic identity permissions for sign-in; offer Connect Gmail when the user enables reply tracking. Use server-side authorization-code exchange, offline access, state validation, and runtime checks of granted scopes. Persist a refresh token securely and preserve it if a later token response omits it. Incremental authorization is supported. Programmatic revocation can invalidate grants across all OAuth clients in the same Cloud project, so separate client IDs alone do not create independent revocation boundaries. [Google web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server)

Permit a user who signed in through Google to connect Gmail, and permit the selected mailbox to differ from the sign-in email. Bind the connection to the authenticated workspace on the server. Use Google's stable `sub` as the external account identity, rather than treating the email address as a permanent identifier. [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)

The native Gmail profile response contains an email address and history cursor but no stable account `id`. The current skill's preference for a connector-specific profile `id` therefore needs an adapter-level replacement in the platform. [Gmail profile response](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users/getProfile)

Proposed records:

```text
auth_identity
  user_id, provider, provider_subject

mail_connection
  id, workspace_id, google_subject, mailbox_email
  granted_scopes, secret_reference, consent_version
  state: connected | reconnect_required | disconnecting | disconnected

mail_sync_cursor
  connection_id, history_id, last_completed_at
  backfill_version, scan_generation
```

The connection ID is an application-owned identity that survives reauthorization and vendor changes. A connector vendor's connection ID belongs in its own mapping. A secret reference points to encrypted credentials; it is never a credential embedded in an event, workflow payload, model prompt, or trace.

## Production requirements

For a public consumer application, plan restricted-scope OAuth verification. A server-side application that stores or transmits restricted Gmail data should plan a security assessment as part of that process. Google's verification documentation describes annual reassessment. Development/testing and internal-use exceptions exist, but individual external customers do not become an internal Workspace application just because each has a private tenant. Do not promise a fixed approval time or assessment price. [Restricted-scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification)

Testing-mode external projects are limited to 100 configured test users. [Google audience configuration](https://support.google.com/cloud/answer/15549945?hl=en) For non-basic scopes such as Gmail, testing refresh tokens expire after seven days. Production refresh tokens can still become invalid after revocation, password changes involving Gmail scopes, inactivity, or token limits; reconnect is a normal connection state. [Google refresh-token lifecycle](https://developers.google.com/identity/protocols/oauth2#expiration)

Google's current Workspace policy includes email productivity and user-benefiting monitoring as approved categories; application-reply tracking appears to fit, but that is an architectural inference, not approval. It requires clear in-product disclosure, affirmative consent, minimum permissions, deletion controls, and encryption, plus protections against prompt injection. Data transfers must satisfy limited-use conditions. Human access is restricted. General model training from mailbox data is prohibited; a narrow exception describes the specific user's personalized model for an appropriate feature. Classifying a reply is not automatically prohibited AI use, but the model provider's handling and retention must be assessed. [Workspace user-data policy](https://developers.google.com/workspace/workspace-api-user-data-developer-policy)

Recommended data design: retrieve only relevant bodies after filtering, and pass minimal evidence and application facts to classification. Avoid attachments unless a feature needs them, and exclude passwords and OTPs. Keep raw email and evidence text out of immutable business events. Use a deletable evidence store with explicit retention and access controls. Do not place mailbox bodies in generic analytics or unrestricted support logs. A user-selected LLM provider should be eligible for this data only after the integration satisfies the same data-handling contract.

## Daily synchronization

Use an initial, bounded backfill for tracked applications, then incremental `history.list` reads with a persisted `historyId`. History is usually available for at least a week, but that duration is not guaranteed. A stale cursor returns HTTP 404 and requires a fresh synchronization. [Gmail synchronization](https://developers.google.com/workspace/gmail/api/guides/sync)

The API supports Gmail query syntax and pagination; `messages.list` returns message and thread IDs, with details fetched separately. The `q` parameter is unavailable with `gmail.metadata`. [Message listing](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list)

Suggested execution:

1. Schedule `syncMailbox(connectionId)` daily with per-connection overlap prevention and jitter.
2. Read changes from the saved cursor and persist durable observation work before advancing the cursor. Retry incomplete observations independently.
3. Fetch headers and metadata; discard obvious unrelated mail. Fetch complete threads for surviving candidates.
4. Classify against tracked applications using the existing contract.
5. Validate the proposed outcome in ordinary domain code and append a business event only when the legal transition and evidence requirements hold.
6. Report coverage gaps separately from genuinely silent applications.

Newly tracked applications need a targeted backfill: a mailbox cursor alone does not revisit earlier mail that becomes relevant only when the application is added. Similarly, a completed cursor sync is not proof that every candidate query was exhausted. Track candidate coverage and failed fetches explicitly.

For initial/backfill races, capture a starting mailbox cursor before the bounded scan, complete the scan, then consume subsequent history. Store numeric-looking history IDs as strings. Deduplicate durable observations by mailbox and message ID. Also keep the existing outcome-scoped application deduplication, so a later offer in an already processed thread can still advance the application.

Push is optional. Gmail `watch` uses Cloud Pub/Sub; its notification includes the mailbox and history ID, rather than the message body. Watches must be renewed at least every seven days; Google recommends daily renewal. Notifications can be delayed or dropped, so periodic reconciliation remains necessary. Stop a watch using `users.stop`. [Gmail push notifications](https://developers.google.com/workspace/gmail/api/guides/push)

For a product that explicitly promises daily checks, polling is initially simpler. Add push when notification latency becomes a product requirement, retaining the same synchronization worker and fallback schedule.

## What managed connectors change

| Approach         | Work it removes                                                                                          | Work the product retains                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Direct Gmail API | No intermediary integration layer                                                                        | OAuth implementation, encrypted tokens, reconnect UX, synchronization, domain rules         |
| Nango            | Hosted authorization UI, credential storage/refresh, connection diagnostics and optional proxy/functions | Tenant ownership, scope selection, own OAuth app/verification, reply semantics and coverage |
| Composio         | Connected accounts, token refresh, tool APIs and agent-oriented authorization plumbing                   | Tenant/tool access rules, own production auth configuration, reply semantics and coverage   |

Nango recommends an application-owned OAuth app before production. Its shared apps have fixed scopes; portability and provider revocation risk are additional tradeoffs. Nango explicitly leaves connection ownership mapping to your application. These are reasons to keep a small internal connection interface. [Nango authorization guide](https://nango.dev/docs/guides/auth/auth-guide)

Composio supplies managed OAuth apps but recommends custom auth configurations for production branding, scopes, or dedicated quota. Managed apps share quota and have a 15-minute minimum polling interval; that interval is sufficient for a daily check. Neither managed tokens nor prebuilt tools replace the application's application-matching rules. [Composio managed versus custom auth](https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app)

A vendor's own verification is not evidence that every downstream product and data path is covered. Confirm the exact Gmail authorization arrangement, requested scopes, onward transfers, retention, and assessment coverage before adopting shared credentials as a launch shortcut.

## Preserve the skill's valuable contracts

The existing [flow](../../skill/job-inbox/references/flows/flow-inbox.md) and [classification contract](../../skill/job-inbox/references/contracts/contract-classify.md) already establish useful product behavior:

- Gmail is read-only, and aliases must not be excluded by an automatic `to:` filter.
- Status changes require an inbound body clause, a unique strong application match, and a legal transition.
- Ambiguous or failed observations produce gaps, not invented outcomes or false silence.
- The same thread may produce more than one outcome over time.
- Mail contents are untrusted data; instructions embedded in mail cannot authorize tools or status changes.

Move these guarantees into typed validation and domain handlers. The model proposes an outcome with evidence; it does not receive a generic database writer, shell, browser, or sending capability for this task.

## Spike acceptance criteria

1. A Google-authenticated user can connect a different Gmail account; another workspace cannot select or read that connection.
2. Read-only consent is sufficient to fetch and classify a complete relevant thread, including a later reply and an alias recipient.
3. The next daily job works after access-token expiry, while revoked/expired refresh credentials produce reconnect-required without an infinite retry loop.
4. Duplicate jobs and worker crashes do not duplicate outcomes or skip work when a cursor advances.
5. A stale history cursor recovers; a newly tracked application backfills older relevant mail; truncation and failed fetches remain visible.
6. Disconnect stops future reads, fences in-flight work, removes credentials and configured retained data, and has understood effects on other Google grants.
7. Raw mail and secrets are absent from event payloads, generic logs, and provider traces; evidence remains deletable.
8. Google verification preparation includes the real Connect Gmail, daily-processing, disclosure, and deletion flows.
