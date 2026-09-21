# Job discovery strategy

> **Historical research, not current implementation guidance (updated 2026-09-21).** Preserve the dated evidence and validation limits below. Recommendations for companions, local executors, managed workflow/browser services, Supabase, or platform-selected AI routes are superseded. Current decisions are web-only, self-hosted on the owner's VPS, and user-funded AI connections for OpenAI, Gemini, Anthropic, and xAI; hosted compatibility and authorization remain unproven gates. TypeSafe matching remains platform-funded. If user AI is unavailable, work waits for reconnect or an explicit manual account switch. See the current [decision index](../decisions/README.md) and [platform architecture](../architecture/overview.md).

[Research index](README.md) · [Decision status](../decisions/README.md)

Current disposition: stable internal posting IDs and workspace-scoped observations first. Provider identifiers and URLs are aliases. Shared collection and caching below describe later options. The [Discovery module](../domain/discovery.md) owns the current domain proposal.

Official sources checked on 2026-09-19. Repository review covered `skill/job-scout/SKILL.md` and all six referenced flows. No authenticated boards were accessed.

**Recommendation: hosted public-source ingestion, private matching on the personal runner, and browser execution only where an authorized source actually requires it.** This fits the user's preference for using existing ChatGPT/Claude subscriptions for agent work. Deterministic HTTP collection needs no LLM subscription or browser. A hosted browser agent or search API has separate costs and access terms.

## Initial source coverage

| Source               | Documented read interface                                                                          | Engineering implication                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Greenhouse           | Public GET endpoints for a known board token and job ID; list can include description content      | Build a hosted adapter; retain posting ID separately from internal job ID. Public reading does not grant application POST credentials. |
| Lever                | Public published postings by company site; filters and pagination; global and EU hosts             | Build a hosted adapter and include region in identity. No full-text cross-company search or internal jobs.                             |
| Ashby                | Public board endpoint with descriptions, locations, workplace type, compensation, publication time | Build a hosted adapter; exclude `isListed=false` from shared discovery.                                                                |
| Workday              | Official recruiting API directory exists; no anonymous cross-employer discovery contract verified  | Treat career-site browser extraction as source-specific fallback. Do not call undocumented CXS routes a supported public API.          |
| Other company sites  | Page content and sometimes JobPosting structured data                                              | HTTP fetch and structured extraction first; browser for rendering or interaction where permitted.                                      |
| Authenticated boards | Site-specific account/session and permissions                                                      | Private personal-runner source; no shared crawl using one user's account.                                                              |

The [Greenhouse Job Board API](https://docs.greenhouse.io/job-board.html) explicitly requires no authentication for GET requests. Use the board listing with `content=true`, then retrieve individual postings when necessary. `updated_at` is modification evidence, not a guaranteed original publication date. Application POST requires the employer's Job Board API key. Do not confuse the public board API with authenticated Harvest or borrow Harvest's rate limit.

[Lever's official Postings API](https://github.com/lever/postings-api) provides `skip`/`limit` pagination, published job IDs, and job/apply URLs. It distinguishes global from EU infrastructure. Its documented two-requests-per-second limit concerns application POST; it is not a documented public GET allowance. Custom application POST requires an employer-generated API key. Discovery access therefore does not remove the application's browser challenge.

[Ashby's public API](https://developers.ashbyhq.com/docs/public-job-posting-api) returns `descriptionPlain`, `descriptionHtml`, `jobUrl`, `applyUrl`, and optional compensation. `publishedAt` means last published, and missing source data remains missing. `isListed=false` means the posting should only be available through a direct link. Honor that by excluding it from general recommendations; a user-supplied direct link can remain private. For later scale, Ashby offers [partner feeds](https://developers.ashbyhq.com/docs/dedicated-partner-job-feeds), updated hourly, containing jobs from customers that opt into that partner integration.

Workday's [official REST directory](https://community.workday.com/sites/default/files/file-hosting/restapi/index.html) includes Recruiting. Its [authentication documentation](https://developer.workday.com/documentation/xjp1528996953713/AuthenticateUsingtheImplicitGrantType) describes registered clients and authenticated requests. This research did not establish an official public contract for the anonymous CXS endpoints used by external career pages. Their exact stability and limits remain unknown. Keep any future CXS adapter explicitly experimental, with per-tenant fixtures and a browser/manual fallback.

## Search discovers sources; source reads establish facts

Maintain a board registry populated from user-selected employers, public company career links, known postings, and search results. Store the provider, region, board identifier, and canonical host, plus provenance, access class, and last successful collection. The current skill deliberately has no registry; adding one avoids rediscovering the same board for every user.

A search provider such as [Brave Web Search](https://api-dashboard.search.brave.com/app/documentation/web-search) can find board URLs and non-ATS postings with site filters and paginated queries. Search snippets nominate candidates; fetch the original posting before extracting requirements or declaring it live. Its [freshness parameter](https://api-dashboard.search.brave.com/api-reference/web/search/post) uses a relevant page date, which may be a modification date. Search freshness is therefore different from job publication age. Brave's [API FAQ](https://brave.com/search/api/) requires a plan explicitly granting storage rights to retain API results and does not grant rights to destination-page content. Choose the plan and retention policy before persisting search responses.

For company pages, parse [JobPosting structured data](https://developers.google.com/search/docs/appearance/structured-data/job-posting), then reconcile it with visible content. Preserve `datePosted`, `validThrough`, employer identity, and applicant location requirements separately. Structured data can be stale or disagree with the page. An index result or future `validThrough` does not prove the application is still open.

## Adapter and data ownership

```ts
type Visibility = { kind: "public" } | { kind: "workspace"; workspaceId: string }

interface DiscoverySource {
  identify(url: string): Promise<SourceIdentity | null>
  list(input: ListInput): Promise<{
    postings: RawPosting[]
    cursor?: string
    completeness: "complete" | "partial"
    retryAfterMs?: number
  }>
  read(ref: PostingRef): Promise<PostingObservation>
  capabilities: {
    transport: "http" | "browser" | "partner-feed"
    authentication: "none" | "connection"
    canEnumerateBoard: boolean
    hasReliablePublishedAt: boolean
  }
}
```

Every observation carries visibility, source identity, retrieval time, source timestamps, content hash, parser version, and evidence. The server derives workspace ownership from the authenticated run; it never trusts a workspace ID supplied in page content or model output.

Public board reads can be shared across users only after classifying the source and content as publicly listed. Candidate profiles, queries, match results, and private board contents stay workspace-scoped, as do emails, referral links, login artifacts, and private-source existence. Do not merge private text into a public posting because their URLs or titles match. Independently fetch a listed public counterpart to establish shareable content.

The personal runner receives relevant public snapshots and combines them with private candidate facts. Deterministic gates reduce what needs model interpretation; reusable extracted job facts may be public, while candidate-specific scoring remains private. A sleeping runner leaves matching pending even though public ingestion continues. Model/provider limits must appear as pending or throttled work, never fabricated empty results.

## Identity, freshness, and scheduling

Use `(provider, region, board, postingId)` when a supported adapter has a durable identifier, otherwise a normalized canonical posting URL. Keep original and apply URLs, aliases, and source provenance. Same company/title is a possible equivalent, not a merge key; different locations and requisitions can be distinct openings. Strip only known tracking parameters so identifiers such as `gh_jid` survive.

Separate `firstSeenAt`, `lastSeenAt`, `lastCheckedAt`, `sourcePublishedAt`, and `sourceUpdatedAt`, plus content revision. Re-publishing must not pretend an old posting was first discovered today. Emit changed observations and availability changes; keep repetitive crawl telemetry outside permanent business history.

Poll boards once for all interested users, with jitter and host/board concurrency limits. A six-hour interval is a starting product assumption, not a vendor allowance; tune it against freshness goals and observed limits. Honor `Retry-After`, use exponential backoff, cache unchanged content, and retain incomplete-run markers. A capped or failed listing cannot establish closure. Confirm absence through a complete authoritative enumeration or a direct posting check; revalidate immediately before application.

Source access is part of the adapter contract. [LinkedIn's agreement](https://www.linkedin.com/legal/user-agreement) restricts unauthorized automated access. [Indeed's current rules](https://www.indeed.com/legal) restrict automated access and submission, with specific permissions and connectors as exceptions. A personal session or cloud browser does not establish those permissions. Prioritize employer ATS endpoints and permitted integrations; keep unsupported sources manual or user-imported until access is established.

## Preserve and strengthen the skill

Preserve explicit search packs, proven submitted queries, and location/authorization gates. Also preserve unknown-versus-zero distinctions, full-posting extraction, canonicalization, and separate 0–10 scout and 0–100 match scores. Preserve the existing rule that a failed configured route does not silently become a DOM run; any fallback should be an explicit adapter policy with recorded provenance.

Move browser-origin GET assumptions into transport adapters: documented public APIs can be fetched server-side. Replace five-page/40-candidate silent ceilings with persisted cursors and visibly partial coverage. Store public observations even when one candidate scores poorly; user-specific filtering must not delete shared source facts. Extend current EU Lever handling from deliberate skipping to an explicit regional adapter.

## Proof of concept

| Check                                  | Required result                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| Three public ATS adapters              | Known fixtures preserve IDs, URLs, missing values, regions, and publication semantics |
| Partial enumeration / 429 / outage     | No false closure or false zero-results success                                        |
| Redirect and aggregator duplicate      | One canonical posting with provenance; distinct requisitions remain separate          |
| Unlisted or authenticated source       | No content or existence leaks into another workspace or shared search                 |
| Runner offline / provider throttled    | Public ingestion continues; private matching resumes without duplicate results        |
| Reopened or materially changed posting | New revision or reopening event, stable identity and first-seen date                  |
| Eligibility evidence                   | Remote alone never proves worldwide hiring or work authorization                      |

Public GET rate ceilings, cross-tenant Workday stability, partner-feed eligibility, and broad source-coverage recall remain unverified. Test a selected employer set before promising comprehensive discovery.
