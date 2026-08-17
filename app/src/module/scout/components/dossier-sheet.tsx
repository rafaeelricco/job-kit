export { DossierSheet, type DossierSheetProps }

import type * as React from "react"
import { ExternalLinkIcon, TriangleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import type { Dossier } from "@/module/scout/types"
import { FACT_KEYS, factText } from "@/module/scout/types"

type DossierSheetProps = {
  readonly dossier: Dossier | null
  readonly onClose: () => void
}

// Posting URLs come from the corpus, so only the two navigable schemes get an
// anchor; anything else is shown as plain text.
function httpHref(raw: string): string | null {
  try {
    const parsed = new URL(raw)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? raw
      : null
  } catch {
    return null
  }
}

function Section(props: {
  readonly title: string
  readonly children: React.ReactNode
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

function Row(props: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex justify-between gap-4 py-0.5 text-sm">
      <dt className="shrink-0 text-muted-foreground">{props.label}</dt>
      <dd className="text-right break-words">{props.value}</dd>
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
                    <Row
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
                  <Row label="Source" value={dossier.provenance.source} />
                  <Row
                    label="Author"
                    value={factText(dossier.provenance.author)}
                  />
                  <Row
                    label="Contact"
                    value={factText(dossier.provenance.contact)}
                  />
                  {/* Free text in the corpus — printed exactly as written. */}
                  <Row label="Date" value={dossier.provenance.date} />
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
