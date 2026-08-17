export { Dashboard }

import { useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import {
  Building2,
  CalendarDays,
  ChevronsUpDown,
  CircleCheckBig,
  Files,
  GitBranch,
  Layers,
  Radio,
  Star,
  TrendingUp,
} from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { Card, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  RANGES,
  anchorOf,
  deltaPct,
  isHighScore,
  isLive,
  pairedSeries,
  seriesOf,
  tallyBy,
  topCompanies,
  windowOf,
} from "@/module/scout/helpers/analytics"
import type { RangeKey, TallyRow, Window } from "@/module/scout/helpers/analytics"
import { CHANNELS, LIFECYCLES } from "@/module/scout/types"
import type { Channel, Dossier } from "@/module/scout/types"

const ALL_CHANNELS = "all"
const TOP_LIMIT = 5

const CHANNEL_LABELS: Record<Channel, string> = {
  direct_email: "Direct email",
  dm_request: "DM request",
  founder: "Founder",
  ats: "ATS",
}

const TILES = [
  { key: "total", label: "Total dossiers", Icon: Files, pick: () => true },
  { key: "high", label: "Score 8+", Icon: Star, pick: isHighScore },
  {
    key: "applied",
    label: "Applied",
    Icon: CircleCheckBig,
    pick: (d: Dossier) => d.status === "applied",
  },
  { key: "live", label: "Live postings", Icon: Radio, pick: isLive },
] as const

const CHART: ChartConfig = {
  count: { label: "This period", color: "var(--color-brand)" },
  prior: { label: "Previous", color: "var(--color-brand)" },
}

function Dashboard({ dossiers }: { readonly dossiers: readonly Dossier[] }) {
  const [range, setRange] = useState<RangeKey>("30d")
  const [compare, setCompare] = useState(true)
  const [channel, setChannel] = useState<Channel | typeof ALL_CHANNELS>(ALL_CHANNELS)

  const scoped = useMemo(
    () => (channel === ALL_CHANNELS ? dossiers : dossiers.filter((d) => d.channel === channel)),
    [dossiers, channel]
  )

  const days = RANGES.find((r) => r.key === range)?.days ?? null
  const anchor = useMemo(() => anchorOf(dossiers), [dossiers])
  const current = useMemo(() => windowOf(anchor, days), [anchor, days])
  const previous = useMemo(() => windowOf(anchor, days, 1), [anchor, days])
  // "All time" has nothing behind it to compare against.
  const baseline = compare && days !== null ? previous : null

  const trend = useMemo(() => pairedSeries(scoped, current, baseline, () => true), [scoped, current, baseline])
  const companies = useMemo(() => topCompanies(scoped, current, TOP_LIMIT), [scoped, current])
  const pipeline = useMemo(() => tallyBy(scoped, current, LIFECYCLES, (d) => d.status), [scoped, current])
  const total = trend.reduce((n, p) => n + p.count, 0)

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Pill
          Icon={CalendarDays}
          value={range}
          onValue={(v) => setRange(v as RangeKey)}
          options={RANGES.map((r) => ({ value: r.key, label: r.label }))}
        />
        <Pill
          Icon={CalendarDays}
          value={compare ? "on" : "off"}
          onValue={(v) => setCompare(v === "on")}
          options={[
            { value: "on", label: "Compare" },
            { value: "off", label: "No comparison" },
          ]}
        />
        <Pill
          Icon={Layers}
          value={channel}
          onValue={(v) => setChannel(v as Channel | typeof ALL_CHANNELS)}
          options={[
            { value: ALL_CHANNELS, label: "All channels" },
            ...CHANNELS.map((c) => ({ value: c, label: CHANNEL_LABELS[c] })),
          ]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map((tile) => (
          <Tile
            key={tile.key}
            label={tile.label}
            Icon={tile.Icon}
            points={seriesOf(scoped, current, tile.pick)}
            delta={baseline === null ? null : deltaPct(scoped, current, baseline, tile.pick)}
          />
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <SectionTitle Icon={TrendingUp}>Dossiers over time</SectionTitle>
            <p className="text-[28px] leading-none font-semibold tabular-nums">{total.toLocaleString()}</p>
          </div>

          <ChartContainer config={CHART} className="h-64 w-full">
            <LineChart data={[...trend]} margin={{ left: -16, right: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="0" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                minTickGap={40}
                tickFormatter={shortDate}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={12} allowDecimals={false} width={48} />
              <ChartTooltip content={<ChartTooltipContent labelFormatter={shortDate} />} />
              {baseline === null ? null : (
                <Line
                  dataKey="prior"
                  type="monotone"
                  stroke="var(--color-prior)"
                  strokeWidth={1.5}
                  strokeDasharray="2 3"
                  strokeOpacity={0.55}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              <Line
                dataKey="count"
                type="monotone"
                stroke="var(--color-count)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <Key label={rangeLabel(current)} />
            {baseline === null ? null : <Key label={rangeLabel(baseline)} faded />}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarList title="Top companies" Icon={Building2} rows={companies} total={total} />
        <BarList title="Pipeline" Icon={GitBranch} rows={pipeline} total={total} />
      </div>
    </>
  )
}

// The reference underlines every section heading with a dotted rule that spans
// the icon and the text, and never shouts it in uppercase.
function SectionTitle({ Icon, children }: { readonly Icon: LucideIcon; readonly children: ReactNode }) {
  return (
    <div className="flex w-fit items-center gap-2 border-b border-dotted border-muted-foreground/40 pb-1.5 text-[15px] text-muted-foreground">
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}

function Key({ label, faded = false }: { readonly label: string; readonly faded?: boolean }) {
  return (
    <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
      <span className={faded ? "size-2 rounded-full bg-brand/50" : "size-2 rounded-full bg-brand"} aria-hidden="true" />
      {label}
    </span>
  )
}

function Pill({
  Icon,
  value,
  onValue,
  options,
}: {
  readonly Icon: LucideIcon
  readonly value: string
  readonly onValue: (value: string) => void
  readonly options: readonly { value: string; label: string }[]
}) {
  // Base UI reads labels for the trigger off `items`, not off the children.
  const items = Object.fromEntries(options.map((o) => [o.value, o.label]))

  return (
    <Select items={items} value={value} onValueChange={(v) => onValue(String(v))}>
      <SelectTrigger
        className="h-9 w-auto gap-2 rounded-full border-border bg-card px-3.5 text-[13px]"
        icon={<ChevronsUpDown className="pointer-events-none size-3.5 text-muted-foreground" />}
      >
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function Tile({
  label,
  Icon,
  points,
  delta,
}: {
  readonly label: string
  readonly Icon: LucideIcon
  readonly points: readonly { date: string; count: number }[]
  readonly delta: number | null
}) {
  const total = points.reduce((n, p) => n + p.count, 0)

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <SectionTitle Icon={Icon}>{label}</SectionTitle>
        <div className="flex items-end justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] leading-none font-semibold tabular-nums">{total.toLocaleString()}</span>
            {delta === null ? null : (
              <span
                className={
                  delta < 0
                    ? "text-[13px] font-medium text-red-600 tabular-nums"
                    : "text-[13px] font-medium text-emerald-600 tabular-nums"
                }
              >
                {delta > 0 ? "+" : ""}
                {delta}%
              </span>
            )}
          </div>
          <Sparkline points={points} />
        </div>
      </CardContent>
    </Card>
  )
}

function Sparkline({ points }: { readonly points: readonly { date: string; count: number }[] }) {
  // One bar per day gets unreadable past a week, so long ranges bucket down.
  const bars = bucket(
    points.map((p) => p.count),
    7
  )
  const peak = Math.max(...bars, 1)

  return (
    <div className="flex h-9 items-end gap-1" aria-hidden="true">
      {bars.map((value, index) => (
        <span
          key={index}
          className="w-2 rounded-[2px] bg-muted-foreground/20"
          style={{ height: `${Math.max((value / peak) * 100, 10)}%` }}
        />
      ))}
    </div>
  )
}

function bucket(values: readonly number[], into: number): number[] {
  if (values.length <= into) return [...values]

  const size = Math.ceil(values.length / into)
  const out: number[] = []
  for (let i = 0; i < values.length; i += size) {
    out.push(values.slice(i, i + size).reduce((n, v) => n + v, 0))
  }
  return out
}

function BarList({
  title,
  Icon,
  rows,
  total,
}: {
  readonly title: string
  readonly Icon: LucideIcon
  readonly rows: readonly TallyRow[]
  readonly total: number
}) {
  const peak = Math.max(...rows.map((r) => r.count), 1)

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <SectionTitle Icon={Icon}>{title}</SectionTitle>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No dossiers in this range.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {rows.map((row) => (
              <li key={row.label} className="flex flex-col gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="flex-1 truncate text-[15px]">{row.label}</span>
                  <span className="w-14 text-right text-[15px] text-muted-foreground tabular-nums">
                    {total === 0 ? "—" : `${Math.round((row.count / total) * 100)}%`}
                  </span>
                  <span className="w-10 text-right text-[15px] tabular-nums">{row.count.toLocaleString()}</span>
                </div>
                <div className="h-2.5 rounded-[3px] bg-muted">
                  <div className="h-full rounded-[3px] bg-brand" style={{ width: `${(row.count / peak) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

function rangeLabel(w: Window): string {
  return w.from === "0000-01-01" ? `Through ${longDate(w.to)}` : `${shortDate(w.from)} – ${longDate(w.to)}`
}
