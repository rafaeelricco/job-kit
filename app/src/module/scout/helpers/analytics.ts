export { RANGES, anchorOf, deltaPct, isHighScore, isLive, pairedSeries, seriesOf, tallyBy, topCompanies, windowOf }
export type { PairedPoint, RangeKey, SeriesPoint, TallyRow, Window }

import type { Dossier } from "@/module/scout/types"

const DAY_MS = 86_400_000

const RANGES = [
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "all", label: "All time", days: null },
] as const

type RangeKey = (typeof RANGES)[number]["key"]
type SeriesPoint = { readonly date: string; readonly count: number }
type PairedPoint = SeriesPoint & {
  readonly prior?: number
  readonly priorDate?: string
}
type TallyRow = { readonly label: string; readonly count: number }
type Window = { readonly from: string; readonly to: string }

const isHighScore = (d: Dossier) => d.score.kind === "scored" && d.score.value >= 8
const isLive = (d: Dossier) => d.posting.kind === "live"

function toUtc(iso: string): number {
  const [year, month, day] = iso.split("-")
  return Date.UTC(Number(year), Number(month) - 1, Number(day))
}

const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10)

// The window is anchored to the newest dossier rather than to today: the store
// is a snapshot on disk, so a corpus generated last month would render every
// "last 30 days" panel empty if we counted back from the wall clock.
function anchorOf(all: readonly Dossier[]): string {
  let newest = ""
  for (const d of all) if (d.firstSeen > newest) newest = d.firstSeen
  return newest === "" ? toIso(Date.now()) : newest
}

function windowOf(anchor: string, days: number | null, back = 0): Window {
  const to = toUtc(anchor)
  if (days === null) return { from: "0000-01-01", to: anchor }

  const span = days * DAY_MS
  const end = to - back * span
  return { from: toIso(end - span + DAY_MS), to: toIso(end) }
}

const within = (d: Dossier, w: Window) => d.firstSeen >= w.from && d.firstSeen <= w.to

// Zero-filled so a quiet week reads as a flat line rather than a missing gap.
function seriesOf(all: readonly Dossier[], w: Window, pick: (d: Dossier) => boolean): readonly SeriesPoint[] {
  const counts = new Map<string, number>()
  for (const d of all) {
    if (!within(d, w) || !pick(d)) continue
    counts.set(d.firstSeen, (counts.get(d.firstSeen) ?? 0) + 1)
  }

  const start = w.from === "0000-01-01" ? earliest(all, w) : w.from
  const points: SeriesPoint[] = []
  for (let ms = toUtc(start); ms <= toUtc(w.to); ms += DAY_MS) {
    const date = toIso(ms)
    points.push({ date, count: counts.get(date) ?? 0 })
  }
  return points
}

function earliest(all: readonly Dossier[], w: Window): string {
  let oldest = ""
  for (const d of all) {
    if (oldest === "" || d.firstSeen < oldest) oldest = d.firstSeen
  }
  return oldest === "" ? w.to : oldest
}

// The two windows cover different calendar days, so the comparison line is
// aligned by position in the window — day 1 against day 1 — and carries its own
// date for the tooltip.
function pairedSeries(
  all: readonly Dossier[],
  current: Window,
  previous: Window | null,
  pick: (d: Dossier) => boolean
): readonly PairedPoint[] {
  const now = seriesOf(all, current, pick)
  const before = previous === null ? [] : seriesOf(all, previous, pick)
  const offset = before.length - now.length

  return now.map((point, index) => {
    const prior = before[index + offset]
    return {
      date: point.date,
      count: point.count,
      ...(prior === undefined ? {} : { prior: prior.count, priorDate: prior.date }),
    }
  })
}

function countIn(all: readonly Dossier[], w: Window, pick: (d: Dossier) => boolean): number {
  let n = 0
  for (const d of all) if (within(d, w) && pick(d)) n += 1
  return n
}

// null, not 0: "no change" and "no baseline to compare against" are different
// claims, and the card renders them differently.
function deltaPct(
  all: readonly Dossier[],
  current: Window,
  previous: Window,
  pick: (d: Dossier) => boolean
): number | null {
  const before = countIn(all, previous, pick)
  if (before === 0) return null
  return Math.round(((countIn(all, current, pick) - before) / before) * 100)
}

function topCompanies(all: readonly Dossier[], w: Window, limit: number): readonly TallyRow[] {
  const counts = new Map<string, number>()
  for (const d of all) {
    if (!within(d, w)) continue
    counts.set(d.company, (counts.get(d.company) ?? 0) + 1)
  }
  return [...counts]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit)
}

// Keeps the vocabulary's own order, and keeps empty buckets, so the pipeline
// reads as a fixed set of stages rather than a list that reshuffles per filter.
function tallyBy<T extends string>(
  all: readonly Dossier[],
  w: Window,
  vocab: readonly T[],
  key: (d: Dossier) => T
): readonly TallyRow[] {
  const counts = new Map<T, number>(vocab.map((v) => [v, 0]))
  for (const d of all) {
    if (!within(d, w)) continue
    counts.set(key(d), (counts.get(key(d)) ?? 0) + 1)
  }
  return vocab.map((label) => ({ label, count: counts.get(label) ?? 0 }))
}
