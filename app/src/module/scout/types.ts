export {
  BUCKETS,
  CHANNELS,
  FACT_KEYS,
  LIFECYCLES,
  UNKNOWN_TEXT,
  WRITERS,
  factText,
  isBucket,
  isChannel,
  isLifecycle,
  isWriter,
  toIsoDate,
  type Attempt,
  type AttemptOutcome,
  type AttemptSource,
  type Bucket,
  type Channel,
  type Dossier,
  type Excerpt,
  type FactKey,
  type FactValue,
  type Factor,
  type IsoDate,
  type Lifecycle,
  type LogEntry,
  type ParseError,
  type ParsedDossier,
  type Posting,
  type Provenance,
  type Resolution,
  type Score,
  type Store,
  type Verdict,
  type Writer,
}

import type { Result } from "./result"

/* -- closed vocabularies, each with a total guard ------------------------- */

const LIFECYCLES = [
  "new",
  "applied",
  "interview",
  "offer",
  "rejected",
  "dropped",
] as const
const BUCKETS = ["direct", "EOR", "EU/US-only", "unbucketed"] as const
const CHANNELS = ["direct_email", "dm_request", "founder", "ats"] as const
const WRITERS = ["job-scout", "job-application"] as const
const FACT_KEYS = [
  "status",
  "status_reason",
  "seniority",
  "work_model",
  "location",
  "salary",
  "work_auth",
  "hiring_route",
  "required_skills",
  "jd_date",
  "blocker",
] as const

type Lifecycle = (typeof LIFECYCLES)[number]
type Bucket = (typeof BUCKETS)[number]
type Channel = (typeof CHANNELS)[number]
type Writer = (typeof WRITERS)[number]
type FactKey = (typeof FACT_KEYS)[number]

// One guard factory rather than four hand-written predicates.
const memberOf =
  <T extends string>(vocab: readonly T[]) =>
  (raw: string): raw is T =>
    (vocab as readonly string[]).includes(raw)

const isLifecycle = memberOf(LIFECYCLES)
const isBucket = memberOf(BUCKETS)
const isChannel = memberOf(CHANNELS)
const isWriter = memberOf(WRITERS)

/* -- branded scalars ------------------------------------------------------ */

// A plain string date sorts wrong the moment a non-ISO value slips in, and the
// corpus compares these lexically. The brand forces every value through the
// smart constructor.
declare const IsoBrand: unique symbol
type IsoDate = string & { readonly [IsoBrand]: true }

const toIsoDate = (raw: string): IsoDate | null =>
  /^\d{4}-\d{2}-\d{2}$/.test(raw) ? (raw as IsoDate) : null

/* -- values --------------------------------------------------------------- */

// The corpus writes unknown as a literal em dash. Carrying that string into the
// model would let it match a search, sort as text, and render as content.
type FactValue =
  | { readonly kind: "known"; readonly text: string }
  | { readonly kind: "unknown" }

const UNKNOWN_TEXT = "—"

// The one place an unknown becomes a glyph.
const factText = (value: FactValue): string =>
  value.kind === "known" ? value.text : UNKNOWN_TEXT

type Score =
  | { readonly kind: "scored"; readonly value: number }
  | { readonly kind: "unscored" }

type Excerpt =
  | { readonly kind: "printed"; readonly text: string }
  | { readonly kind: "absent" }

type Posting =
  { readonly kind: "live" } | { readonly kind: "dead"; readonly since: IsoDate }

type Factor = { readonly label: string; readonly points: FactValue }

type Verdict = { readonly why: string; readonly factors: readonly Factor[] }

type LogEntry = {
  readonly date: IsoDate
  readonly event: string
  readonly writer: Writer
}

type Provenance = {
  readonly source: string
  readonly author: FactValue
  readonly contact: FactValue
  readonly date: string
}

type Dossier = {
  readonly file: string
  readonly company: string
  readonly title: string
  readonly url: string
  readonly host: string
  readonly status: Lifecycle
  readonly firstSeen: IsoDate
  readonly lastSeen: IsoDate
  readonly score: Score
  readonly bucket: Bucket
  readonly channel: Channel
  readonly verdict: Verdict
  readonly facts: Readonly<Record<FactKey, FactValue>>
  readonly excerpt: Excerpt
  readonly provenance: Provenance
  readonly log: readonly LogEntry[]
  readonly posting: Posting
  readonly applications: number
}

/* -- parse failure -------------------------------------------------------- */

// Discriminated, so the gaps list can group by cause instead of matching prose.
type ParseError = {
  readonly file: string
  readonly at: string
  readonly cause:
    | { readonly kind: "frontmatter"; readonly detail: string }
    | {
        readonly kind: "vocabulary"
        readonly field: string
        readonly got: string
      }
    | { readonly kind: "section"; readonly heading: string }
    | { readonly kind: "table"; readonly detail: string }
    | { readonly kind: "date"; readonly field: string; readonly got: string }
    | {
        readonly kind: "score-mismatch"
        readonly frontmatter: string
        readonly table: string
      }
}

type ParsedDossier = Result<Dossier, ParseError>

/* -- profile-root resolution ---------------------------------------------- */

// Lives here rather than beside the resolver so the browser never reaches into
// app/server/ and drag node types into the app tsconfig project.
type AttemptSource =
  | "PROFILE_ROOT"
  | "host-pointer"
  | "aside-mirror"
  | "job-kit-config"
  | "host-default"
  | "cwd-walk"

type AttemptOutcome =
  | { readonly kind: "passed" }
  | { readonly kind: "empty" }
  | { readonly kind: "missing" }
  | { readonly kind: "unreadable" }
  | { readonly kind: "probe-failed" }
  | {
      readonly kind: "skipped"
      readonly reason: "already-tried" | "not-applicable"
    }

type Attempt = {
  readonly source: AttemptSource
  readonly path: string | null
  // Pointer files must report the line they held, per SKILL.md step 6.
  readonly line: string | null
  readonly outcome: AttemptOutcome
}

type Resolution =
  | {
      readonly kind: "resolved"
      readonly root: string
      readonly via: AttemptSource
      readonly attempts: readonly Attempt[]
    }
  | { readonly kind: "unresolved"; readonly attempts: readonly Attempt[] }

type Store =
  | {
      readonly kind: "ready"
      readonly root: string
      readonly via: AttemptSource
      readonly attempts: readonly Attempt[]
      readonly generatedAt: string
      readonly dossiers: readonly Dossier[]
      readonly gaps: readonly ParseError[]
    }
  | { readonly kind: "unresolved"; readonly attempts: readonly Attempt[] }
