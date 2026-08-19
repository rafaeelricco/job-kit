export default DossiersPage

import { Briefcase } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DataTablePagination, comparator } from "@/components/ui/datatable"
import type { SortState } from "@/components/ui/datatable"
import { DossierCards, DossierSheet, DossierTable } from "@/module/scout/components/dossier"
import { FilterBar } from "@/module/scout/components/filter-bar"
import { Gaps } from "@/module/scout/components/gaps"
import { OverviewCards } from "@/module/scout/components/overview-cards"
import { SelectionBar } from "@/module/scout/components/selection-bar"
import { StoreGate } from "@/module/scout/components/store-gate"
import type { Ready } from "@/module/scout/components/store-gate"
import { DEFAULT_COLUMNS, DEFAULT_SORT, DOSSIER_COLUMNS } from "@/module/scout/helpers/columns"
import type { ColumnId, View } from "@/module/scout/helpers/columns"
import { EMPTY_FILTER, PAGE_SIZES, matches, paginate, summarize, tallySources } from "@/module/scout/helpers/select"
import type { Filter } from "@/module/scout/helpers/select"
import { trashDossiers } from "@/module/scout/helpers/trash"

const PAGE_SIZE = PAGE_SIZES[0]

function DossiersPage() {
  return (
    <StoreGate title="Dossiers" Icon={Briefcase}>
      {(store, reload) => <Surface store={store} onReload={reload} />}
    </StoreGate>
  )
}

function Surface({ store, onReload }: { readonly store: Ready; readonly onReload: () => void }) {
  const [filter, setFilter] = useState<Filter>(EMPTY_FILTER)
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)
  const [page, setPage] = useState(1)
  const [columns, setColumns] = useState<readonly ColumnId[]>(DEFAULT_COLUMNS)
  const [view, setView] = useState<View>("table")
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [open, setOpen] = useState<string | null>(null)

  const visible = useMemo(() => store.dossiers.filter(matches(filter)), [store.dossiers, filter])
  const ordered = useMemo(() => visible.slice().sort(comparator(DOSSIER_COLUMNS, sort)), [visible, sort])
  const current = paginate(ordered, page, PAGE_SIZE)
  // Store-wide, not filter-scoped: these are a standing overview, and the
  // filtered count already has its own line under the toolbar.
  const summary = useMemo(() => summarize(store.dossiers), [store.dossiers])
  const sources = useMemo(() => tallySources(store.dossiers), [store.dossiers])

  const selectedRows = visible.filter((d) => selected.has(d.file))
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

  // Ticking the header box takes the page, not the filter — the offer to widen
  // it to every match only appears once the page itself is fully ticked.
  const pageFull = current.rows.length > 0 && current.rows.every((row) => selected.has(row.file))
  const onSelectMatching = () => setSelected(new Set(visible.map((row) => row.file)))

  // One request for both callers: the toolbar sends the selection, the row menu
  // sends a single file.
  const trash = (files: readonly string[]) => {
    void trashDossiers(store.root, files).then((result) => {
      if (result.kind === "err") {
        toast.error(result.error)
        return
      }
      const { moved, failed } = result.value
      const noun = moved.length === 1 ? "dossier" : "dossiers"
      toast.success(`Moved ${moved.length} ${noun} to scout/jobs/.trash`)
      for (const failure of failed) {
        toast.error(`${failure.file}: ${failure.reason}`)
      }
      setSelected(new Set())
      onReload()
    })
  }

  const onDelete = () => trash(selectedRows.map((row) => row.file))
  const onDeleteOne = (file: string) => trash([file])

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
        sources={sources}
        total={store.dossiers.length}
        shown={visible.length}
      />

      {view === "table" ? (
        <DossierTable
          rows={current.rows}
          root={store.root}
          skillsRoot={store.skillsRoot}
          columns={columns}
          sort={sort}
          onSort={onSort}
          selected={selected}
          onToggle={onToggle}
          onToggleAll={onToggleAll}
          onOpen={setOpen}
          onDelete={onDeleteOne}
        />
      ) : (
        <DossierCards rows={current.rows} selected={selected} onToggle={onToggle} onOpen={setOpen} />
      )}

      <DataTablePagination
        page={current.page}
        pages={current.pages}
        onPage={setPage}
        status={
          <span className="flex flex-wrap items-center gap-1">
            {selectedRows.length.toLocaleString()} of {visible.length.toLocaleString()} row(s) selected.
            {pageFull && selectedRows.length < visible.length ? (
              <Button variant="link" className="h-auto p-0" onClick={onSelectMatching}>
                Select all {visible.length.toLocaleString()} matching
              </Button>
            ) : null}
          </span>
        }
      />

      <Gaps gaps={store.gaps} root={store.root} />

      <footer className="font-mono text-xs text-muted-foreground">
        {store.dossiers.length.toLocaleString()} dossiers · {store.gaps.length.toLocaleString()} gaps · view of{" "}
        {store.root}
        /scout/jobs · resolved via {store.via} · generated {store.generatedAt}
      </footer>

      <SelectionBar
        root={store.root}
        skillsRoot={store.skillsRoot}
        rows={selectedRows}
        onDelete={onDelete}
        onClear={() => setSelected(new Set())}
      />

      <DossierSheet dossier={openDossier} onClose={() => setOpen(null)} />
    </>
  )
}
