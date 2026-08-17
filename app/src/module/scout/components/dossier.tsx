export { DossierCards, DossierSheet, DossierTable }

import {
  ExternalLinkIcon,
  MoreHorizontal,
  TriangleAlertIcon,
} from "lucide-react"
import type { KeyboardEvent, ReactNode } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ColumnDef, DataTable } from "@/components/ui/datatable"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ColumnId } from "@/module/scout/helpers/columns"
import { COLUMNS, DOSSIER_COLUMNS } from "@/module/scout/helpers/columns"
import { httpHref } from "@/module/scout/helpers/href"
import { assertNever } from "@/module/scout/result"
import type { Dossier } from "@/module/scout/types"
import { FACT_KEYS, factText } from "@/module/scout/types"

/* -- shared pieces -------------------------------------------------------- */

// Variants come from badge.tsx; there is no "success" there, so 9+ takes the
// solid default and the tint steps down from it.
const scoreVariant = (value: number): "default" | "secondary" | "outline" =>
  value >= 9 ? "default" : value >= 7 ? "secondary" : "outline"

function ScoreBadge({ score }: { readonly score: Dossier["score"] }) {
  return score.kind === "unscored" ? (
    <Badge variant="outline">{factText({ kind: "unknown" })}</Badge>
  ) : (
    <Badge variant={scoreVariant(score.value)}>{score.value}</Badge>
  )
}

function StatusBadges({ row }: { readonly row: Dossier }) {
  return (
    <>
      <Badge variant="secondary">{row.status}</Badge>
      {row.posting.kind === "dead" ? (
        <Badge variant="destructive">dead</Badge>
      ) : null}
    </>
  )
}

// Eats the click so ticking a box or opening a menu never also opens the
// dossier behind it.
function StopClick({ children }: { readonly children: ReactNode }) {
  return (
    <span
      className="inline-flex"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {children}
    </span>
  )
}

function SelectBox(props: {
  readonly row: Dossier
  readonly selected: boolean
  readonly onToggle: (file: string) => void
}) {
  return (
    <StopClick>
      <Checkbox
        checked={props.selected}
        onCheckedChange={() => props.onToggle(props.row.file)}
        aria-label={`Select ${props.row.company}`}
      />
    </StopClick>
  )
}

function EmptyNote() {
  return (
    <>
      <p className="text-sm font-medium text-foreground">No dossiers match</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Clear a filter to widen the set.
      </p>
    </>
  )
}

/* -- table ---------------------------------------------------------------- */

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
        return <ScoreBadge score={row.score} />
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
            <StatusBadges row={row} />
          </div>
        )
      default:
        return assertNever(id)
    }
  }

  const columns = {
    select: new ColumnDef({
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
    actions: new ColumnDef({
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
      emptyMessage={<EmptyNote />}
      rows={props.rows.map((row) => ({
        key: row.file,
        value: row,
        selected: props.selected.has(row.file),
        onClick: (d: Dossier) => props.onOpen(d.file),
        contents: {
          select: (
            <SelectBox
              row={row}
              selected={props.selected.has(row.file)}
              onToggle={props.onToggle}
            />
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
    <StopClick>
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
    </StopClick>
  )
}

/* -- cards ---------------------------------------------------------------- */

type DossierCardsProps = {
  readonly rows: readonly Dossier[]
  readonly selected: ReadonlySet<string>
  readonly onToggle: (file: string) => void
  readonly onOpen: (file: string) => void
}

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
        <EmptyNote />
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
                <div className="min-w-0">
                  <div className="truncate font-medium text-foreground">
                    {row.company}
                  </div>
                  <div className="truncate text-xs font-normal text-muted-foreground">
                    {row.title}
                  </div>
                </div>
              </CardTitle>
              <CardAction>
                <SelectBox
                  row={row}
                  selected={isSelected}
                  onToggle={props.onToggle}
                />
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
                <ScoreBadge score={row.score} />
                <StatusBadges row={row} />
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

/* -- sheet ---------------------------------------------------------------- */

type DossierSheetProps = {
  readonly dossier: Dossier | null
  readonly onClose: () => void
}

function Section(props: {
  readonly title: string
  readonly children: ReactNode
}) {
  return (
    <section className="border-b border-border px-4 py-4 last:border-b-0">
      <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {props.title}
      </h3>
      {props.children}
    </section>
  )
}

function LabelRow(props: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex justify-between gap-4 py-0.5 text-sm">
      <dt className="shrink-0 text-muted-foreground">{props.label}</dt>
      <dd className="text-right wrap-break-words">{props.value}</dd>
    </div>
  )
}

function DossierSheet(props: DossierSheetProps) {
  const { dossier, onClose } = props

  return (
    <Sheet
      open={dossier !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent className="gap-0 p-0 data-[side=right]:sm:max-w-xl">
        {dossier !== null && (
          <>
            <SheetHeader className="gap-1 border-b border-border px-4 py-4 pr-12">
              <SheetTitle>{dossier.company}</SheetTitle>
              <SheetDescription>{dossier.title}</SheetDescription>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
                <span>{dossier.host}</span>
                {httpHref(dossier.url) === null ? (
                  <span className="break-all">{dossier.url}</span>
                ) : (
                  <a
                    href={dossier.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-foreground underline underline-offset-2"
                  >
                    Open posting
                    <ExternalLinkIcon className="size-3" />
                  </a>
                )}
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto">
              {dossier.posting.kind === "dead" && (
                <div className="px-4 pt-4">
                  <Alert variant="destructive">
                    <TriangleAlertIcon />
                    <AlertTitle>Posting marked dead</AlertTitle>
                    <AlertDescription>
                      This posting was marked dead since {dossier.posting.since}
                      .
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <Section title="Verdict">
                <p className="text-sm">{dossier.verdict.why}</p>
                <dl className="mt-3">
                  {dossier.verdict.factors.map((factor, index) => (
                    <LabelRow
                      key={`${String(index)}-${factor.label}`}
                      label={factor.label}
                      value={factText(factor.points)}
                    />
                  ))}
                  <div className="mt-1 flex justify-between gap-4 border-t border-border pt-1 text-sm font-medium">
                    <dt>Total</dt>
                    <dd className="tabular-nums">
                      {dossier.score.kind === "scored"
                        ? String(dossier.score.value)
                        : factText({ kind: "unknown" })}
                    </dd>
                  </div>
                </dl>
              </Section>

              <Section title="Posting facts">
                <Table>
                  <TableBody>
                    {FACT_KEYS.map((key) => (
                      <TableRow key={key}>
                        <TableCell className="w-40 align-top text-muted-foreground">
                          {key}
                        </TableCell>
                        <TableCell className="align-top whitespace-normal">
                          {factText(dossier.facts[key])}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Section>

              <Section title="From the posting">
                {dossier.excerpt.kind === "printed" ? (
                  <blockquote className="border-l-2 border-border pl-3 text-sm whitespace-pre-wrap text-muted-foreground">
                    {dossier.excerpt.text}
                  </blockquote>
                ) : (
                  <p className="text-sm text-muted-foreground">Not printed</p>
                )}
              </Section>

              <Section title="Provenance">
                <dl>
                  <LabelRow label="Source" value={dossier.provenance.source} />
                  <LabelRow
                    label="Author"
                    value={factText(dossier.provenance.author)}
                  />
                  <LabelRow
                    label="Contact"
                    value={factText(dossier.provenance.contact)}
                  />
                  {/* Free text in the corpus — printed exactly as written. */}
                  <LabelRow label="Date" value={dossier.provenance.date} />
                </dl>
              </Section>

              <Section title="Application log">
                {dossier.log.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No entries</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">Date</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead className="w-32">Writer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dossier.log.map((entry, index) => (
                        <TableRow key={`${String(index)}-${entry.date}`}>
                          <TableCell className="align-top">
                            {entry.date}
                          </TableCell>
                          <TableCell className="align-top whitespace-normal">
                            {entry.event}
                          </TableCell>
                          <TableCell className="align-top text-muted-foreground">
                            {entry.writer}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Section>

              {dossier.applications > 0 && (
                <p className="px-4 py-4 text-xs text-muted-foreground">
                  {dossier.applications.toLocaleString()} application record
                  {dossier.applications === 1 ? "" : "s"} live below the log in
                  the file itself and are not parsed here.
                </p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
