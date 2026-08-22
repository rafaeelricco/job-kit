export { toStore }

import { probe } from "@/module/scout/helpers/probe"
import type { ProbeFiles } from "@/module/scout/helpers/probe"
import { partition } from "@/module/scout/result"
import type { ParsedDossier, Store } from "@/module/scout/types"

function toStore(label: string, generatedAt: string, files: ProbeFiles, parsed: readonly ParsedDossier[]): Store {
  const checked = probe(files)
  if (checked.kind === "failed") {
    return { kind: "wrong-root", label, missing: checked.missing }
  }
  const { values, errors } = partition(parsed)
  return { kind: "ready", label, generatedAt, dossiers: values, gaps: errors }
}
