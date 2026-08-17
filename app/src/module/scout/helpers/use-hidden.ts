export { useHidden }

import { useCallback, useMemo, useState } from "react"

// Browser-local only. Hiding a dossier never writes to the profile store on
// disk — it is a view preference for this browser.
const KEY = "job-kit:hidden"

const read = (): ReadonlySet<string> => {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw === null) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((v): v is string => typeof v === "string"))
  } catch {
    // Malformed JSON, or storage blocked entirely. Degrade to nothing hidden.
    return new Set()
  }
}

const write = (next: ReadonlySet<string>): void => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...next]))
  } catch {
    // Quota or a blocked store. The in-memory set still drives this session.
  }
}

function useHidden(): {
  readonly hidden: ReadonlySet<string>
  readonly hide: (files: readonly string[]) => void
  readonly restore: (files: readonly string[]) => void
  readonly clear: () => void
} {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(read)

  const apply = useCallback((next: ReadonlySet<string>): void => {
    write(next)
    setHidden(next)
  }, [])

  const hide = useCallback(
    (files: readonly string[]): void => {
      const next = new Set(hidden)
      for (const file of files) next.add(file)
      apply(next)
    },
    [hidden, apply]
  )

  const restore = useCallback(
    (files: readonly string[]): void => {
      const next = new Set(hidden)
      for (const file of files) next.delete(file)
      apply(next)
    },
    [hidden, apply]
  )

  const clear = useCallback((): void => {
    apply(new Set())
  }, [apply])

  return useMemo(() => ({ hidden, hide, restore, clear }), [hidden, hide, restore, clear])
}
