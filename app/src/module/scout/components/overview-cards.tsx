export { OverviewCards }
export type { OverviewCardsProps }

import type { LucideIcon } from "lucide-react"
import { CircleCheckBig, Files, Radio, Star } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

type OverviewCardsProps = {
  readonly summary: {
    readonly total: number
    readonly highScore: number
    readonly applied: number
    readonly live: number
  }
}

type Tile = {
  readonly label: string
  readonly value: number
  readonly Icon: LucideIcon
}

// Read-only display. No handlers, no links, nothing focusable — a tile that
// looks pressable but does nothing is worse than a tile that looks inert.
function OverviewCards(props: OverviewCardsProps) {
  const { summary } = props
  const tiles: readonly Tile[] = [
    { label: "Total dossiers", value: summary.total, Icon: Files },
    { label: "Score 8+", value: summary.highScore, Icon: Star },
    { label: "Applied", value: summary.applied, Icon: CircleCheckBig },
    { label: "Live postings", value: summary.live, Icon: Radio },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label}>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <tile.Icon className="size-4" aria-hidden="true" />
              <span>{tile.label}</span>
            </div>
            <span className="text-2xl font-semibold text-foreground tabular-nums">
              {tile.value.toLocaleString()}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
