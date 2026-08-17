export { useStore, type StoreState }

import type { Store } from "@/module/scout/types"
import { useCallback, useEffect, useState } from "react"

type StoreState =
  | { readonly kind: "idle" }
  | { readonly kind: "loading" }
  | { readonly kind: "failed"; readonly message: string }
  | { readonly kind: "loaded"; readonly store: Store }

// /api/store exists only under the dev server middleware. A static build has no
// backend, so the failure message has to say where the route comes from.
const SERVED_BY =
  "/api/store is served by the dev server middleware — run the dev server; " + "a static build has no backend."

// Loading is never stored — it is exactly "enabled, with nothing back yet", so
// deriving it keeps the effect free of a synchronous setState.
type Settled = Exclude<StoreState, { readonly kind: "loading" }>

// Nothing is fetched until `enabled`. The request is the only thing that reads
// the profile store, so an ungranted page has touched no file on disk.
function useStore(enabled: boolean): {
  readonly state: StoreState
  readonly reload: () => void
} {
  const [state, setState] = useState<Settled>({ kind: "idle" })
  // Bumped after a write, to refetch without dropping back to a skeleton.
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let ignore = false

    const load = async (): Promise<void> => {
      try {
        const response = await fetch("/api/store")
        if (!response.ok) {
          if (!ignore) {
            setState({
              kind: "failed",
              message: `/api/store responded ${response.status} ${response.statusText}. ${SERVED_BY}`,
            })
          }
          return
        }
        const store = (await response.json()) as Store
        if (!ignore) setState({ kind: "loaded", store })
      } catch (error) {
        if (ignore) return
        const detail = error instanceof Error ? error.message : String(error)
        setState({
          kind: "failed",
          message: `Could not reach /api/store: ${detail}. ${SERVED_BY}`,
        })
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [enabled, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  return {
    state: enabled && state.kind === "idle" ? { kind: "loading" } : state,
    reload,
  }
}
