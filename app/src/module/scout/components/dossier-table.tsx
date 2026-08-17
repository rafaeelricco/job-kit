export { DossierTable, type DossierTableProps }

import { MoreHorizontal } from "lucide-react"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable, columnDef } from "@/components/ui/datatable"
import type { ColumnsConfig, SortState } from "@/components/ui/datatable"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ColumnId } from "@/module/scout/helpers/columns"
import { COLUMNS, DOSSIER_COLUMNS } from "@/module/scout/helpers/columns"
import { httpHref } from "@/module/scout/helpers/href"
import { assertNever } from "@/module/scout/result"
import type { Dossier } from "@/module/scout/types"
import { factText } from "@/module/scout/types"

type DossierTableProps = {
  readonly rows: readonly Dossier[]
  readonly columns: readonly ColumnId[]
  readonly sort: SortState
  readonly onSort: (next: SortState) => void
  readonly selected: ReadonlySet<string>
  readonly onToggle: (file: string) => void
  readonly onToggleAll: () => void
  readonly onOpen: (file: string) => void
  readonly onHide: (file: string) => void
}

// Variants come from badge.tsx; there is no "success" there, so 9+ takes the
// solid default and the tint steps down from it.
const scoreVariant = (value: number): "default" | "secondary" | "outline" =>
  value >= 9 ? "default" : value >= 7 ? "secondary" : "outline"

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
          <div className="max-w-[18rem] min-w-0">
            <div className="truncate font-medium text-foreground">
              {row.company}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {row.title}
            </div>
          </div>
        )
      case "location":
        return (
          <span className="block max-w-56 truncate">
            {factText(row.facts.location)}
          </span>
        )
      case "salary":
        return (
          <span className="block max-w-56 truncate">
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

  const columns = {
    select: columnDef<Dossier>({
      className: "w-10",
      sortFun: null,
      label: (
        <Checkbox
          checked={allSelected}
          onCheckedChange={() => props.onToggleAll()}
          aria-label="Select all visible dossiers"
        />
      ),
    }),
    ...DOSSIER_COLUMNS,
    actions: columnDef<Dossier>({
      label: "",
      sortFun: null,
      className: "w-10",
    }),
  } satisfies ColumnsConfig<Dossier>

  return (
    <DataTable
      columns={columns}
      columnOrder={["select", ...visible, "actions"]}
      sort={props.sort}
      onSortChange={props.onSort}
      emptyMessage={
        <>
          <p className="text-sm font-medium text-foreground">
            No dossiers match
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Clear a filter to widen the set.
          </p>
        </>
      }
      rows={props.rows.map((row) => ({
        key: row.file,
        value: row,
        selected: props.selected.has(row.file),
        onClick: (d: Dossier) => props.onOpen(d.file),
        contents: {
          // The wrapper eats the click so ticking a box never also
          // opens the dossier behind it.
          select: (
            <span
              className="inline-flex"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <Checkbox
                checked={props.selected.has(row.file)}
                onCheckedChange={() => props.onToggle(row.file)}
                aria-label={`Select ${row.company}`}
              />
            </span>
          ),
          score: cell("score", row),
          company: cell("company", row),
          location: cell("location", row),
          salary: cell("salary", row),
          seen: cell("seen", row),
          status: cell("status", row),
          actions: (
            <RowActions row={row} onOpen={props.onOpen} onHide={props.onHide} />
          ),
        },
      }))}
    />
  )
}

function RowActions(props: {
  readonly row: Dossier
  readonly onOpen: (file: string) => void
  readonly onHide: (file: string) => void
}) {
  const href = httpHref(props.row.url)
  return (
    <span
      className="inline-flex"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => props.onOpen(props.row.file)}>
              Open dossier
            </DropdownMenuItem>
            {href === null || props.row.posting.kind === "dead" ? null : (
              <DropdownMenuItem
                onClick={() =>
                  window.open(href, "_blank", "noopener,noreferrer")
                }
              >
                Open posting
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() =>
                void navigator.clipboard.writeText(props.row.company)
              }
            >
              Copy company
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => props.onHide(props.row.file)}>
              Hide
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  )
}
