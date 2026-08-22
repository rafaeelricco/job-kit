export { toApplyPrompt }

import { httpHref } from "@/module/scout/helpers/href"
import { assertNever } from "@/module/scout/result"
import { type Dossier } from "@/module/scout/types"

type Apply = { readonly kind: "apply"; readonly row: Dossier }
type Skip = { readonly kind: "skip"; readonly row: Dossier; readonly reasons: readonly string[] }
type Classified = Apply | Skip

// Clipboard for Aside / any coding agent. Slash skills; profile via /job-profile-root
// (never a browser folder basename). job-apply is one posting at a time.
function toApplyPrompt(rows: readonly Dossier[]): string {
  const queued = rows.map(classify)
  return joinBlocks([applyBlock(rows.length, queued.filter(isApply)), skipBlock(queued.filter(isSkip))])
}

const isApply = (item: Classified): item is Apply => item.kind === "apply"
const isSkip = (item: Classified): item is Skip => item.kind === "skip"

function classify(row: Dossier): Classified {
  const reasons = skipReasons(row)
  return reasons.length === 0 ? { kind: "apply", row } : { kind: "skip", row, reasons }
}

function applyBlock(selected: number, apply: readonly Apply[]): readonly string[] {
  if (apply.length === 0) {
    return [selected === 1 ? `0 of 1 selected is apply-ready.` : `0 of ${selected} selected are apply-ready.`]
  }
  const intro =
    selected === 1
      ? [
          "/job-apply this posting.",
          "Resolve paths with /job-profile-root. STOP if scout/jobs/{file} is missing there.",
          "Use /job-list when you need dossier facts from disk.",
        ]
      : [
          "/job-apply each posting below, one at a time.",
          "Resolve paths with /job-profile-root. STOP if scout/jobs/{file} is missing there.",
          "Use /job-list when you need dossier facts from disk.",
        ]
  return [...intro, "", ...apply.map((item) => line(item.row))]
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
  return [...statusReason(row), ...postingReason(row.posting), ...urlReason(row.url)]
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

function urlReason(url: string): readonly string[] {
  return httpHref(url) === null ? ["url is not http(s)"] : []
}
