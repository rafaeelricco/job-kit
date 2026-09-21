# AI providers and existing subscriptions

> **Historical research, not current implementation guidance (updated 2026-09-21).** Preserve the dated evidence and validation limits below. Recommendations for companions, local executors, managed workflow/browser services, Supabase, or platform-selected AI routes are superseded. Current decisions are web-only, self-hosted on the owner's VPS, and user-funded AI connections for OpenAI, Gemini, Anthropic, and xAI; hosted compatibility and authorization remain unproven gates. TypeSafe matching remains platform-funded. If user AI is unavailable, work waits for reconnect or an explicit manual account switch. See the current [decision index](../decisions/README.md) and [platform architecture](../architecture/overview.md).

[Research index](README.md) · [Decision status](../decisions/README.md)

Researched 2026-09-19. The user prioritizes existing ChatGPT, Claude, or similar subscriptions for the first release. This changes the execution architecture. Findings below distinguish documented technical interfaces from product authorization and untested integration assumptions.

**Recommendation:** the team should prototype a personal executor using the official Codex TypeScript SDK/CLI. It should retain an adapter for Claude Agent SDK subject to its product-integration requirements, and keep API-funded execution as an explicitly selected alternative. App Server is a richer later interface with an experimental-status caveat. The team should not build a hosted inference proxy by copying CLI OAuth credentials or imitating provider clients. A local executor is an engineering choice, not an exemption from provider requirements.

## What commit-tools actually provides

This research reviewed the local checkout at `/Users/rafaelricco/Projects/personal/commit-tools`, commit `07321aa` dated 2026-09-15, alongside the [public repository](https://github.com/rafaeelricco/commit-tools). This is a local CLI with four provider implementations, not a multi-tenant provider authorization service.

Useful patterns to retain:

- A discriminated configuration for provider, model, effort, and authentication method.
- An authentication resolver that refreshes supported tokens and persists changes before a call.
- Provider-specific adapters behind one result shape, with model, effort, duration, and available usage metadata.
- Runtime output validation and bounded handling of transient failures.

Sources: [configuration](/Users/rafaelricco/Projects/personal/commit-tools/src/domain/config/config.ts), [resolver](/Users/rafaelricco/Projects/personal/commit-tools/src/domain/llm/auth-resolver.ts:30), [router](/Users/rafaelricco/Projects/personal/commit-tools/src/domain/llm/router.ts:91).

The authentication implementations have different meanings. OpenAI OAuth calls a Codex backend endpoint. Anthropic setup-token mode uses Claude CLI headers and a Claude Code system identity. Gemini OAuth calls the Google GenAI client with a bearer token; that does not demonstrate entitlement to a Google AI subscription. xAI OAuth uses its CLI inference proxy and client-version conventions. These details are evidence of how the CLI works, not evidence that every flow is an approved authentication contract for a new consumer platform. Sources: [OpenAI adapter](/Users/rafaelricco/Projects/personal/commit-tools/src/infra/llm/openai.ts), [Anthropic auth](/Users/rafaelricco/Projects/personal/commit-tools/src/infra/auth/anthropic.ts), [Gemini adapter](/Users/rafaelricco/Projects/personal/commit-tools/src/infra/llm/gemini.ts:89), [xAI auth](/Users/rafaelricco/Projects/personal/commit-tools/src/infra/auth/xai.ts).

Its machine-level JSON configuration also persists credentials. For Job Kit, the team should keep provider-owned login state on the personal executor where possible. It should keep only a connection reference and capabilities in the hosted database. Any hosted API keys or mailbox refresh tokens need encrypted secret storage, per-workspace access, and rotation. The team should not copy the local configuration file into the platform. [Configuration storage](/Users/rafaelricco/Projects/personal/commit-tools/src/infra/storage/config.ts:41)

## Provider feasibility

| Provider        | Documented execution path                                                                                                           | What the platform can conclude                                                                                                                                                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ChatGPT / Codex | Official SDK wraps the local CLI, which supports saved user authentication; App Server adds richer managed login/account interfaces | Strongest first personal-executor spike. The team should use the official runtime rather than reproducing its private backend requests. This does not grant generic OpenAI API billing or establish hosted resale rights.                     |
| Claude          | Agent SDK is programmable in TypeScript/Python; current help describes continuing subscription-backed SDK use                       | Technically relevant, but its developer guide requires prior approval for third-party products offering Claude login/rate limits. The team should resolve that before promising a built-in subscription connector.                            |
| Gemini          | Official Gemini CLI supports Google AI Pro/Ultra accounts and cached authentication in headless mode                                | Candidate for a later official-CLI adapter. Google explicitly disallows direct access to CLI services through third-party OAuth clients; the team should not extract or replay its tokens. It should validate product integration separately. |
| Grok            | Official CLI documents device login, headless modes, skills/MCP and an ACP interface                                                | Candidate for a later official-runtime adapter. Reviewed sources do not establish a general third-party subscription inference entitlement.                                                                                                   |

The official Codex TypeScript SDK wraps local CLI execution. `codex exec` documents reuse of saved CLI authentication. The SDK's source only injects an API credential when one is supplied, so the saved-login path is the grounded integration inference to test. The team should set an explicit child environment to prevent inherited API-key variables from changing billing. It should pin SDK and CLI versions, validate structured output, and let the official runtime handle credentials. [SDK README](https://github.com/openai/codex/blob/main/sdk/typescript/README.md), [SDK process source](https://github.com/openai/codex/blob/main/sdk/typescript/src/exec.ts), [automation authentication](https://learn.chatgpt.com/docs/non-interactive-mode#authenticate-in-automation)

Codex App Server additionally exposes managed ChatGPT authentication and an experimental externally managed-token mode. The team should prefer managed authentication if it adopts App Server later. External-token mode assumes the host already legitimately owns the authentication lifecycle; it is not a token-acquisition service. Account and quota events can enrich connected, reconnect-required, and quota-exhausted UI states. [App Server authentication](https://learn.chatgpt.com/docs/app-server#authentication-endpoints)

The App Server documentation and installed `codex-cli 0.155.1` help label the integration experimental. The documentation's broad production warning and narrower WebSocket warning are not perfectly aligned. The team should treat the adapter as a compatibility risk to prove, use local stdio, and pin runtime/schema versions. This favors SDK/CLI bounded tasks for the first release; none of these interfaces was exercised against a model during this review. [Protocol documentation](https://learn.chatgpt.com/docs/app-server#protocol)

OpenAI also documents Sign in with ChatGPT for participating external applications. That is identity federation: it shares basic identity, while additional access requires separate permissions. It does not itself grant model execution. Ordinary OpenAI API billing is separate from ChatGPT subscription billing. [External sign-in](https://help.openai.com/en/articles/20001410-sign-in-with-chatgpt), [billing distinction](https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform)

Claude's documentation needs careful interpretation. The help page's June 15 update pauses an announced billing change and says SDK, headless, and third-party usage still consumes subscription limits. Meanwhile, the SDK overview says third-party developers need prior approval before offering Claude login or rate limits. The first statement concerns ongoing usage/billing; it does not clearly remove the second product restriction. The team should treat a commercial Job Kit subscription connector as unresolved until Anthropic confirms the intended integration. Running it locally does not resolve this by itself. [Current subscription help](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan), [SDK developer guide](https://code.claude.com/docs/en/agent-sdk/overview)

Gemini CLI documents local subscription login and reuse of cached credentials in headless mode. Its terms explicitly distinguish use of the official CLI from third-party direct access to its backing services. A future adapter should invoke the official runtime and undergo a product-specific support check. [Authentication](https://geminicli.com/docs/get-started/authentication/), [terms](https://geminicli.com/docs/resources/tos-privacy/)

Grok's official CLI exposes structured execution and an agent protocol; those are better integration surfaces than cloning its client headers and proxy calls. The team should confirm account entitlements and supported product use before advertising subscription coverage. [CLI reference](https://docs.x.ai/build/cli/reference), [enterprise authentication](https://docs.x.ai/build/enterprise)

## Execution options

| Product shape                                        | Existing subscriptions and browser sessions                                                                              | Daily unattended work                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Web platform + personal executor                     | Best technical fit for official installed runtimes and local browser access; provider-specific product rules still apply | Hosted ingestion continues; local reasoning/browser work waits for an awake executor        |
| Skills/MCP integration in an existing AI application | Users operate Job Kit capabilities in their chosen host; least need to own model authentication                          | Limited by the host's scheduling, tools, approvals, and supported connector access          |
| Entirely hosted execution                            | Convenient browser-only experience, but requires supported hosted provider grants or explicitly funded APIs              | Available independently of the user's laptop; browser/model infrastructure remains billable |

The platform should not silently switch a subscription connection to a paid API when quota runs out. It should report the actual limit and next action. A subscription-funded generation can still incur platform search, storage, and browser costs, plus proxy and support costs.

For Gmail-derived text, provider selection also needs a data-handling compatibility check. Google limits downstream use of mailbox data; the team should not assume every consumer subscription's training and retention settings satisfy that requirement. The system should keep classification pending or require an eligible configured route if the chosen provider cannot meet the contract. See [Gmail research](gmail-connectors.md).

## Proposed provider contract

Model providers and agent runtimes are separate adapters. API text generation does not automatically provide a skill loader, filesystem, browser, or durable run lifecycle.

```text
AgentConnection
  id, workspaceId, executorId, provider, runtimeKind
  authMode, modelPolicy, capabilities, runtimeVersion
  state: connected | reconnect_required | quota_exhausted | unsupported
  dataPolicyEligibility, lastCheckedAt

AgentRuntime
  inspectCapabilities()
  start(runSpec)
  resume(runId, approvedInput)
  cancel(runId)
  observe(runId)

RunSpec
  runId, operationId, workspaceId, skillBundleDigest
  inputArtifactRefs, inputSchemaVersion, expectedOutputSchema
  allowedTools, budget, deadline, authorizationRef
```

Connection metadata never includes raw provider tokens. Capabilities distinguish structured output, browser tools, and resumability. They also distinguish image input, supported model/effort settings, and data eligibility. The design should retain provider-specific differences instead of declaring every model interchangeable.

The personal executor pairs with one workspace using a revocable device credential. It makes outbound authenticated connections to fetch authorized jobs; it exposes no unauthenticated local RPC port. The platform validates results against the claimed run, input revisions, and output schema. Provider session transcripts remain execution aids, not the authoritative application record.

## First proof

The first proof should connect an official Codex runtime on a test device and execute one versioned `job-match` skill using a real fixture and deterministic scorer. It should return a schema-validated result to a private workspace, then interrupt and resume. The test should verify account switching, quota exhaustion, and token expiry. It should also verify offline-device catch-up, revocation, and the absence of provider credentials in hosted logs. The team should separately resolve Claude product authorization and Gmail data eligibility. No provider login, paid generation, or runtime benchmark was performed for this research.
