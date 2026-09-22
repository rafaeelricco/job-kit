export { SessionContext, useSession }

import { createContext, useContext } from "react"
import { Nothing, type Maybe } from "@lib/maybe"
import { type SessionInfo } from "@module/session/session"

const SessionContext = createContext<Maybe<SessionInfo>>(Nothing())

function useSession(): SessionInfo {
  // Only reachable by mounting a consumer outside SessionRoot: a programmer error, so `expect` is the right throw.
  return useContext(SessionContext).expect("useSession must be used below SessionRoot")
}
