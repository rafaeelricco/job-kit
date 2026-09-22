export { ProtectedRoute, SessionPending }

import { type ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { sessionGate } from "@module/session/session"
import { useSession } from "@module/session/helpers/use-session"
import { returnState } from "@module/session/helpers/return-to"

function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  const gate = sessionGate(useSession())
  switch (gate) {
    case "pending":
      return <SessionPending />
    case "anonymous":
      return <Navigate to="/sign-in" replace state={returnState(location)} />
    case "signed-in":
      return children
    default: {
      const _exhaustiveCheck: never = gate
      throw new Error(`Unknown: ${JSON.stringify(_exhaustiveCheck)}`)
    }
  }
}

function SessionPending() {
  return (
    <div className="flex h-dvh items-center justify-center text-sm text-muted-foreground">Checking your session…</div>
  )
}
