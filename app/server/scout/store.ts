export { loadStore }

import fs from "node:fs/promises"
import path from "node:path"

import { err, partition } from "../../src/module/scout/result"
import type { Store } from "../../src/module/scout/types"
import { parseDossier } from "./parse-dossier"
import { resolveAsideSkillsRoot, resolveProfileRoot } from "./resolve"

const JOBS = ["scout", "jobs"] as const

async function loadStore(env: NodeJS.ProcessEnv, cwd: string): Promise<Store> {
  const resolution = resolveProfileRoot(env, cwd)
  if (resolution.kind === "unresolved") return resolution

  const dir = path.join(resolution.root, ...JOBS)
  const names = await listJobs(dir)
  const parsed = await Promise.all(
    names.map(async (name) => {
      try {
        return parseDossier(name, await fs.readFile(path.join(dir, name), "utf8"))
      } catch (error) {
        return err({
          file: name,
          at: "read",
          cause: { kind: "unreadable" as const, detail: String(error) },
        })
      }
    })
  )
  const { values, errors } = partition(parsed)

  return {
    kind: "ready",
    root: resolution.root,
    skillsRoot: resolveAsideSkillsRoot(env),
    via: resolution.via,
    attempts: resolution.attempts,
    generatedAt: new Date().toISOString().slice(0, 10),
    dossiers: values,
    gaps: errors,
  }
}

// Absence means nothing has been persisted yet, which is a legitimate empty
// store. A denied read is not: it would report zero jobs for a profile that
// holds hundreds, so it rejects.
async function listJobs(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir)
    return entries.filter((name) => name.endsWith(".md")).sort()
  } catch (error) {
    if (isMissing(error)) return []
    throw error
  }
}

const isMissing = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
