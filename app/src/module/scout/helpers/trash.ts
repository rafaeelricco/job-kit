export { trashDossiers }

import { err, ok } from "@/module/scout/result"
import type { Result } from "@/module/scout/result"
import type { Trashed } from "@/module/scout/types"

async function trashDossiers(files: readonly string[]): Promise<Result<Trashed, string>> {
  try {
    const response = await fetch("/api/trash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files }),
    })
    if (!response.ok) {
      return err(`/api/trash responded ${response.status} ${response.statusText}`)
    }
    return ok((await response.json()) as Trashed)
  } catch (error) {
    return err(error instanceof Error ? error.message : String(error))
  }
}
