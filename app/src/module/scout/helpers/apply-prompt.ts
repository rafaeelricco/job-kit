export { toApplyPrompt }

import { httpHref } from "@/module/scout/helpers/href"
import { assertNever } from "@/module/scout/result"
import { type Dossier } from "@/module/scout/types"

type Apply = { readonly kind: "apply"; readonly row: Dossier }
type Skip = { readonly kind: "skip"; readonly row: Dossier; readonly reasons: readonly string[] }
type Classified = Apply | Skip

function toApplyPrompt(root: string, skills: string, rows: readonly Dossier[]): string {
  const queued = rows.map(classify)
  return joinBlocks([
    applyBlock(`${root}/scout/jobs`, skills, rows.length, queued.filter(isApply)),
    skipBlock(queued.filter(isSkip)),
  ])
}

const isApply = (item: Classified): item is Apply => item.kind === "apply"
const isSkip = (item: Classified): item is Skip => item.kind === "skip"

function classify(row: Dossier): Classified {
  const reasons = skipReasons(row)
  return reasons.length === 0 ? { kind: "apply", row } : { kind: "skip", row, reasons }
}

// Skills are addressed by absolute path, not by slash command: the prompt is
// pasted into a chat that has no notion of this app's working directory.
function skillLinks(skills: string) {
  return {
    apply: `[$Job Apply](${skills}/job-apply/SKILL.md)`,
    list: `[$Job List](${skills}/job-list/SKILL.md)`,
    profile: `[$Job Profile Me](${skills}/job-profile-me/SKILL.md)`,
  }
}

function applyBlock(jobs: string, skills: string, selected: number, apply: readonly Apply[]): readonly string[] {
  const links = skillLinks(skills)
  const closer =
    `use the ${links.list} to consult the data of each and also the ${links.profile} ` +
    "and make sure to write concise and high signal texts/histories to increase the chance for I get return from the job."
  return apply.length === 0
    ? [`0 of ${selected} selected jobs under ${jobs} are apply-ready.`]
    : [
        `Use the ${links.apply} skill to apply for all of these jobs under ${jobs}:`,
        "",
        ...apply.map((item) => line(item.row)),
        "",
        closer,
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

// Same gate as Open posting: only http(s) is something job-apply can open.
function urlReason(url: string): readonly string[] {
  return httpHref(url) === null ? ["url is not http(s)"] : []
}
