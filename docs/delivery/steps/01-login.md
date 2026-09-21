# Login

Status: proposed · Updated: 2026-09-21 · Implementation: not implemented

[Delivery roadmap](../roadmap.md) · [Workspace](../../domain/workspace.md) · [Identity and data](../../architecture/identity-and-data.md)

## Outcome

An approved pilot user signs in with Google or a passwordless email one-time code and reaches one private workspace.

## Current state

The app currently requests [local profile-folder access](../../../app/src/module/access/access-gate.tsx). Better Auth is selected for platform authentication, but it is not implemented.

## Design reference

The primary reference is the [TypeSafe login page](https://console.typesafe.ai/login), inspected on 2026-09-21. Preserve its split layout, proportions, spacing, typography treatment, control dimensions, borders, and visual hierarchy. Adapt its email controls to Job Kit's passwordless request-code and verify-code flow, and apply Job Kit branding; the reference's email-action sequence is not a requirement.

- Match the split layout: a dark decorative pixel-pattern panel on the left and a light login panel on the right.
- Preserve the reference's proportions, spacing, typography treatment, control dimensions, borders, and visual hierarchy while adapting the content for Job Kit.
- On the initial screen, use this order: logo, welcome heading, Continue with Google, “or” divider, email field, **Send code**, and legal notice.
- After **Send code**, show a one-time-code field and **Verify code**, with **Resend code** and **Change email** recovery actions. Do not show separate **Continue** and **Email me a code instead** email actions.
- Replace the TypeSafe logo and name with Job Kit branding and “Welcome to Job Kit”. Use Job Kit brand colors, a neutral email placeholder, and Job Kit legal destinations.
- Include Google and email authentication. Match responsive behavior against the reference during implementation.

## V1 boundaries and dependencies

The pilot is invite-only through an approved email list. Use Better Auth for Google sign-in and passwordless email OTP; do not add password login. Better Auth's supported identity-linking flow owns secure account association. Google and email sign-in methods are not separate candidates when the library's verified linking maps them to the same authenticated user. The app must never merge users or workspaces by comparing email strings. Provision one private workspace per authenticated user, idempotently. Follow [Workspace](../../domain/workspace.md) and [identity and data](../../architecture/identity-and-data.md) for scope and access rules. Login provides the authenticated workspace for [onboarding](02-onboarding.md).

## Acceptance criteria

- The login screen preserves the reference layout at equivalent desktop and mobile viewport sizes, with Job Kit branding and the email controls required for request-code and verify-code states.
- Google sign-in is available. Email sign-in requests a one-time code, then verifies it; resend and change-email actions recover the flow.
- No TypeSafe branding, example email address, or legal destinations remain.
- Only email identities on the approved pilot list can provision or enter a workspace; denied addresses receive a clear, non-enumerating response.
- Better Auth email OTP is passwordless, expires, is single-use, and can be resent or recovered without weakening the pilot allowlist.
- Google and email identities resolve through Better Auth's supported verified linking only. The app has no email-string-based user or workspace merge path.
- New and returning users reach the correct workspace.
- Repeated and concurrent sign-in or provisioning requests do not create duplicate workspaces.
- Cancelled or expired authentication is recoverable.
- A user cannot access another user's records.

## Decisions for this step

Use the accepted self-hosted platform auth direction and configure Better Auth for Google OAuth and passwordless email OTP using [auth research](../../research/platform-auth.md). Implement and verify the separate send-code and verify-code states, including resend and change-email recovery. Keep the pilot list as explicit configuration and use Better Auth's verified account-linking behavior; do not implement application-level merging.
