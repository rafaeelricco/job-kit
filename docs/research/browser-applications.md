# Browser execution for applications

> **Historical research, not current implementation guidance (updated 2026-09-21).** Preserve the dated evidence and validation limits below. Recommendations for companions, local executors, managed workflow/browser services, Supabase, or platform-selected AI routes are superseded. Current decisions are web-only, self-hosted on the owner's VPS, and user-funded AI connections for OpenAI, Gemini, Anthropic, and xAI; hosted compatibility and authorization remain unproven gates. TypeSafe matching remains platform-funded. If user AI is unavailable, work waits for reconnect or an explicit manual account switch. See the current [decision index](../decisions/README.md) and [platform architecture](../architecture/overview.md).

[Research index](README.md) · [Decision status](../decisions/README.md)

Research checked against official documentation on 2026-09-19. These are documented capabilities, not results from a live ATS benchmark. No accounts were connected and no applications were submitted.

**Historical recommendation for the earlier proposal, superseded: a web platform plus personal local companion, using a dedicated Playwright browser profile for unattended work and an extension for user-selected existing tabs.** This reflected the earlier companion approach and preference for existing ChatGPT/Claude subscriptions. The following options and authority assumptions are historical research; the current application mechanism is undecided post-V1 work. Browserbase + Stagehand/Playwright was the preferred optional cloud adapter, subject to the proof of concept below. Hosted browser agents and Stagehand model APIs have separate billing; they cannot be assumed to use a personal chat subscription. Subscription execution feasibility remains a separate provider-runtime question.

Signing into Job Kit with Google does not make the user's ATS accounts available to a cloud browser. Treat platform identity, Gmail authorization, and website browser sessions as three separate connections.

## Options

| Approach                           | Useful capabilities                                                                                      | Constraints and product fit                                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Browserbase + Stagehand            | Persistent contexts, interactive embedded browser, file uploads, CDP, individually controlled AI actions | Preferred cloud candidate when cloud execution is enabled. Context persistence and browser lifetime are distinct.           |
| Browser Use Cloud                  | Hosted agent or CDP browser, persisted profiles, local cookie sync, interactive handoff, file workspaces | Useful benchmark challenger. New integrations use V4; distinguish hosted SDK from the open-source Python library.           |
| Browserless Cloud                  | Playwright/Puppeteer, authenticated profile snapshots, reconnectable sessions, interactive live URLs     | Credible interchangeable browser provider; profile size, retention, and live-session deadlines need deliberate handling.    |
| Chrome extension / local companion | Dedicated automation profile plus assisted access to an existing tab                                     | Primary v1 path. Requires installation and an awake, connected device; extension access and dedicated-profile login differ. |

Browserbase [Contexts](https://docs.browserbase.com/platform/browser/core-features/contexts) persist cookies, storage, and other Chromium profile data, encrypted at rest. Create one context per workspace, site, and account, and serialize its use. The documentation advises avoiding concurrent use of the same context. State is saved when a session with `persist: true` closes, followed by a short synchronization delay. A durable context does not prevent the website from expiring its login.

Its [Live View](https://docs.browserbase.com/platform/browser/observability/session-live-view) can be embedded for users to click and type. [Keep Alive](https://docs.browserbase.com/platform/browser/long-sessions/overview) permits reconnection after disconnects on paid plans, but sessions still expire, with a documented maximum of six hours. Do not keep a browser running while waiting overnight for user input.

Browser Use's current [quickstart](https://docs.browser-use.com/cloud/quickstart) uses V4 for both hosted agents and browser infrastructure. [Profiles](https://docs.browser-use.com/cloud/guides/authentication) preserve browser login state. Its [local sync helper](https://docs.browser-use.com/cloud/guides/profile-sync) can transfer selected existing logins. The documentation explicitly says this does not guarantee acceptance, because websites can bind sessions to devices or networks. This is an optional connection method, not proof that arbitrary user accounts will work remotely. [Human handoff](https://docs.browser-use.com/cloud/agent/human-in-the-loop) supports continuing the same conversation and live browser while that browser remains available; [workspaces](https://docs.browser-use.com/cloud/agent/workspaces) separately hold uploaded files.

Browserless [Authenticated Profiles](https://docs.browserless.io/baas/features/authenticated-profiles) snapshot cookies, localStorage, and IndexedDB for fresh sessions. Current limits include 2 MB of captured state, 50 origins, and automatic removal after 30 days unused. With Playwright, reuse the initial context; new contexts are unauthenticated. [Hybrid Automation](https://docs.browserless.io/baas/monitor-sessions/hybrid-automation) provides interactive live URLs, but opening one does not extend the original session deadline. These URLs confer browser access to their holder.

For unattended local work, the companion launches a dedicated [Playwright persistent context](https://playwright.dev/docs/api/class-browsertype#browser-type-launch-persistent-context). The user logs into that profile explicitly; it does not inherit their normal Chrome cookies. Serialize access to its data directory and protect it as credential storage. Autonomous work runs only while the companion and machine are available; asleep or offline means queued work.

For existing tabs, the team should use an assisted extension with [activeTab and scripting](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab), where possible. This requires a user gesture and loses access across origins, so it cannot promise arbitrary unattended background browsing. More complete control can use [chrome.debugger](https://developer.chrome.com/docs/extensions/reference/api/debugger), with additional permission and frame handling. A [native messaging host](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging) can connect the extension to the companion. Keep cookies local. Since Chrome 136, ordinary remote-debugging switches require a nondefault data directory; do not design around silently attaching to a normal profile. [Chrome change, published 2025-03-17](https://developer.chrome.com/blog/remote-debugging-port).

## Execution design

The product owns an application state machine. Browser vendors supply execution capacity. A workflow owns waits and retries. Agents interpret the page and propose bounded actions.

```text
BrowserSessionAdapter
  create(workspaceId, siteAccountId, purpose, expiresAt)
  inspect(sessionId)
  executeAllowedAction(sessionId, action)
  uploadArtifact(sessionId, artifactId, sha256)
  handoff(sessionId, reason)
  reconnect(sessionId)
  close(sessionId, persist)
  revoke(siteAccountId)

ApplicationAdapter
  inspectForm(posting)
  fillAndVerify(preparedPackage)
  submitOnce(attemptId, authorizationId)
  reconcile(attemptId)
```

Use deterministic Playwright actions for known ATS controls, with Stagehand for bounded interpretation or locating a changed control. Its [observe/act model](https://docs.stagehand.dev/v3/basics/act) returns inspectable action candidates and supports stepwise execution and caching. Validate candidate actions against the current workflow state before executing them. This gives our runtime a place to enforce submission rules; a broad instruction to an unrestricted agent does not.

Before an irreversible submission, reserve an attempt transactionally and bind it to the posting, artifact hash, answers, and authorization. Execute the final action once. A browser timeout after the click means `outcome_unknown`, not permission to click again. Reconciliation can inspect the ATS and a uniquely matched confirmation message. Persist the attempt even when the posting had no prior dossier.

For authentication, open a dedicated connection session and let the user complete the site's login, MFA, or new consent screen in the live browser. Pause agent observation and redact/disable recordings for that portion. Confirm the signed-in identity from account UI, close to persist, and verify the saved connection in a fresh session. The platform stores a scoped session reference, never a password in a prompt. Some passkey/device approval paths may require the local fallback; this needs testing.

Use short authenticated application endpoints to issue live-view access. Treat vendor URLs, CDP endpoints, cookies, and profile IDs as sensitive capabilities; enforce workspace ownership on every operation and keep secrets out of business events. Terminate active sessions and remove persisted vendor profiles on disconnect. Validate vendor deletion and recording-retention behavior before production.

## What must change in the existing skills

`job-prep` already separates preparation from submission, records walls, and excludes sign-in and CAPTCHA solving. Preserve that boundary. `job-apply` already binds prepared CV bytes, verifies form values after upload, checks account identity, prohibits new OAuth grants, and recognizes ambiguous submissions. Move these checks into code rather than relying on prompt obedience.

The current `job-apply` contract never waits for the operator and skips account creation. A consumer platform needs explicit `needs_login`, `needs_user_answer`, `needs_challenge`, and `outcome_unknown` states. Human-assisted account setup is a separate user action; an agent should not silently create an account. Automatic CAPTCHA support is a vendor capability, not a reliability guarantee: Browser Use's [CAPTCHA documentation](https://docs.browser-use.com/cloud/browser/captcha-handling) explicitly says solving is not guaranteed. None of the reviewed documentation establishes universal ATS compatibility.

Browserbase supports Playwright [setInputFiles and uploads](https://docs.browserbase.com/platform/browser/files/uploads). Fetch only the authorized resume into the worker, verify its digest, upload, then check attachment completion and field changes. Website acceptance and content parsing still require application-specific validation.

## Costs and evidence to collect

Current public rates illustrate the drivers, not total cost per application. Browserbase's [pricing](https://www.browserbase.com/pricing) lists $20/month with 100 browser hours and 25 concurrent browsers, then $0.12/hour; Startup lists $99/month, 500 hours and 100 concurrent browsers, then $0.10/hour. Model and network costs are separate.

Browser Use [pricing](https://browser-use.com/pricing) lists $0.02/browser hour, $5/GB residential traffic, or $0.20/GB direct/BYO-proxy traffic; hosted agents add 20% to model cost. Browserless [usage](https://docs.browserless.io/overview/unit-consumption) meters one unit per 30 seconds, six units per residential MB, and ten units per successful CAPTCHA solve. Human waiting, repeated page loads, model tokens, proxy bytes, retries, and support intervention matter more than browser hours alone.

Run the same acceptance suite against Browserbase and Browser Use before committing:

1. Two private workspaces cannot access each other's profiles, artifacts, traces, or live views.
2. User-assisted login survives clean closure and a fresh browser; expired login produces a recoverable request.
3. Worker disconnect reconnects to an existing browser; expired browser resumes from persisted domain state.
4. Synthetic Greenhouse/Lever/Ashby-style forms cover conditional fields, iframes, redirects, and upload parsing. Real smoke tests stop before submission unless explicitly authorized.
5. An artifact change invalidates approval; wrong-account login blocks execution.
6. Crash immediately before and after a simulated successful submit produces at most one external submission and a reconciled result.
7. MFA/CAPTCHA hands control to the user; abandoned handoff releases capacity and never causes submission.
8. Revocation blocks queued work and deletes the vendor profile; inspect logging and retention behavior.
9. Measure completed applications, intervention rate, and p50/p95 duration. Also measure tokens, bytes, browser time, and cost per confirmed submission.

Outstanding empirical questions are login survival by ATS, passkey usability, and mobile live-view usability. Also outstanding are supported-site success rates, session recovery after provider failure, and deletion/retention guarantees. Most vendor pages have no publication date; all cited pages were inspected on 2026-09-19. Chrome's debugger reference reports an update on 2026-09-11.
