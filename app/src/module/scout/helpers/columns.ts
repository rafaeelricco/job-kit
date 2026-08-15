export { COLUMNS, DEFAULT_COLUMNS, VIEWS, columnLabel, isView }
export type { ColumnId, View }

import type { SortKey } from "@/module/scout/helpers/select"

const COLUMNS = [
  "score",
  "company",
  "location",
  "salary",
  "seen",
  "status",
] as const

type ColumnId = (typeof COLUMNS)[number]

// Everything on by default; the dropdown only ever takes columns away.
const DEFAULT_COLUMNS: readonly ColumnId[] = COLUMNS

const LABELS: Readonly<Record<ColumnId, string>> = {
  score: "Score",
  company: "Company and role",
  location: "Location",
  salary: "Salary",
  seen: "Seen",
  status: "Status",
}

const columnLabel = (id: ColumnId): string => LABELS[id]

// Columns the table can sort by map onto a SortKey; the rest are display only.
export const COLUMN_SORT: Readonly<Partial<Record<ColumnId, SortKey>>> = {
  score: "score",
  company: "company",
  seen: "lastSeen",
  status: "status",
}

const VIEWS = ["table", "cards"] as const

type View = (typeof VIEWS)[number]

const isView = (raw: string): raw is View =>
  (VIEWS as readonly string[]).includes(raw)
