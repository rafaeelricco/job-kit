export { Dashboard }

import { useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import {
  Activity,
  CalendarDays,
  ChevronsUpDown,
  GitBranch,
  Globe,
  Layers,
  Send,
  Star,
  Target,
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
  appliedDates,
  deltaPct,
  foundDates,
  isHighScore,
  isLive,
  pairedSeries,
  seriesOf,
  sourceSeries,
  tallyBy,
  windowOf,
} from "@/module/scout/helpers/analytics"
import type { PairedPoint, RangeKey, TallyRow, Window } from "@/module/scout/helpers/analytics"
import { CHANNELS, LIFECYCLES } from "@/module/scout/types"
import type { Channel, Dossier } from "@/module/scout/types"

const ALL_CHANNELS = "all"

const CHANNEL_LABELS: Record<Channel, string> = {
  direct_email: "Direct email",
  dm_request: "DM request",
  founder: "Founder",
  ats: "ATS",
}

const TILES = [
  { key: "high", label: "Score 8+", Icon: Star, pick: isHighScore },
  {
    key: "ready",
    label: "Ready to apply",
    Icon: Target,
    pick: (d: Dossier) => d.status === "new" && isHighScore(d) && isLive(d),
  },
  {
    key: "play",
    label: "In play",
    Icon: Activity,
    pick: (d: Dossier) => d.status === "applied" || d.status === "interview" || d.status === "offer",
  },
] as const

const CHART: ChartConfig = {
  count: { label: "This period", color: "var(--color-brand)" },
  prior: { label: "Previous", color: "var(--color-brand)" },
}

// The reference separates its series with shades of one hue, not a rainbow, and
// this palette is a single brand blue over neutrals — `--chart-1..5` are all
// zero-chroma. Mixing toward theme tokens keeps the ramp readable in both
// themes. The last shade is grey, reserved for the folded "other" bucket.
const SOURCE_COLORS = [
  "var(--color-brand)",
  "color-mix(in oklab, var(--color-brand) 62%, var(--color-foreground))",
  "color-mix(in oklab, var(--color-brand) 45%, var(--color-card))",
  "color-mix(in oklab, var(--color-brand) 35%, var(--color-muted-foreground))",
  "var(--color-muted-foreground)",
] as const

const SOURCE_LIMIT = SOURCE_COLORS.length - 1

const colorOf = (index: number) => SOURCE_COLORS[index] ?? "var(--color-muted-foreground)"

// Source ids are their own labels and the strokes come from SOURCE_COLORS, so
// the container needs no config entries — and none get emitted as CSS vars.
const SOURCE_CHART: ChartConfig = {}

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

  const trend = useMemo(() => pairedSeries(scoped, current, baseline, foundDates), [scoped, current, baseline])
  const applications = useMemo(() => pairedSeries(scoped, current, baseline, appliedDates), [scoped, current, baseline])
  const sources = useMemo(() => sourceSeries(scoped, current, SOURCE_LIMIT), [scoped, current])
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

      <div className="grid gap-4 sm:grid-cols-3">
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

      <TrendCard title="Dossiers over time" Icon={TrendingUp} points={trend} current={current} baseline={baseline} />

      <Card>
        <CardContent className="flex flex-col gap-4">
          <SectionTitle Icon={Globe}>Sources over time</SectionTitle>

          {sources.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No dossiers in this range.</p>
          ) : (
            <>
              <ChartContainer config={SOURCE_CHART} className="h-64 w-full">
                <LineChart data={[...sources.points]} margin={{ left: -16, right: 8 }}>
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
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(label) => (typeof label === "string" ? shortDate(label) : label)}
                      />
                    }
                  />
                  {sources.rows.map((row, index) => (
                    <Line
                      key={row.label}
                      dataKey={row.label}
                      type="monotone"
                      stroke={colorOf(index)}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ChartContainer>

              <div className="flex flex-wrap items-center justify-center gap-6">
                {sources.rows.map((row, index) => (
                  <Key key={row.label} label={row.label} color={colorOf(index)} count={row.count} />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <TrendCard
          title="Applications over time"
          Icon={Send}
          points={applications}
          current={current}
          baseline={baseline}
        />
        <BarList title="Pipeline" Icon={GitBranch} rows={pipeline} total={total} />
      </div>
    </>
  )
}

// The reference underlines every section heading with a dotted rule that spans
// the icon and the text, and never shouts it in uppercase.
function SectionTitle({ Icon, children }: { readonly Icon: LucideIcon; readonly children: ReactNode }) {
  return (
    <div className="flex w-fit items-center gap-2 text-[15px] text-muted-foreground">
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}

function Key({ label, color, count }: { readonly label: string; readonly color: string; readonly count?: number }) {
  return (
    <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {label}
      {count === undefined ? null : <span className="text-foreground tabular-nums">{count.toLocaleString()}</span>}
    </span>
  )
}

// Two panels want the same card: a heading, the range total in 28px, a compare
// line under it. The only differences are the title, the icon, and the series.
function TrendCard({
  title,
  Icon,
  points,
  current,
  baseline,
}: {
  readonly title: string
  readonly Icon: LucideIcon
  readonly points: readonly PairedPoint[]
  readonly current: Window
  readonly baseline: Window | null
}) {
  const total = points.reduce((n, p) => n + p.count, 0)

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <SectionTitle Icon={Icon}>{title}</SectionTitle>
          <p className="text-[28px] leading-none font-semibold tabular-nums">{total.toLocaleString()}</p>
        </div>

        <ChartContainer config={CHART} className="h-64 w-full">
          <LineChart data={[...points]} margin={{ left: -16, right: 8 }}>
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
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => (typeof label === "string" ? shortDate(label) : label)}
                  formatter={(value, name, item) => {
                    const isPrior = name === "prior"
                    const priorDate =
                      isPrior && typeof item.payload?.priorDate === "string"
                        ? ` · ${shortDate(item.payload.priorDate)}`
                        : ""
                    return (
                      <div className="flex w-full items-center gap-2">
                        <div className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
                        <span className="flex-1 text-muted-foreground">
                          {isPrior ? "Previous" : "This period"}
                          {priorDate}
                        </span>
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {typeof value === "number" ? value.toLocaleString() : String(value)}
                        </span>
                      </div>
                    )
                  }}
                />
              }
            />
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
          <Key label={rangeLabel(current)} color="var(--color-brand)" />
          {baseline === null ? null : (
            <Key label={rangeLabel(baseline)} color="color-mix(in oklab, var(--color-brand) 50%, var(--color-card))" />
          )}
        </div>
      </CardContent>
    </Card>
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
          className="w-2 rounded-xs bg-muted-foreground/20"
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
