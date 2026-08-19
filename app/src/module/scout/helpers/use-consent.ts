export { useConsent }

import { useCallback, useState } from "react"

// Browser-local. Only a grant is ever written: a decline leaves nothing
// behind, so the next visit asks again.
const KEY = "job-kit:store-consent"
const GRANTED = "granted"

const read = (): boolean => {
  try {
    return window.localStorage.getItem(KEY) === GRANTED
  } catch {
    // Storage blocked entirely. Ask again rather than assume a grant.
    return false
  }
}

function useConsent(): {
  readonly granted: boolean
  readonly grant: () => void
} {
  const [granted, setGranted] = useState(read)

  const grant = useCallback((): void => {
    try {
      window.localStorage.setItem(KEY, GRANTED)
    } catch {
      // Quota or a blocked store. This session still proceeds.
    }
    setGranted(true)
  }, [])

  return { granted, grant }
}
