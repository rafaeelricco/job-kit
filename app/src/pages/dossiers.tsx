export default DossiersPage

import { Briefcase } from "lucide-react"
import { useMemo, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/ui/copy"
import { DataTablePagination, comparator } from "@/components/ui/datatable"
import type { SortState } from "@/components/ui/datatable"
import { DossierCards, DossierSheet, DossierTable } from "@/module/scout/components/dossier"
import { FilterBar } from "@/module/scout/components/filter-bar"
import { OverviewCards } from "@/module/scout/components/overview-cards"
import { StoreGate } from "@/module/scout/components/store-gate"
import type { Ready } from "@/module/scout/components/store-gate"
import { DEFAULT_COLUMNS, DEFAULT_SORT, DOSSIER_COLUMNS } from "@/module/scout/helpers/columns"
import type { ColumnId, View } from "@/module/scout/helpers/columns"
import { EMPTY_FILTER, PAGE_SIZES, matches, paginate, summarize } from "@/module/scout/helpers/select"
import type { Filter } from "@/module/scout/helpers/select"
import { toFixPrompt } from "@/module/scout/helpers/fix-prompt"
import { useHidden } from "@/module/scout/helpers/use-hidden"
import type { ParseError } from "@/module/scout/types"

const PAGE_SIZE = PAGE_SIZES[0]

function DossiersPage() {
  return (
    <StoreGate title="Dossiers" Icon={Briefcase}>
      {(store) => <Surface store={store} />}
    </StoreGate>
  )
}

function Surface({ store }: { readonly store: Ready }) {
  const [filter, setFilter] = useState<Filter>(EMPTY_FILTER)
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)
  const [page, setPage] = useState(1)
  const [columns, setColumns] = useState<readonly ColumnId[]>(DEFAULT_COLUMNS)
  const [view, setView] = useState<View>("table")
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [open, setOpen] = useState<string | null>(null)
  const { hidden, hide, clear } = useHidden()

  const visible = useMemo(() => store.dossiers.filter(matches(filter, hidden)), [store.dossiers, filter, hidden])
  const ordered = useMemo(() => visible.slice().sort(comparator(DOSSIER_COLUMNS, sort)), [visible, sort])
  const current = paginate(ordered, page, PAGE_SIZE)
  // Store-wide, not filter-scoped: these are a standing overview, and the
  // filtered count already has its own line under the toolbar.
  const summary = useMemo(() => summarize(store.dossiers), [store.dossiers])

  const selectedRows = store.dossiers.filter((d) => selected.has(d.file))
  const openDossier = store.dossiers.find((d) => d.file === open) ?? null

  const onFilter = (next: Filter) => {
    setFilter(next)
    setPage(1)
  }

  const onSort = (next: SortState) => {
    setSort(next)
    setPage(1)
  }

  const onToggle = (file: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(file)) next.delete(file)
      else next.add(file)
      return next
    })

  const onToggleAll = () =>
    setSelected((prev) => {
      const all = current.rows.every((row) => prev.has(row.file))
      const next = new Set(prev)
      for (const row of current.rows) {
        if (all) next.delete(row.file)
        else next.add(row.file)
      }
      return next
    })

  const onHideOne = (file: string) => hide([file])

  return (
    <>
      <OverviewCards summary={summary} />

      <FilterBar
        filter={filter}
        onFilter={onFilter}
        view={view}
        onView={setView}
        columns={columns}
        onColumns={setColumns}
        total={store.dossiers.length}
        shown={visible.length}
      />

      {hidden.size === 0 ? null : (
        <p className="text-sm text-muted-foreground">
          {hidden.size.toLocaleString()} hidden in this browser ·{" "}
          <Button variant="link" className="h-auto p-0" onClick={clear}>
            Restore
          </Button>
        </p>
      )}

      {view === "table" ? (
        <DossierTable
          rows={current.rows}
          columns={columns}
          sort={sort}
          onSort={onSort}
          selected={selected}
          onToggle={onToggle}
          onToggleAll={onToggleAll}
          onOpen={setOpen}
          onHide={onHideOne}
        />
      ) : (
        <DossierCards rows={current.rows} selected={selected} onToggle={onToggle} onOpen={setOpen} />
      )}

      <DataTablePagination
        page={current.page}
        pages={current.pages}
        onPage={setPage}
        status={`${selectedRows.length} of ${visible.length} row(s) selected.`}
      />

      <Gaps gaps={store.gaps} root={store.root} />

      <footer className="font-mono text-xs text-muted-foreground">
        {store.dossiers.length.toLocaleString()} dossiers · {store.gaps.length.toLocaleString()} gaps · view of{" "}
        {store.root}
        /scout/jobs · resolved via {store.via} · generated {store.generatedAt}
      </footer>

      <DossierSheet dossier={openDossier} onClose={() => setOpen(null)} />
    </>
  )
}

// A file that does not parse is named, never repaired here — the button hands
// the repair off with every cause spelled out.
function Gaps({ gaps, root }: { readonly gaps: readonly ParseError[]; readonly root: string }) {
  if (gaps.length === 0) return null

  return (
    <Alert>
      <AlertTitle>{gaps.length.toLocaleString()} files did not parse</AlertTitle>
      <AlertDescription>
        <ul className="my-2 space-y-1 font-mono text-xs">
          {gaps.map((gap) => (
            <li key={gap.file}>
              {gap.file} · {gap.cause.kind} at {gap.at}
            </li>
          ))}
        </ul>
        <CopyButton value={() => toFixPrompt(root, gaps)} label="Copy fix prompt" />
      </AlertDescription>
    </Alert>
  )
}
