export { useStore, type StoreState }

import { useCallback, useEffect, useState } from "react"

import { toStore } from "@/module/scout/helpers/assemble-store"
import { loadHandle, readJobs, snapshotProbe, trashJobs } from "@/module/scout/helpers/fsa"
import { parseDossier } from "@/module/scout/parse-dossier"
import { err } from "@/module/scout/result"
import type { Result } from "@/module/scout/result"
import type { Store, TrashOpError, Trashed } from "@/module/scout/types"

type StoreState =
  | { readonly kind: "idle" }
  | { readonly kind: "loading" }
  | { readonly kind: "read-failed"; readonly detail: string }
  | { readonly kind: "loaded"; readonly store: Store }

type Settled = Exclude<StoreState, { readonly kind: "loading" }>

function useStore(enabled: boolean): {
  readonly state: StoreState
  readonly reload: () => void
  readonly trash: (files: readonly string[]) => Promise<Result<Trashed, TrashOpError>>
} {
  const [state, setState] = useState<Settled>({ kind: "idle" })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let ignore = false

    const load = async (): Promise<void> => {
      try {
        const loaded = await loadHandle()
        if (ignore) return
        if (loaded.kind === "err") {
          setState({ kind: "read-failed", detail: loaded.error })
          return
        }
        if (loaded.value === null) {
          setState({ kind: "read-failed", detail: "No folder handle stored" })
          return
        }
        const handle = loaded.value
        const files = await snapshotProbe(handle)
        const jobs = await readJobs(handle)
        if (ignore) return
        if (jobs.kind === "err") {
          setState({ kind: "read-failed", detail: jobs.error })
          return
        }
        const parsed = jobs.value.map(({ file, raw }) => parseDossier(file, raw))
        const generatedAt = new Date().toISOString().slice(0, 10)
        setState({ kind: "loaded", store: toStore(handle.name, generatedAt, files, parsed) })
      } catch (error) {
        if (ignore) return
        setState({ kind: "read-failed", detail: error instanceof Error ? error.message : String(error) })
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [enabled, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  const trash = useCallback(
    async (files: readonly string[]): Promise<Result<Trashed, TrashOpError>> => {
      const loaded = await loadHandle()
      if (loaded.kind === "err") return err({ kind: "failed", detail: loaded.error })
      if (loaded.value === null) return err({ kind: "stale" })
      const result = await trashJobs(loaded.value, files)
      if (result.kind === "ok") reload()
      return result
    },
    [reload]
  )

  return {
    state: enabled && state.kind === "idle" ? { kind: "loading" } : state,
    reload,
    trash,
  }
}
