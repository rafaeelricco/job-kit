# Workspace module

Status: proposed · Updated: 2026-09-23 · Implementation: not implemented

Seeded working draft. This is a discussion document, not an implemented API or finalized specification. Command, event and query names are illustrative.

[Documentation index](../README.md) · [Domain model](README.md) · [Architecture](../architecture/overview.md) · [Integration proposal](../research/integration-study.md)

## Purpose

Workspace delimits one user's private space. Each authenticated user has one workspace, whether they sign in with Google or email codes. Verified email is the identity key; an unverified email never joins an account. Any verified email may sign up.

## Owns

- Workspace identity and owner association. Each authenticated user ID gets one private workspace, provisioned idempotently across that user's verified sign-in methods.
- The connection registry for user-funded AI: OpenAI device login or API key; Gemini OAuth or API key; Anthropic pasted setup token or API key; xAI device login or API key. Provider adapters retain credentials encrypted and expose only scoped references to workers. Hosted compatibility and authorization for each method remain unproven release gates.
- One active connection per workspace in V1, with its model and effort preferences. Preferences are limited to what the connection's verified capabilities allow.
- Platform-funded TypeSafe matching credentials, which are not workspace records. General platform-funded AI is out of V1 and requires a separate ticket.
- The scope for every other module. Candidate, Discovery, Evaluation, Applications and Communications records all belong to one workspace and cannot be read from another.

## Rules

- Workspace scope comes from server-validated authenticated context. A model or browser worker cannot choose its own workspace.
- Google and email codes are sign-in methods for one user identity/workspace. Verified email is the identity key; an unverified email never joins an account. Resource grants remain separate from sign-in.
- Authority is rechecked before each external action. Revocation stops future work; it cannot undo an action already issued.
- Switching providers is an explicit user decision. The new connection must pass readiness and the user must confirm the billing change before it becomes active. Work already running keeps its pinned connection. The replaced encrypted credentials stay usable only by attempts already pinned to them and are deleted once every such attempt reaches a terminal state. Disconnecting deletes credentials and leaves new AI work waiting until another connection is active.
- Tokens, keys and personal content stay out of permanent events and logs.
- TypeSafe's platform-funded key [Evaluation](evaluation.md) uses is not a workspace record. All other AI credentials are user-funded workspace connections.

## Depends on

The authentication service supplies identity. Every other module consumes Workspace authority and owns its own state changes: Workspace grants permission to use a mailbox, [Communications](communications.md) owns the sync, and [Applications](applications.md) owns each submission's authorization.

## Open design questions

- Which automation limits are global versus specific to a source, account or application?
- Which deletion and retention policy belongs in v1?

## Sources and related modules

- [Authentication](../research/platform-auth.md), [provider connections](../research/provider-connections.md), [schedulers](../research/schedulers.md).
- [Profile-root skill](../../skill/job-profile-root/SKILL.md): local ownership context to replace with authenticated workspace scope.
- [Candidate](candidate.md), [Evaluation](evaluation.md), [Applications](applications.md), [Communications](communications.md).
