export { toApplyPrompt }

import { assertNever } from "@/module/scout/result"
import { type Dossier } from "@/module/scout/types"

type Apply = { readonly kind: "apply"; readonly row: Dossier }
type Skip = { readonly kind: "skip"; readonly row: Dossier; readonly reasons: readonly string[] }
type Classified = Apply | Skip

function toApplyPrompt(root: string, rows: readonly Dossier[]): string {
  const queued = rows.map(classify)
  return joinBlocks([
    applyBlock(`${root}/scout/jobs`, rows.length, queued.filter(isApply)),
    skipBlock(queued.filter(isSkip)),
  ])
}

const isApply = (item: Classified): item is Apply => item.kind === "apply"
const isSkip = (item: Classified): item is Skip => item.kind === "skip"

function classify(row: Dossier): Classified {
  const reasons = skipReasons(row)
  return reasons.length === 0 ? { kind: "apply", row } : { kind: "skip", row, reasons }
}

function applyBlock(jobs: string, selected: number, apply: readonly Apply[]): readonly string[] {
  return apply.length === 0
    ? [`0 of ${selected} selected jobs under ${jobs} are apply-ready.`]
    : [
        "Use /job-apply for each Apply job, in listed order. Start the next job",
        "only after the current one is recorded, or after I say skip. Do not",
        "apply to Skip. Do not add a job that is not listed.",
        "",
        "Apply:",
        ...apply.map((item) => line(item.row)),
      ]
}

function skipBlock(skip: readonly Skip[]): readonly string[] {
  return skip.length === 0 ? [] : ["Skip:", ...skip.map((item) => `${line(item.row)} — ${item.reasons.join("; ")}`)]
}

function joinBlocks(blocks: readonly (readonly string[])[]): string {
  return blocks
    .filter((block) => block.length > 0)
    .map((block) => block.join("\n"))
    .join("\n\n")
}

function line(row: Dossier): string {
  return `- scout/jobs/${row.file} — ${row.company} — ${row.title} — ${row.url}`
}

function skipReasons(row: Dossier): readonly string[] {
  return [...statusReason(row), ...postingReason(row.posting)]
}

function statusReason(row: Dossier): readonly string[] {
  return row.status === "new" ? [] : [`status is ${row.status}`]
}

function postingReason(posting: Dossier["posting"]): readonly string[] {
  switch (posting.kind) {
    case "live":
      return []
    case "dead":
      return [`posting dead since ${posting.since}`]
    default:
      return assertNever(posting)
  }
}
