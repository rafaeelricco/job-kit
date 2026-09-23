export { ProtectedRoute }

import { type ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { Loading } from "@lib/remote-data"
import { type SessionInfo } from "@module/session/session"
import { returnState } from "@module/session/helpers/return-to"

/** A cached user never waits; an anonymous visitor waits one round trip instead of bouncing to /sign-in early. */
function ProtectedRoute({ session, children }: { session: SessionInfo; children: ReactNode }) {
  const location = useLocation()

  if (session.current.type !== "User" && session.next instanceof Loading) {
    return <SessionPending />
  }

  if (session.current.type !== "User") {
    return <Navigate to="/sign-in" replace state={returnState(location)} />
  }

  return children
}

function SessionPending() {
  return (
    <div className="flex h-dvh items-center justify-center text-sm text-muted-foreground">Checking your session…</div>
  )
}
