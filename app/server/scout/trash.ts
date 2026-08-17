export { trashDossiers }

import fs from "node:fs/promises"
import path from "node:path"

import { err, ok, partition } from "../../src/module/scout/result"
import type { Result } from "../../src/module/scout/result"
import type { TrashFailure, Trashed } from "../../src/module/scout/types"
import { resolveProfileRoot } from "./resolve"

const JOBS = ["scout", "jobs"] as const
const TRASH = ".trash"

async function trashDossiers(env: NodeJS.ProcessEnv, cwd: string, files: readonly string[]): Promise<Trashed> {
  const resolution = resolveProfileRoot(env, cwd)
  if (resolution.kind === "unresolved") throw new Error("no profile root")

  const dir = path.resolve(path.join(resolution.root, ...JOBS))
  const trash = path.join(dir, TRASH)
  await fs.mkdir(trash, { recursive: true })

  const results = await Promise.all(files.map((file) => moveToTrash(dir, trash, file)))
  const { values, errors } = partition(results)

  return { moved: values, failed: errors }
}

// One file, one Result. A rejected name and a failed rename are the same kind
// of outcome to the caller, so neither throws.
async function moveToTrash(dir: string, trash: string, file: string): Promise<Result<string, TrashFailure>> {
  const from = confine(dir, file)
  if (from === null) return err({ file, reason: "not a dossier name" })

  try {
    await fs.rename(from, await freeName(trash, file))
    return ok(file)
  } catch (error) {
    return err({ file, reason: String(error) })
  }
}

// The first untrusted input this server has taken. A dossier is a bare `*.md`
// name in the jobs dir — anything shaped like a path, or that escapes the dir
// once resolved, is refused rather than repaired.
function confine(dir: string, file: string): string | null {
  if (path.basename(file) !== file) return null
  if (!file.endsWith(".md")) return null
  const full = path.resolve(dir, file)
  return full.startsWith(dir + path.sep) ? full : null
}

// rename() overwrites silently, which would erase an earlier trashed file of
// the same name. Suffix instead of clobbering.
async function freeName(trash: string, file: string): Promise<string> {
  const target = path.join(trash, file)
  try {
    await fs.access(target)
    return path.join(trash, `${file.slice(0, -".md".length)}-${Date.now()}.md`)
  } catch {
    return target
  }
}
