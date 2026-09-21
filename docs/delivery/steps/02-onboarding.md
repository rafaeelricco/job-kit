# Onboarding

Status: proposed · Updated: 2026-09-21 · Implementation: not implemented

[Delivery roadmap](../roadmap.md) · [Workspace](../../domain/workspace.md) · [Candidate](../../domain/candidate.md)

## Outcome

A signed-in pilot user understands what Job Kit does, connects one of the supported own-AI routes, and can begin profile creation without installing or enrolling a companion.

## Current state

The app has [folder-access consent](../../../app/src/module/access/access-gate.tsx), not guided account onboarding or hosted provider connections.

## V1 boundaries and dependencies

Own setup progress and navigation after [login](01-login.md). Profile content and confirmation belong to [AI profile setup](03-ai-profile.md), following [Candidate](../../domain/candidate.md) rules. [Workspace](../../domain/workspace.md) owns provider connections.

Job Kit login and AI-provider authorization are separate operations. V1 is web-only and runs platform services on the owner's VPS. A provider connection is required before profile creation. Hosted encrypted credential adapters serve profile generation and browser-agent work. Connection state, capabilities, and credential references may be stored; raw provider credentials must not enter progress records, logs, analytics, or model inputs. Follow [provider-connection research](../../research/provider-connections.md), [execution architecture](../../architecture/execution.md), and the accepted [self-hosted platform decision](../../decisions/0008-self-hosted-platform.md).

The initial provider target is the full four-provider set and these methods from the reviewed `commit-tools` implementation at commit `07321aa31a734bbe6e52fa0776666d1df81eaee9`:

- **OpenAI:** device login or API key.
- **Gemini:** OAuth or API key.
- **Anthropic:** pasted setup token or API key. A user may generate an optional setup token in an external terminal; Job Kit does not install a companion or local executor.
- **xAI:** device login or API key.

These are target methods, not claims of successful hosted compatibility or authorization. The local CLI's implementation does not establish a supported multi-tenant hosted integration. Each provider and method must pass its technical and product-authorization proof gates before it can be advertised as ready. Preserve the documented caveats in [provider research](../../research/provider-connections.md); do not silently drop a provider or substitute another account or billing route.

## UX research and references

Researched 2026-09-21. The recommendations adapt published UX guidance and inspected source code; they have not been validated with Job Kit users.

- **Explain only what helps users begin.** Nielsen Norman Group recommends brief onboarding, necessary customization, and contextual instruction instead of lengthy feature tours. For Job Kit, use one visual workflow overview and explain each setup request where it occurs. Its research focuses on mobile onboarding; applying it here is a design hypothesis to test. [Onboarding components and techniques](https://www.nngroup.com/articles/mobile-app-onboarding/)
- **Connection feedback:** Hermes desktop and web flows show useful patterns such as visible authorization progress, selectable device codes, expiry, cancellation, retry, and model confirmation. Reuse those interaction patterns where a provider route supports them; Job Kit does not adopt Hermes's desktop companion or assume that all providers share one OAuth flow. [Desktop onboarding flow](https://github.com/NousResearch/hermes-agent/blob/274bc7b8f613c299b4f59160bacf8a19010f7003/apps/desktop/src/components/onboarding/flow.tsx), [OAuth modal](https://github.com/NousResearch/hermes-agent/blob/274bc7b8f613c299b4f59160bacf8a19010f7003/web/src/components/OAuthLoginModal.tsx)
- **Provider-specific methods:** the inspected `commit-tools` authentication source distinguishes OpenAI and xAI device authorization, Google's OAuth path, Anthropic setup-token use, and API-key paths. This is an implementation reference only; it does not establish that those flows are approved for a hosted consumer product. [Authentication source](https://github.com/rafaeelricco/commit-tools/tree/07321aa31a734bbe6e52fa0776666d1df81eaee9/src/infra/auth)

## Proposed journey

### 1. Show what Job Kit does

Present one overview with a clearly labeled sample:

**Your profile and preferences → relevant opportunities with match explanations → open a posting from your dossiers.**

Use representative product visuals: a profile summary and a dossier with supporting evidence. Include short text equivalents. Do not require a carousel, video, or animation to understand the workflow.

Explain that AI proposes profile information for the user to confirm. State the V1 boundary: users can inspect matches and open postings; application-prompt handoff, preparation, and submission come later.

The primary action is **Connect my AI**. Let users continue immediately and revisit the overview later.

### 2. Connect AI

Show progress through **Overview → Connect AI → Create profile**. Offer the four provider targets and supported methods above. For each route, identify the provider, method, account or billing basis, data sent, and any external authorization step. Keep model and effort customization secondary to a compatible recommended default.

Use the route-specific authorization flow. Where device authorization is supported, show a selectable code, **Copy code**, **Open authorization page**, expiry, and a visible waiting state. OAuth routes explain the redirect and return. API-key fields and pasted setup tokens use a secure entry flow. For Anthropic setup-token mode, explain the external terminal step and allow paste-back; do not require a Job Kit installation.

Keep authorization separate from readiness. After authorization, verify the hosted adapter can make the intended request, validate the response, and report available capabilities. An opened browser, completed redirect, accepted key, or token exchange alone does not establish a working connection. Show the provider, method, account when available, model, connection state, and billing route without exposing the secret.

**Create my profile** continues to step 03 only when the selected route is both technically verified and cleared for the intended product use. If a route has not passed both proof gates, show that it is not ready and offer another explicitly selected route. Never auto-switch accounts or billing. The full provider target remains a V1 proof requirement.

### 3. Recover and resume

Allow users to pause and return without completing setup. Save completed milestones and the selected route, but never persist raw credentials in setup progress. Recheck provider state on return.

Give a specific next action for denied authorization, expired codes, network failure, revoked credentials, invalid keys, and exhausted quota. Offer retry, reconnect, or an explicit switch to another supported route without restarting the entire journey. A switch is a user decision and must identify any change in account or billing.

Cancel an abandoned authorization attempt and ignore late UI results from superseded attempts. Expired attempts receive fresh authorization rather than reusing old codes. Gmail, recurring automation, and application-site permissions belong to later delivery steps.

## Acceptance criteria

- A new user can explain what Job Kit produces, why an AI connection is needed, and what V1 does with a match.
- One visual overview communicates the V1 journey using labeled sample content.
- Onboarding lists OpenAI, Gemini, Anthropic, and xAI with the target connection methods specified above; the target set is not silently reduced.
- Each advertised-ready provider method passes both hosted technical verification and the applicable product-authorization check. Unproven methods cannot be represented as ready.
- A user can complete a proven provider route through guided UI, including device/OAuth handoff or secure key/token entry as applicable.
- No companion installation, device enrollment, local executor, or companion wait is part of onboarding.
- Denial, expiry, cancellation, failed browser opening or clipboard access, credential rejection, and quota exhaustion have visible recovery actions.
- Interrupted setup preserves completed milestones without exposing credentials and rechecks connection readiness before continuing.
- Returning users with completed setup reach the product; a later connection failure prompts reconnection without replaying the introduction.
- Keyboard and screen-reader users can complete setup. Status is conveyed in text, copy actions announce their result, and reduced motion preserves all information.
- Credentials are encrypted in hosted storage and do not appear in logs, analytics, or setup progress. If a route cannot meet this requirement, it remains blocked.

## Decisions for this step

The four provider targets, listed methods, hosted encrypted credential adapters, and own-AI prerequisite are selected. Technical support and provider authorization are still separate proof gates. Step 02 ends when a selected route is verified and profile creation can begin; profile confirmation remains owned by step 03.

Use [provider-connection research](../../research/provider-connections.md) to resolve compatibility and authorization evidence. Keep unresolved provider proofs and any required measured limits as bounded blocker tickets in the [delivery backlog](../linear-backlog.md); do not turn a research recommendation into a product guarantee.

## Validation before implementation

Prototype the overview, at least one supported device/OAuth route, API-key entry, and the Anthropic external setup-token paste path if that route is authorized. Test whether first-time job seekers understand the product and can connect without assistance.

Exercise successful and denied authorization, blocked browser opening, failed clipboard access, expiry, cancellation followed by retry, refresh during setup, invalid or revoked credentials, quota exhaustion, and an already connected returning user. Verify route/account/billing labels, encrypted credential handling, credential-free logs, keyboard navigation, focus after browser return, screen-reader announcements, and reduced motion. A UI success state is not proof that hosted compatibility or provider authorization has passed.
