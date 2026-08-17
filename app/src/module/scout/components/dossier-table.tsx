export { DossierTable, type DossierTableProps }

import { ChevronDown, ChevronUp } from "lucide-react"
import type { KeyboardEvent, ReactNode } from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ColumnId } from "@/module/scout/helpers/columns"
import {
  COLUMNS,
  COLUMN_SORT,
  columnLabel,
} from "@/module/scout/helpers/columns"
import type { Sort, SortKey } from "@/module/scout/helpers/select"
import { assertNever } from "@/module/scout/result"
import type { Dossier } from "@/module/scout/types"
import { factText } from "@/module/scout/types"

type DossierTableProps = {
  readonly rows: readonly Dossier[]
  readonly columns: readonly ColumnId[]
  readonly sort: Sort
  readonly onSort: (key: SortKey) => void
  readonly selected: ReadonlySet<string>
  readonly onToggle: (file: string) => void
  readonly onToggleAll: () => void
  readonly onOpen: (file: string) => void
}

// Variants come from badge.tsx; there is no "success" there, so 9+ takes the
// solid default and the tint steps down from it.
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

const ariaSort = (
  sort: Sort,
  key: SortKey | undefined
): "ascending" | "descending" | "none" | undefined => {
  if (key === undefined) return undefined
  if (sort.key !== key) return "none"
  return sort.dir === "asc" ? "ascending" : "descending"
}

function DossierTable(props: DossierTableProps) {
  // COLUMNS drives the order so a reshuffled `columns` prop cannot scramble
  // the header/cell pairing.
  const visible = COLUMNS.filter((id) => props.columns.includes(id))
  const allSelected =
    props.rows.length > 0 &&
    props.rows.every((row) => props.selected.has(row.file))

  const cell = (id: ColumnId, row: Dossier): ReactNode => {
    switch (id) {
      case "score":
        return row.score.kind === "unscored" ? (
          <Badge variant="outline">{factText({ kind: "unknown" })}</Badge>
        ) : (
          <Badge variant={scoreVariant(row.score.value)}>
            {row.score.value}
          </Badge>
        )
      case "company":
        return (
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              <AvatarFallback>{monogram(row.company)}</AvatarFallback>
            </Avatar>
            <div className="max-w-[18rem] min-w-0">
              <div className="truncate font-medium text-foreground">
                {row.company}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {row.title}
              </div>
            </div>
          </div>
        )
      case "location":
        return (
          <span className="block max-w-[14rem] truncate">
            {factText(row.facts.location)}
          </span>
        )
      case "salary":
        return (
          <span className="block max-w-[14rem] truncate">
            {factText(row.facts.salary)}
          </span>
        )
      case "seen":
        return (
          <div>
            <div className="text-foreground tabular-nums">{row.lastSeen}</div>
            <div className="text-xs text-muted-foreground tabular-nums">
              {row.firstSeen}
            </div>
          </div>
        )
      case "status":
        return (
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary">{row.status}</Badge>
            {row.posting.kind === "dead" ? (
              <Badge variant="destructive">dead</Badge>
            ) : null}
          </div>
        )
      default:
        return assertNever(id)
    }
  }

  const onRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    file: string
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return
    event.preventDefault()
    props.onOpen(file)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={allSelected}
              onCheckedChange={() => props.onToggleAll()}
              aria-label="Select all visible dossiers"
            />
          </TableHead>
          {visible.map((id) => {
            const key = COLUMN_SORT[id]
            return (
              <TableHead key={id} aria-sort={ariaSort(props.sort, key)}>
                {key === undefined ? (
                  columnLabel(id)
                ) : (
                  <button
                    type="button"
                    onClick={() => props.onSort(key)}
                    className="-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 text-foreground outline-none hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <span>{columnLabel(id)}</span>
                    {props.sort.key === key ? (
                      props.sort.dir === "asc" ? (
                        <ChevronUp className="size-3.5" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="size-3.5" aria-hidden="true" />
                      )
                    ) : null}
                  </button>
                )}
              </TableHead>
            )
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={visible.length + 1}
              className="h-32 text-center whitespace-normal"
            >
              <p className="text-sm font-medium text-foreground">
                No dossiers match
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Clear a filter to widen the set.
              </p>
            </TableCell>
          </TableRow>
        ) : (
          props.rows.map((row) => {
            const isSelected = props.selected.has(row.file)
            return (
              <TableRow
                key={row.file}
                tabIndex={0}
                aria-selected={isSelected}
                data-state={isSelected ? "selected" : undefined}
                onClick={() => props.onOpen(row.file)}
                onKeyDown={(event) => onRowKeyDown(event, row.file)}
                className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <TableCell>
                  {/* The wrapper eats the click so ticking a box never also
                      opens the dossier behind it. */}
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
                </TableCell>
                {visible.map((id) => (
                  <TableCell key={id}>{cell(id, row)}</TableCell>
                ))}
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}
