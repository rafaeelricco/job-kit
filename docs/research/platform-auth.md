# Platform sign-in: Google OAuth

> **Historical research, not current implementation guidance (updated 2026-09-21).** Preserve the dated evidence and validation limits below. Recommendations for companions, local executors, managed workflow/browser services, Supabase, or platform-selected AI routes are superseded. Current decisions are web-only, self-hosted on the owner's VPS, and user-funded AI connections for OpenAI, Gemini, Anthropic, and xAI; hosted compatibility and authorization remain unproven gates. TypeSafe matching remains platform-funded. If user AI is unavailable, work waits for reconnect or an explicit manual account switch. See the current [decision index](../decisions/README.md) and [platform architecture](../architecture/overview.md).

[Research index](README.md) · [Decision status](../decisions/README.md)

Research date: 2026-09-19. Scope: React/Vite frontend, TypeScript API, PostgreSQL, and one private workspace per individual. No credentials or accounts were accessed.

## Recommendation

Keep **Supabase Auth** for the first hosted version if the earlier Supabase Postgres/storage direction remains the default. It is the most coherent managed choice for that stack. The team should enable Google as its only sign-in provider and use its OAuth flow and SDK, let the API authenticate every request, and keep workspace authorization in the product's domain layer.

Choose **Better Auth instead** if the team wants to own authentication inside Fastify/Drizzle/Postgres. It fits that architecture directly. The team should not run both authentication systems for the same application.

Clerk is the best fit when polished account-management UI is the deciding factor. It is a credible alternative, but the product does not need a separate identity service for Google-only sign-in.

## Comparison

| Option        | Best fit here                                                      | Main product tradeoff                                                                        |
| ------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Supabase Auth | Managed authentication alongside the proposed database and storage | Standard browser sessions expose auth tokens to the SDK; linking follows Supabase's policies |
| Better Auth   | An owned TypeScript backend with database-backed sessions          | The team owns deployment, upgrades, configuration and auth operations                        |
| Clerk         | Fast delivery of sign-in and account-management screens            | Separate identity vendor and its account-linking behavior                                    |

Supabase provides a React/Vite quickstart and a Google social provider. Google setup requests basic identity/profile scopes. [React quickstart](https://supabase.com/docs/guides/auth/quickstarts/react), [Google](https://supabase.com/docs/guides/auth/social-login/auth-google)

Better Auth has dedicated Fastify integration and a Drizzle adapter, with built-in Google provider configuration. [Fastify](https://better-auth.com/docs/integrations/fastify), [Drizzle](https://better-auth.com/docs/adapters/drizzle), [Google](https://better-auth.com/docs/authentication/google)

Clerk's React SDK supports Vite and supplies prebuilt components. Its Google production connection requires application-owned OAuth credentials even though development can use shared credentials. [React quickstart](https://clerk.com/docs/react/getting-started/quickstart), [Google connection](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google)

## Identity and workspace boundaries

Each user signs in through one Google OAuth identity. That person owns one workspace. Neither provider identity, email, nor an external mailbox connection should be the workspace's primary key.

Proposed application-owned records:

```text
app_user
  id: UUID
  created_at

auth_principal
  auth_issuer
  auth_subject
  app_user_id
  UNIQUE(auth_issuer, auth_subject)

workspace
  id: UUID
  owner_user_id: UUID UNIQUE
  created_at

external_connection
  id: UUID
  workspace_id: UUID
  provider
  external_subject
  secret_reference
  granted_scopes
  state
```

`auth_principal` maps the authentication service's validated subject to the internal user. The authentication service owns the Google sign-in identity; the application maps its validated subject to one internal user. If Better Auth is selected, its user ID can also serve as the internal user ID, reducing indirection.

The system should provision the user mapping and workspace idempotently after the first authenticated request. A database uniqueness constraint prevents duplicate workspace creation from concurrent callbacks or tabs. Business events refer to `app_user.id` and `workspace.id`. Email remains editable contact information; changing it does not move or duplicate the workspace.

Google's stable account key is `sub`, and its documentation explicitly warns against email as an identity key. [Google OIDC](https://developers.google.com/identity/openid-connect/openid-connect)

The API should resolve workspace ownership from the authenticated principal on the server. A request's `workspace_id`, connection ID, or job ID is a resource selector, never proof of ownership. Workers use the authorized job's stored workspace and capability boundaries rather than a browser session token.

If the team uses RLS, the SQL connection's role and claims must actually activate the relevant policies. Administrative/service credentials can bypass RLS; a Node worker using privileged SQL does not gain tenant isolation merely because policies exist. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Google-only identity policy

Enable only Google OAuth for platform sign-in. Each user has one Google sign-in identity and one private workspace; additional sign-in methods and account-linking flows are outside the product scope.

The team should not merge users merely because email strings match. A separately authorized Gmail account is a resource connection, not another sign-in identity, and must not change workspace ownership.

## Session and OAuth architecture

For the lowest-complexity Supabase version, the team should use the React SDK with explicit PKCE and send the resulting application access token to the TypeScript API. Supabase documents one-time code exchange and the need for the initiating flow's verifier. Multiple overlapping flows require care. [Supabase PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow)

The API should verify signature, issuer, audience, and expiry using the supported SDK or a maintained JWT library, then map the validated subject to the workspace. It should not trust an unverified browser session object. A valid JWT can outlive server-side session revocation until its expiry, so the team should use the documented server-side user/session check for sensitive operations where that delay matters. Supabase's standard browser/SSR model needs client-readable tokens; it is not an HttpOnly-only session architecture. [Supabase advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide), [JWT verification](https://supabase.com/docs/guides/auth/jwts)

If the team wants HttpOnly-only browser sessions and same-origin API access, it should choose a deliberate backend-for-frontend design. Better Auth naturally supports server-side session identifiers with secure HttpOnly cookies, OAuth state/PKCE handling, and origin/CSRF protections. The team should keep those checks enabled and configure trusted origins precisely. [Better Auth sessions](https://better-auth.com/docs/concepts/session-management), [Better Auth security](https://better-auth.com/docs/reference/security)

Clerk supplies server request verification and an `authorizedParties` allowlist; the API should verify application tokens in the backend even when React components already hide private screens. [Clerk request authentication](https://clerk.com/docs/reference/backend/authenticate-request)

State, PKCE, and OIDC nonce validation address different parts of OAuth/OIDC. The team should use the auth library's supported flow, verify ID-token issuer/audience/nonce when applicable, keep redirect destinations allowlisted, and use exact production callback URLs. The browser-to-Supabase PKCE flow does not by itself prove every upstream provider hop uses PKCE; the team should inspect the deployed adapter when that is a requirement.

## Sign-in is separate from resource authorization

The product should keep Settings → Sign-in separate from Settings → Connections. Signing out ends a browser session; it need not cancel a previously authorized daily automation. Disconnecting Gmail disables that resource capability. Signing in with Google does not authorize Gmail, and connecting a mailbox does not change the sign-in identity.

Supabase does not refresh provider tokens for the application and intentionally does not persist them in the project's auth database. Thus Supabase Auth alone does not provide the mailbox connection lifecycle described in the [Gmail research](gmail-connectors.md). [Supabase provider tokens](https://supabase.com/docs/guides/auth/social-login)

## Proposed user flow and spike

The initial screen has Continue with Google as the only sign-in option. First sign-in creates one private workspace and continues to profile import. Gmail is offered when the user enables application reply tracking. Account settings show the Google sign-in identity, active sessions, and separately connected resources.

The team should validate the following before committing to a provider:

1. Google OAuth is the only enabled sign-in method and requests basic identity permissions without mailbox permissions.
2. A separately connected Gmail account does not change the sign-in identity or merge workspaces, even when email addresses match.
3. Concurrent first sign-ins and repeated callbacks create one workspace.
4. A user cannot query another workspace or supply another user's connection/job ID.
5. Sign-out, expired tokens, revoked sessions, and deleted accounts have defined behavior. Removing the sole Google sign-in identity is blocked unless the user deletes the account.
6. Connection management and scheduled work continue to use resource grants with the intended lifecycle, independently of browser sessions.
