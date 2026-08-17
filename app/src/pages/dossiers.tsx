export default DossiersPage

import { useMemo, useState } from "react"
import type { ReactNode } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ConsentDialog } from "@/module/scout/components/consent-dialog"
import { DossierCards } from "@/module/scout/components/dossier-cards"
import { DossierSheet } from "@/module/scout/components/dossier-sheet"
import { DossierTable } from "@/module/scout/components/dossier-table"
import { FilterBar } from "@/module/scout/components/filter-bar"
import { OverviewCards } from "@/module/scout/components/overview-cards"
import { PermissionEmpty } from "@/module/scout/components/permission-empty"
import { SelectionBar } from "@/module/scout/components/selection-bar"
import { DEFAULT_COLUMNS } from "@/module/scout/helpers/columns"
import type { ColumnId, View } from "@/module/scout/helpers/columns"
import {
  DEFAULT_SORT,
  EMPTY_FILTER,
  PAGE_SIZES,
  matches,
  paginate,
  sortBy,
  summarize,
} from "@/module/scout/helpers/select"
import type { Filter, Sort, SortKey } from "@/module/scout/helpers/select"
import { useConsent } from "@/module/scout/helpers/use-consent"
import { useHidden } from "@/module/scout/helpers/use-hidden"
import { useStore } from "@/module/scout/helpers/use-store"
import type { StoreState } from "@/module/scout/helpers/use-store"
import { assertNever } from "@/module/scout/result"
import type { Attempt, ParseError, Store } from "@/module/scout/types"

const PAGE_SIZE = PAGE_SIZES[0]

function DossiersPage() {
  const { granted, grant } = useConsent()
  // Dismissing the dialog is not a dead end — the empty state reopens it.
  const [asking, setAsking] = useState(true)
  const state = useStore(granted)

  return (
    <>
      <Body state={state} onAsk={() => setAsking(true)} onAllow={grant} />
      <ConsentDialog
        open={!granted && asking}
        onOpenChange={setAsking}
        onAllow={grant}
      />
    </>
  )
}

function Body({
  state,
  onAsk,
  onAllow,
}: {
  readonly state: StoreState
  readonly onAsk: () => void
  readonly onAllow: () => void
}) {
  switch (state.kind) {
    case "idle":
      return <PermissionEmpty onAllow={onAllow} onReview={onAsk} />
    case "loading":
      return (
        <Shell>
          <div className="space-y-3">
            {Array.from({ length: 8 }, (_, row) => (
              <Skeleton key={row} className="h-14 w-full" />
            ))}
          </div>
        </Shell>
      )
    case "failed":
      return (
        <Shell>
          <Alert variant="destructive">
            <AlertTitle>Could not reach the store</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        </Shell>
      )
    case "loaded":
      return <Loaded store={state.store} />
    default:
      return assertNever(state)
  }
}

function Shell({ children }: { readonly children: ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">{children}</div>
    </div>
  )
}

function Loaded({ store }: { readonly store: Store }) {
  switch (store.kind) {
    case "unresolved":
      return (
        <Shell>
          <Unresolved attempts={store.attempts} />
        </Shell>
      )
    case "ready":
      return <Surface store={store} />
    default:
      return assertNever(store)
  }
}

// The skills require every attempt be named on STOP, then a handoff to
// job-profile-init. This is that report, not a generic error.
function Unresolved({ attempts }: { readonly attempts: readonly Attempt[] }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>No profile root resolved</AlertTitle>
      <AlertDescription>
        <ul className="my-2 space-y-1 font-mono text-xs">
          {attempts.map((attempt) => (
            <li key={`${attempt.source}:${attempt.path ?? ""}`}>
              {attempt.source} · {attempt.path ?? "—"} · {attempt.outcome.kind}
              {attempt.line === null ? "" : ` · line "${attempt.line}"`}
            </li>
          ))}
        </ul>
        Create one with <code>job-profile-init</code>, or register an existing
        profile with Activate = Yes.
      </AlertDescription>
    </Alert>
  )
}

function Surface({
  store,
}: {
  readonly store: Extract<Store, { kind: "ready" }>
}) {
  const [filter, setFilter] = useState<Filter>(EMPTY_FILTER)
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT)
  const [page, setPage] = useState(1)
  const [columns, setColumns] = useState<readonly ColumnId[]>(DEFAULT_COLUMNS)
  const [view, setView] = useState<View>("table")
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [open, setOpen] = useState<string | null>(null)
  const { hidden, hide, clear } = useHidden()

  const visible = useMemo(
    () => store.dossiers.filter(matches(filter, hidden)),
    [store.dossiers, filter, hidden]
  )
  const ordered = useMemo(
    () => visible.slice().sort(sortBy(sort)),
    [visible, sort]
  )
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

  const onSort = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" }
    )

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

  const onHide = () => {
    hide(selectedRows.map((row) => row.file))
    setSelected(new Set())
  }

  return (
    <Shell>
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
        />
      ) : (
        <DossierCards
          rows={current.rows}
          selected={selected}
          onToggle={onToggle}
          onOpen={setOpen}
        />
      )}

      <Pager
        page={current.page}
        pages={current.pages}
        onPage={setPage}
        hidden={hidden.size}
        onRestore={clear}
      />

      <Gaps gaps={store.gaps} />

      <footer className="font-mono text-xs text-muted-foreground">
        {store.dossiers.length.toLocaleString()} dossiers ·{" "}
        {store.gaps.length.toLocaleString()} gaps · read-only view of{" "}
        {store.root}/scout/jobs · resolved via {store.via} · generated{" "}
        {store.generatedAt}
      </footer>

      <SelectionBar
        rows={selectedRows}
        onHide={onHide}
        onClear={() => setSelected(new Set())}
      />

      <DossierSheet dossier={openDossier} onClose={() => setOpen(null)} />
    </Shell>
  )
}

function Pager({
  page,
  pages,
  onPage,
  hidden,
  onRestore,
}: {
  readonly page: number
  readonly pages: number
  readonly onPage: (next: number) => void
  readonly hidden: number
  readonly onRestore: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {hidden === 0 ? null : (
          <>
            {hidden.toLocaleString()} hidden in this browser ·{" "}
            <Button variant="link" className="h-auto p-0" onClick={onRestore}>
              Restore
            </Button>
          </>
        )}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Page {page} of {pages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

// A file that does not parse is named, never repaired.
function Gaps({ gaps }: { readonly gaps: readonly ParseError[] }) {
  if (gaps.length === 0) return null

  return (
    <Alert>
      <AlertTitle>
        {gaps.length.toLocaleString()} files did not parse
      </AlertTitle>
      <AlertDescription>
        <ul className="my-2 space-y-1 font-mono text-xs">
          {gaps.map((gap) => (
            <li key={gap.file}>
              {gap.file} · {gap.cause.kind} at {gap.at}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
