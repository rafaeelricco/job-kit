export { useProfile, type ProfileState, type Save }

import { useCallback, useEffect, useState } from "react"

import { loadHandle } from "@/module/access/handle"
import { notifyProfileChanged } from "@/module/profile/helpers/profile-events"
import { readProfile } from "@/module/profile/helpers/read-profile"
import { readDoc, writeDoc } from "@/module/profile/helpers/write-profile"
import type { Edit, SaveError } from "@/module/profile/helpers/write-profile"
import type { Profile } from "@/module/profile/types"
import { err, ok } from "@/module/scout/result"
import type { Result } from "@/module/scout/result"

type ProfileState =
  | { readonly kind: "loading" }
  | { readonly kind: "read-failed"; readonly detail: string }
  | { readonly kind: "loaded"; readonly profile: Profile }

type Save = (file: string, edits: readonly Edit[]) => Promise<Result<void, SaveError>>

// No `enabled` argument, unlike useStore: ProfileGate only mounts this below a
// granted AccessGate, so the handle is already proven reachable.
function useProfile(): { readonly state: ProfileState; readonly save: Save } {
  const [state, setState] = useState<ProfileState>({ kind: "loading" })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
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
        const profile = await readProfile(loaded.value)
        if (ignore) return
        setState({ kind: "loaded", profile })
      } catch (error) {
        if (ignore) return
        setState({ kind: "read-failed", detail: error instanceof Error ? error.message : String(error) })
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [nonce])

  // The document is re-read at save time rather than held across renders: the
  // mtime the write is checked against must be the one on disk now, not the one
  // from page load.
  const save = useCallback(async (file: string, edits: readonly Edit[]): Promise<Result<void, SaveError>> => {
    const handle = await loadHandle()
    if (handle.kind === "err" || handle.value === null) return err({ kind: "stale", file })
    const loaded = await readDoc(handle.value, file)
    if (loaded.kind === "err") return loaded
    const written = await writeDoc(handle.value, file, loaded.value, edits)
    if (written.kind === "err") return written
    setNonce((n) => n + 1)
    // basics.yaml also feeds the sidebar's identity, which lives above this
    // hook's tree and cannot see the nonce.
    notifyProfileChanged()
    return ok(undefined)
  }, [])

  return { state, save }
}
