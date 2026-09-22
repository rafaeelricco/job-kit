export { SessionRoot }

import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import { Just } from "@lib/maybe"
import { Failed, Loading, NotAsked } from "@lib/remote-data"
import {
  ANONYMOUS,
  getSession,
  reloadSession,
  subscribeToSessionUpdates,
  type SessionInfo,
} from "@module/session/session"
import { SessionContext } from "@module/session/helpers/use-session"

/** The only React owner of `SessionInfo`: a cached user renders at once while `whoAmI` revalidates. */
function SessionRoot() {
  const [session, setSession] = useState<SessionInfo>(() => ({
    current: getSession().withDefault(ANONYMOUS),
    next: Loading(),
  }))

  useEffect(() => {
    // Every write (reload, sign-in, sign-out, another tab) lands here, so the reload's success needs no handler.
    const unsubscribe = subscribeToSessionUpdates((m) =>
      setSession({ current: m.withDefault(ANONYMOUS), next: NotAsked() })
    )
    const cancel = reloadSession().fork(
      (error) => setSession((prev) => ({ current: prev.current, next: Failed(error) })),
      () => {}
    )
    return () => {
      cancel()
      unsubscribe()
    }
  }, [])

  return (
    <SessionContext value={Just(session)}>
      <Outlet />
    </SessionContext>
  )
}
