export { useStore }
export type { StoreState }

import type { Store } from "@/module/scout/types"
import { useEffect, useState } from "react"

type StoreState =
  | { readonly kind: "loading" }
  | { readonly kind: "failed"; readonly message: string }
  | { readonly kind: "loaded"; readonly store: Store }

// /api/store exists only under the dev server middleware. A static build has no
// backend, so the failure message has to say where the route comes from.
const SERVED_BY =
  "/api/store is served by the dev server middleware — run the dev server; " +
  "a static build has no backend."

function useStore(): StoreState {
  const [state, setState] = useState<StoreState>({ kind: "loading" })

  useEffect(() => {
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
  }, [])

  return state
}
