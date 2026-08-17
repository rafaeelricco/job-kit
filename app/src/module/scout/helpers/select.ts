export {
  EMPTY_FILTER,
  PAGE_SIZES,
  SEGMENTS,
  byScore,
  bySeen,
  byStatus,
  byText,
  matches,
  paginate,
  summarize,
  type Filter,
  type Segment,
}

import type {
  Bucket,
  Channel,
  Dossier,
  FactValue,
  Lifecycle,
} from "@/module/scout/types"
import { LIFECYCLES } from "@/module/scout/types"
import { assertNever } from "@/module/scout/result"

const SEGMENTS = ["all", "new", "applied", "dead"] as const
const PAGE_SIZES = [25, 50, 100] as const

type Segment = (typeof SEGMENTS)[number]

type Filter = {
  readonly query: string
  readonly segment: Segment
  readonly minScore: number
  readonly buckets: readonly Bucket[]
  readonly channels: readonly Channel[]
  readonly statuses: readonly Lifecycle[]
}

const EMPTY_FILTER: Filter = {
  query: "",
  segment: "all",
  minScore: 0,
  buckets: [],
  channels: [],
  statuses: [],
}

/* -- filtering ------------------------------------------------------------ */

// An unknown fact is a hole, not the em dash the corpus prints for it. Feeding
// the glyph into the corpus would let a search for "—" match every gap.
const known = (value: FactValue): string =>
  value.kind === "known" ? value.text : ""

// Same fields the previous viewer searched, in the same order.
const corpus = (d: Dossier): string =>
  [
    d.company,
    d.title,
    d.verdict.why,
    known(d.facts.required_skills),
    known(d.facts.location),
    d.host,
  ]
    .join("\n")
    .toLowerCase()

const inSegment = (segment: Segment, d: Dossier): boolean => {
  switch (segment) {
    case "all":
      return true
    case "new":
      return d.status === "new"
    case "applied":
      return d.status === "applied"
    case "dead":
      return d.posting.kind === "dead"
    default:
      return assertNever(segment)
  }
}

// An empty facet array is "no constraint" — OR within a facet, AND across them.
const facet = <T>(chosen: readonly T[], value: T): boolean =>
  chosen.length === 0 || chosen.includes(value)

const matches =
  (f: Filter, hidden: ReadonlySet<string>) =>
  (d: Dossier): boolean => {
    if (hidden.has(d.file)) return false
    if (!inSegment(f.segment, d)) return false
    if (f.minScore > 0) {
      if (d.score.kind !== "scored") return false
      if (d.score.value < f.minScore) return false
    }
    if (!facet(f.buckets, d.bucket)) return false
    if (!facet(f.channels, d.channel)) return false
    if (!facet(f.statuses, d.status)) return false
    const query = f.query.trim().toLowerCase()
    if (query === "") return true
    return corpus(d).includes(query)
  }

/* -- sorting -------------------------------------------------------------- */

// Unscored sits below every scored value, so descending puts it last.
const byScore = (a: Dossier, b: Dossier): number => {
  if (a.score.kind === "unscored" && b.score.kind === "unscored") return 0
  if (a.score.kind === "unscored") return -1
  if (b.score.kind === "unscored") return 1
  return a.score.value - b.score.value
}

// IsoDate is branded exactly so this lexical compare is chronological.
const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)
const bySeen = (a: Dossier, b: Dossier): number =>
  byText(a.lastSeen, b.lastSeen)

// Lifecycle order is semantic (new → dropped), not alphabetical.
const byStatus = (a: Dossier, b: Dossier): number =>
  LIFECYCLES.indexOf(a.status) - LIFECYCLES.indexOf(b.status)

/* -- paging and totals ---------------------------------------------------- */

// Returns the clamped page so the caller renders the page it actually got.
function paginate<T>(
  rows: readonly T[],
  page: number,
  size: number
): {
  readonly rows: readonly T[]
  readonly page: number
  readonly pages: number
} {
  const pages = Math.max(1, Math.ceil(rows.length / size))
  const clamped = Math.min(Math.max(Math.trunc(page) || 1, 1), pages)
  const start = (clamped - 1) * size
  return { rows: rows.slice(start, start + size), page: clamped, pages }
}

function summarize(all: readonly Dossier[]): {
  readonly total: number
  readonly highScore: number
  readonly applied: number
  readonly live: number
} {
  let highScore = 0
  let applied = 0
  let live = 0
  for (const d of all) {
    if (d.score.kind === "scored" && d.score.value >= 8) highScore += 1
    if (d.status === "applied") applied += 1
    if (d.posting.kind === "live") live += 1
  }
  return { total: all.length, highScore, applied, live }
}
