export { toFixPrompt }

import { assertNever } from "@/module/scout/result"
import type { ParseError } from "@/module/scout/types"

function toFixPrompt(root: string, gaps: readonly ParseError[]): string {
  const noun = gaps.length === 1 ? "dossier" : "dossiers"

  return [
    `${gaps.length} ${noun} in ${root}/scout/jobs failed to parse:`,
    "",
    ...gaps.map((gap) => `- ${gap.file} — at ${gap.at} — ${describe(gap.cause)}`),
    "",
    "Repair each file in place so it parses. Keep every fact exactly as written —",
    "do not invent, guess, or fill in values. If a required value is genuinely",
    "absent from the source, leave that file failing and say which one and why.",
  ].join("\n")
}

function describe(cause: ParseError["cause"]): string {
  switch (cause.kind) {
    case "frontmatter":
      return `frontmatter: ${cause.detail}`
    case "vocabulary":
      return `vocabulary: ${cause.field} got "${cause.got}"`
    case "section":
      return `section: missing ${cause.heading}`
    case "table":
      return `table: ${cause.detail}`
    case "date":
      return `date: ${cause.field} got "${cause.got}"`
    case "score-mismatch":
      return `score mismatch: frontmatter ${cause.frontmatter}, table ${cause.table}`
    default:
      return assertNever(cause)
  }
}
