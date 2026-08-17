export { DossierCards, type DossierCardsProps }

import type { KeyboardEvent } from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import type { Dossier } from "@/module/scout/types"
import { factText } from "@/module/scout/types"

type DossierCardsProps = {
  readonly rows: readonly Dossier[]
  readonly selected: ReadonlySet<string>
  readonly onToggle: (file: string) => void
  readonly onOpen: (file: string) => void
}

// Same tinting rule as the table; badge.tsx has no success variant, so 9+
// takes the solid default.
const scoreVariant = (value: number): "default" | "secondary" | "outline" =>
  value >= 9 ? "default" : value >= 7 ? "secondary" : "outline"

const monogram = (company: string): string =>
  company
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()

function DossierCards(props: DossierCardsProps) {
  const onBodyKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    file: string
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return
    event.preventDefault()
    props.onOpen(file)
  }

  if (props.rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <p className="text-sm font-medium text-foreground">No dossiers match</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Clear a filter to widen the set.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {props.rows.map((row) => {
        const isSelected = props.selected.has(row.file)
        return (
          <Card key={row.file} data-state={isSelected ? "selected" : undefined}>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-3">
                  <Avatar size="sm">
                    <AvatarFallback>{monogram(row.company)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-foreground">
                      {row.company}
                    </div>
                    <div className="truncate text-xs font-normal text-muted-foreground">
                      {row.title}
                    </div>
                  </div>
                </div>
              </CardTitle>
              <CardAction>
                {/* Eats the click so ticking a box never also opens the
                    dossier behind it. */}
                <span
                  className="inline-flex"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => props.onToggle(row.file)}
                    aria-label={`Select ${row.company}`}
                  />
                </span>
              </CardAction>
            </CardHeader>
            <CardContent
              role="button"
              tabIndex={0}
              aria-label={`Open ${row.company}`}
              onClick={() => props.onOpen(row.file)}
              onKeyDown={(event) => onBodyKeyDown(event, row.file)}
              className="cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                {row.score.kind === "unscored" ? (
                  <Badge variant="outline">
                    {factText({ kind: "unknown" })}
                  </Badge>
                ) : (
                  <Badge variant={scoreVariant(row.score.value)}>
                    {row.score.value}
                  </Badge>
                )}
                <Badge variant="secondary">{row.status}</Badge>
                {row.posting.kind === "dead" ? (
                  <Badge variant="destructive">dead</Badge>
                ) : null}
              </div>
              <dl className="mt-3 grid gap-1 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="shrink-0 text-muted-foreground">Location</dt>
                  <dd className="truncate text-foreground">
                    {factText(row.facts.location)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="shrink-0 text-muted-foreground">Salary</dt>
                  <dd className="truncate text-foreground">
                    {factText(row.facts.salary)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
