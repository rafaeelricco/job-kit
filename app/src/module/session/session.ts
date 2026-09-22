export {
  getSession,
  subscribeToSessionUpdates,
  reloadSession,
  signIn,
  signUp,
  signOut,
  sessionGate,
  type Session,
  type SessionInfo,
  type SessionGate,
  ANONYMOUS,
}

import * as s from "@lib/json/schema"
import { toast } from "sonner"
import { Future } from "@lib/future"
import { Just, Nothing, fromNullable, type Maybe } from "@lib/maybe"
import { Loading, type RemoteData } from "@lib/remote-data"
import { call, type FetchError } from "@lib/request"
import { clearHandle } from "@module/access/handle"
import { type Actor, type UserActor, schema_actor } from "@be/app/actor"
import { endpoint as whoAmI } from "@be/domain/auth/query/whoAmI.api"
import { endpoint as signInEndpoint } from "@be/domain/auth/command/signIn.api"
import { endpoint as signUpEndpoint } from "@be/domain/auth/command/signUp.api"
import { endpoint as signOutEndpoint } from "@be/domain/auth/command/signOut.api"

/** The server's answer to "who am I?". Cached only so the first frame renders; it grants nothing. */
type Session = Actor
/** `current` is the last known identity; `next` only tracks a refresh, so it can never hold a value. */
type SessionInfo = { current: Session; next: RemoteData<FetchError, never> }
/** What a route should do with the visitor. */
type SessionGate = "pending" | "anonymous" | "signed-in"

const SESSION_KEY = "session"
const ANONYMOUS: Session = { type: "Anonymous" }
// `s.stringified`, not JSON.parse: a corrupt or out-of-date entry decodes to a Failure, never a throw.
const schema_stored = s.stringified(schema_actor)

type Listener = (msession: Maybe<Session>) => void
const listeners = new Set<Listener>()

// Bumped whenever the identity changes for a reason newer than the server's last answer: a sign-in or
// sign-out here, or one in another tab. A whoAmI that started under an older generation answered about
// a session that no longer exists, so its result must not be written back over the newer one.
let generation = 0

function setSession(msession: Maybe<Session>): void {
  forgetProfileFolder(msession)
  writeStored(msession)
  listeners.forEach((listener) => listener(msession))
}

/** A sign-in or sign-out: supersedes any whoAmI still in flight. */
function commitSession(msession: Maybe<Session>): void {
  generation += 1
  setSession(msession)
}

// The profile folder belongs to whoever picked it. Once nobody is signed in, forget it,
// so the next account in this browser cannot open the previous one's files.
function forgetProfileFolder(msession: Maybe<Session>): void {
  if (msession instanceof Nothing) void clearHandle()
}

function getSession(): Maybe<Session> {
  return readStored().chain(decodeStored)
}

function decodeStored(raw: string): Maybe<Session> {
  return s.decode(schema_stored, raw).either<Maybe<Session>>(
    () => Nothing(),
    (session) => Just(session)
  )
}

// localStorage is a platform boundary: disabled or full storage means "nothing cached", as in filter-store.ts.
function readStored(): Maybe<string> {
  try {
    return fromNullable(window.localStorage.getItem(SESSION_KEY))
  } catch {
    return Nothing()
  }
}

function writeStored(msession: Maybe<Session>): void {
  try {
    switch (true) {
      case msession instanceof Just:
        // s.encode is required: `userId` is an `Id` instance that JSON.stringify alone would not round-trip.
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(s.encode(schema_actor, msession.value)))
        break
      case msession instanceof Nothing:
        window.localStorage.removeItem(SESSION_KEY)
        break
      default:
        msession satisfies never
    }
  } catch {
    // The cache is a convenience; listeners still hear the change this visit.
  }
}

/** This tab hears every `setSession`; other tabs arrive through `storage`, which the browser fires only there. */
function subscribeToSessionUpdates(listener: Listener): () => void {
  const onStorage = (event: StorageEvent): void => {
    // `key === null` is `localStorage.clear()`, which also drops the session.
    if (event.storageArea !== window.localStorage) return
    if (event.key !== null && event.key !== SESSION_KEY) return
    generation += 1
    const msession = fromNullable(event.newValue).chain(decodeStored)
    forgetProfileFolder(msession)
    listener(msession)
  }
  listeners.add(listener)
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

/**
 * A rejection (network, 5xx, decode) leaves the cache alone; only a resolved Anonymous clears it.
 * An answer that lands after a sign-in or sign-out is returned but not written: it describes the old session.
 */
function reloadSession(): Future<FetchError, Session> {
  // Read the generation when the Future runs, not when it is built: a Future does nothing until forked.
  return Future.resolve<FetchError, null>(null).chain(() => {
    const startedAt = generation
    return call(whoAmI, {}).map(({ actor }) => {
      if (startedAt === generation) setSession(actor.type === "User" ? Just(actor) : Nothing())
      return actor
    })
  })
}

/** Sign-in answers with the user id, so the session is set from it; no second, racy whoAmI. */
function signIn(email: string, password: string): Future<FetchError, UserActor> {
  return call(signInEndpoint, { email, password }).map(({ userId }) => {
    const user: UserActor = { type: "User", userId }
    commitSession(Just(user))
    return user
  })
}

/** The server's sign-up starts no session, so a new account signs straight in. */
function signUp(email: string, password: string): Future<FetchError, UserActor> {
  return call(signUpEndpoint, { email, password }).chain(() => signIn(email, password))
}

/**
 * Optimistic: the UI goes anonymous now; the request ends the server session. If it fails, the session may
 * still be live, so ask the server who we are: a surviving session comes back instead of hiding behind a
 * signed-out screen until the next reload.
 */
function signOut(): void {
  commitSession(Nothing())
  const signedOutAt = generation
  call(signOutEndpoint, {}).fork(
    () => {
      // A sign-in since then was deliberate: its session is the one reloadSession now reports.
      const stillSignedOut = (): boolean => generation === signedOutAt
      reloadSession().fork(
        () => {
          if (stillSignedOut()) toast.error("Could not reach the server to sign out. Try again.")
        },
        (actor) => {
          if (actor.type === "User" && stillSignedOut()) toast.error("Sign-out failed; you are still signed in.")
        }
      )
    },
    () => {}
  )
}

/** A cached user never waits; an anonymous visitor waits one round trip instead of bouncing to /sign-in early. */
function sessionGate(info: SessionInfo): SessionGate {
  switch (info.current.type) {
    case "User":
      return "signed-in"
    case "Anonymous":
      return info.next instanceof Loading ? "pending" : "anonymous"
    default: {
      const _exhaustiveCheck: never = info.current
      throw new Error(`Unknown: ${JSON.stringify(_exhaustiveCheck)}`)
    }
  }
}
