import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react"
import type { Key, KeyboardEvent, ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type SortFun<T> = (a: T, b: T) => number

// `sortFun: null` marks a column unsortable — selection and action columns.
type ColumnDef<T> = {
  readonly label: ReactNode
  readonly sortFun: SortFun<T> | null
  readonly align?: "left" | "right"
  readonly className?: string
}

type ColumnsConfig<T> = { readonly [key: string]: ColumnDef<T> }

// An identity function, but one that pins T so `sortFun` gets checked against
// the row type at the definition site instead of at the call to DataTable.
const columnDef = <T,>(values: ColumnDef<T>): ColumnDef<T> => values

type Row<T, C extends ColumnsConfig<T>> = {
  readonly key: Key
  readonly value: T
  readonly className?: string
  readonly selected?: boolean
  readonly contents: { readonly [K in keyof C]: ReactNode }
  readonly onClick?: (value: T) => void
}

// Deliberately not generic over the columns map. Keying `column` to `keyof C`
// makes `onSortChange` contravariant, so a handler typed over the domain
// columns stops being assignable once `select`/`actions` widen `C`.
type SortState =
  | { readonly sorting: "increasing"; readonly column: string }
  | { readonly sorting: "decreasing"; readonly column: string }
  | { readonly sorting: "unsorted"; readonly column: null }

type DataTableProps<T, C extends ColumnsConfig<T>> = {
  readonly columns: C
  readonly columnOrder: readonly (keyof C)[]
  readonly rows: readonly Row<T, C>[]
  readonly emptyMessage: ReactNode
  readonly sort: SortState
  readonly onSortChange: (next: SortState) => void
}

const keepOrder: SortFun<unknown> = () => 0

// The caller applies this — DataTable renders the header state and emits the
// next one, it never reorders rows itself. An unknown or unsortable column
// degrades to store order rather than throwing.
function comparator<T>(columns: ColumnsConfig<T>, sort: SortState): SortFun<T> {
  if (sort.sorting === "unsorted") return keepOrder
  const sortFun = columns[sort.column]?.sortFun
  if (sortFun === undefined || sortFun === null) return keepOrder
  return sort.sorting === "increasing" ? sortFun : (a, b) => -sortFun(a, b)
}

// A fresh column starts ascending; the active one steps to descending, then off.
function cycle(current: SortState, column: string): SortState {
  if (current.column !== column) return { sorting: "increasing", column }
  if (current.sorting === "increasing") return { sorting: "decreasing", column }
  return { sorting: "unsorted", column: null }
}

type ColumnSort = "none" | "increasing" | "decreasing"

const ariaSort = (state: ColumnSort | null) =>
  state === null
    ? undefined
    : state === "none"
      ? ("none" as const)
      : state === "increasing"
        ? ("ascending" as const)
        : ("descending" as const)

function SortableHeader(props: {
  readonly label: ReactNode
  readonly state: ColumnSort | null
  readonly onSort: () => void
}): ReactNode {
  if (props.state === null) return props.label
  return (
    <Button variant="ghost" onClick={props.onSort}>
      {props.label}
      {props.state === "increasing" ? (
        <ChevronUp />
      ) : props.state === "decreasing" ? (
        <ChevronDown />
      ) : (
        <ArrowUpDown />
      )}
    </Button>
  )
}

function DataTable<T, C extends ColumnsConfig<T>>(props: DataTableProps<T, C>) {
  const { columnOrder, columns, emptyMessage, onSortChange, rows, sort } = props

  const onRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    row: Row<T, C>
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return
    event.preventDefault()
    row.onClick?.(row.value)
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columnOrder.map((id) => {
              const column = columns[id]
              if (column === undefined) return null
              const state: ColumnSort | null =
                column.sortFun === null
                  ? null
                  : sort.column !== String(id)
                    ? "none"
                    : sort.sorting === "increasing"
                      ? "increasing"
                      : "decreasing"
              return (
                <TableHead
                  key={String(id)}
                  aria-sort={ariaSort(state)}
                  className={cn(
                    column.align === "right" && "text-right",
                    column.className
                  )}
                >
                  <SortableHeader
                    label={column.label}
                    state={state}
                    onSort={() => onSortChange(cycle(sort, String(id)))}
                  />
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columnOrder.length}
                className="h-32 text-center whitespace-normal"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.key}
                tabIndex={row.onClick === undefined ? undefined : 0}
                aria-selected={row.selected}
                data-state={row.selected === true ? "selected" : undefined}
                onClick={() => row.onClick?.(row.value)}
                onKeyDown={(event) => onRowKeyDown(event, row)}
                className={cn(
                  row.onClick !== undefined &&
                    "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  row.className
                )}
              >
                {columnOrder.map((id) => (
                  <TableCell
                    key={String(id)}
                    className={cn(
                      columns[id]?.align === "right" && "text-right"
                    )}
                  >
                    {row.contents[id]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function DataTablePagination(props: {
  readonly page: number
  readonly pages: number
  readonly onPage: (next: number) => void
  readonly status?: ReactNode
}) {
  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <div className="flex-1 text-sm text-muted-foreground">{props.status}</div>
      <div className="space-x-2">
        <Button
          variant="outline"
          size="sm"
          disabled={props.page <= 1}
          onClick={() => props.onPage(props.page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={props.page >= props.pages}
          onClick={() => props.onPage(props.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export { DataTable, DataTablePagination, columnDef, comparator }
export type { ColumnDef, ColumnsConfig, DataTableProps, Row, SortState }
