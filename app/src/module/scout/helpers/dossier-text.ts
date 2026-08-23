export { toDossierText }

import type { Dossier } from "@/module/scout/types"
import { FACT_KEYS, factText } from "@/module/scout/types"

// Mirrors DossierSheet in its own reading order. The exporters in export.ts
// project a fixed column set for a list; this one is the whole of one job,
// which is what the sheet shows and what a copy is expected to carry.
function toDossierText(d: Dossier): string {
  const total = d.score.kind === "scored" ? String(d.score.value) : factText({ kind: "unknown" })

  return [
    `# ${d.company} — ${d.title}`,
    `${d.host} · ${d.url}`,
    ...(d.posting.kind === "dead" ? ["", `Posting marked dead since ${d.posting.since}.`] : []),
    "",
    "## Verdict",
    d.verdict.why,
    ...d.verdict.factors.map((factor) => `- ${factor.label}: ${factText(factor.points)}`),
    `- Total: ${total}`,
    "",
    "## Posting facts",
    ...FACT_KEYS.map((key) => `- ${key}: ${factText(d.facts[key])}`),
    "",
    "## From the posting",
    d.excerpt.kind === "printed" ? d.excerpt.text : "Not printed",
    "",
    "## Provenance",
    `- Source: ${d.provenance.source}`,
    `- Author: ${factText(d.provenance.author)}`,
    `- Contact: ${factText(d.provenance.contact)}`,
    `- Date: ${d.provenance.date}`,
    "",
    "## Application log",
    ...(d.log.length === 0
      ? ["No entries"]
      : d.log.map((entry) => `- ${entry.date} — ${entry.event} (${entry.writer})`)),
    // The sheet says the same thing at its foot: these live in the file below
    // the log and the parser never reads them.
    ...(d.applications > 0
      ? ["", `${d.applications.toLocaleString()} application record${d.applications === 1 ? "" : "s"} not parsed here.`]
      : []),
  ].join("\n")
}
