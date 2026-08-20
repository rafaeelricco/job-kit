export {
  EMPTY_FILTER,
  PAGE_SIZES,
  SCORE_BANDS,
  SCORE_BAND_LABELS,
  SEGMENTS,
  byScore,
  byStatus,
  bySource,
  byText,
  cycleSource,
  matches,
  paginate,
  sourceState,
  summarize,
  tallySources,
  type Filter,
  type ScoreBand,
  type Segment,
  type SourceRow,
  type SourceState,
}

import type { Bucket, Channel, Dossier, FactValue, Lifecycle } from "@/module/scout/types"
import { LIFECYCLES } from "@/module/scout/types"
import { assertNever } from "@/module/scout/result"

const SEGMENTS = ["all", "new", "applied", "dead"] as const
const PAGE_SIZES = [25, 50, 100] as const
// The scale is ten integers with the rubric's own cuts — scout keeps ≥ 7 and
// ranks ≥ 8 (skill/job-scout/references/rank-report.md `## Score`). Bands rather
// than a min/max pair: every question worth asking of ten integers is one of
// these four, and a band is one click where a range is two controls.
const SCORE_BANDS = ["strong", "keep", "low", "unscored"] as const

type Segment = (typeof SEGMENTS)[number]
type ScoreBand = (typeof SCORE_BANDS)[number]

const SCORE_BAND_LABELS: Readonly<Record<ScoreBand, string>> = {
  strong: "Strong 8–9",
  keep: "Keep 7",
  low: "Low ≤6",
  unscored: "Unscored",
}

// Unscored is a band, not a hole. The old `minScore` dropped those rows without
// saying so; here they are one of the four things you can ask for.
const bandOf = (d: Dossier): ScoreBand =>
  d.score.kind === "unscored" ? "unscored" : d.score.value >= 8 ? "strong" : d.score.value >= 7 ? "keep" : "low"

type Filter = {
  readonly query: string
  readonly segment: Segment
  readonly bands: readonly ScoreBand[]
  readonly buckets: readonly Bucket[]
  readonly channels: readonly Channel[]
  readonly statuses: readonly Lifecycle[]
  // Sources are operator-minted pack ids, not a closed vocabulary like the
  // facets above, so they carry no union type — the list comes from the store.
  readonly sources: readonly string[]
  readonly excluded: readonly string[]
}

const EMPTY_FILTER: Filter = {
  query: "",
  segment: "all",
  bands: [],
  buckets: [],
  channels: [],
  statuses: [],
  sources: [],
  excluded: [],
}

/* -- filtering ------------------------------------------------------------ */

// An unknown fact is a hole, not the em dash the corpus prints for it. Feeding
// the glyph into the corpus would let a search for "—" match every gap.
const known = (value: FactValue): string => (value.kind === "known" ? value.text : "")

// Same fields the previous viewer searched, in the same order.
const corpus = (d: Dossier): string =>
  [d.company, d.title, d.verdict.why, known(d.facts.required_skills), known(d.facts.location), d.host]
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
const facet = <T>(chosen: readonly T[], value: T): boolean => chosen.length === 0 || chosen.includes(value)

type SourceState = "off" | "only" | "not"
type SourceRow = { readonly source: string; readonly count: number }

const sourceState = (f: Filter, source: string): SourceState =>
  f.sources.includes(source) ? "only" : f.excluded.includes(source) ? "not" : "off"

// One click narrows to a source, the next banishes it, the third forgets it.
// Both lists live here rather than in the toolbar so the cycle cannot drift out
// of step with what `matches` actually does with them.
function cycleSource(f: Filter, source: string): Filter {
  const drop = (list: readonly string[]) => list.filter((one) => one !== source)
  const state = sourceState(f, source)
  switch (state) {
    case "off":
      return { ...f, sources: [...f.sources, source] }
    case "only":
      return { ...f, sources: drop(f.sources), excluded: [...f.excluded, source] }
    case "not":
      return { ...f, excluded: drop(f.excluded) }
    default:
      return assertNever(state)
  }
}

// The vocabulary is whatever the store holds, so it is counted rather than
// declared. Busiest first: the pack worth excluding is the one flooding the base.
// Counts are store-wide, so they do not shrink as you filter with them.
function tallySources(all: readonly Dossier[]): readonly SourceRow[] {
  const counts = new Map<string, number>()
  for (const d of all) counts.set(d.provenance.source, (counts.get(d.provenance.source) ?? 0) + 1)
  return [...counts]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count || byText(a.source, b.source))
}

const matches =
  (f: Filter) =>
  (d: Dossier): boolean => {
    if (!inSegment(f.segment, d)) return false
    // Exclusion outranks inclusion: an excluded source is gone even if some
    // other source is included, so the two lists never have to be kept disjoint.
    if (f.excluded.includes(d.provenance.source)) return false
    if (!facet(f.sources, d.provenance.source)) return false
    if (!facet(f.bands, bandOf(d))) return false
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

// Sources are operator-minted search-pack slugs, so the order is alphabetical
// and only meaningful as a grouping — it puts every row from one pack together.
const byText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)
const bySource = (a: Dossier, b: Dossier): number => byText(a.provenance.source, b.provenance.source)

// Lifecycle order is semantic (new → dropped), not alphabetical.
const byStatus = (a: Dossier, b: Dossier): number => LIFECYCLES.indexOf(a.status) - LIFECYCLES.indexOf(b.status)

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
