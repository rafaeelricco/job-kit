import assert from "node:assert/strict"
import { describe, test } from "vitest"
import { Just, Nothing } from "@lib/maybe"
import { MemoryEventDatabase, MemorySessionStore } from "@tests/support/memory"
import { result, rejection } from "@tests/support/notes"
import { controller as signUp } from "@be/domain/auth/command/signUp"
import { controller as signIn } from "@be/domain/auth/command/signIn"
import { controller as signOut } from "@be/domain/auth/command/signOut"
import { controller as whoAmI } from "@be/domain/auth/query/whoAmI"
import { type UserActor } from "@be/app/actor"
import { Session } from "@be/app/session"
import { User } from "@be/domain/user/aggregate/user"
import { schemas } from "@be/app/events"
import { type ReadProjections } from "@be/app/projections"
import { Id } from "@be/lib/event-sourcing/event"

function hydrateUser(db: MemoryEventDatabase): User {
  return schemas.hydrate(User, db.entries).unwrap((message) => message).aggregate
}

const anonymousAuth = { actor: { type: "Anonymous" as const }, auth: { result: "allow" as const } }

describe("Auth commands and queries", () => {
  test("signUp emits one UserRegistered event with a normalized email and a hashed password", async () => {
    const db = new MemoryEventDatabase()
    const sessions = new MemorySessionStore()
    const password = "correct horse battery"
    const response = await result(
      signUp.handler({
        payload: { email: " Me@Example.com ", password },
        ...anonymousAuth,
        session: new Session(sessions, Nothing()),
        withEventStore: db.withEventStore,
      })
    )
    assert.equal(db.entries.length, 1)
    assert.equal(db.entries[0]?.event_name, "UserRegistered")
    const user = hydrateUser(db)
    assert.equal(user.values.email, "me@example.com")
    assert.equal(user.aggregateId.value, response.userId.value)
    assert.match(user.values.passwordHash, /^scrypt\$/)
    assert.equal(user.values.passwordHash.includes(password), false)
  })

  test("a duplicate sign-up, even with different case or whitespace, is rejected and appends no event", async () => {
    const db = new MemoryEventDatabase()
    const sessions = new MemorySessionStore()
    const signUpAs = (email: string) =>
      signUp.handler({
        payload: { email, password: "correct horse battery" },
        ...anonymousAuth,
        session: new Session(sessions, Nothing()),
        withEventStore: db.withEventStore,
      })
    await result(signUpAs("me@example.com"))
    const error = await rejection(signUpAs("  ME@Example.com  "))
    assert.match(JSON.stringify(error), /409/)
    assert.equal(db.entries.length, 1)
  })

  test("a weak password or a malformed email is rejected before the store opens", async () => {
    const db = new MemoryEventDatabase()
    const sessions = new MemorySessionStore()
    const attempt = (email: string, password: string) =>
      signUp.handler({
        payload: { email, password },
        ...anonymousAuth,
        session: new Session(sessions, Nothing()),
        withEventStore: db.withEventStore,
      })
    const weak = await rejection(attempt("me@example.com", "short"))
    assert.match(JSON.stringify(weak), /400/)
    const malformed = await rejection(attempt("not-an-email", "correct horse battery"))
    assert.match(JSON.stringify(malformed), /400/)
    assert.equal(db.entries.length, 0)
  })

  test("signIn with the right password starts a session and sets the cookie", async () => {
    const db = new MemoryEventDatabase()
    const sessions = new MemorySessionStore()
    const email = "me@example.com"
    const password = "correct horse battery"
    const signedUp = await result(
      signUp.handler({
        payload: { email, password },
        ...anonymousAuth,
        session: new Session(sessions, Nothing()),
        withEventStore: db.withEventStore,
      })
    )
    const session = new Session(sessions, Nothing())
    const response = await result(
      signIn.handler({
        payload: { email, password },
        ...anonymousAuth,
        session,
        withEventStore: db.withEventStore,
      })
    )
    assert.equal(response.userId.value, signedUp.userId.value)
    assert.match(session.headers["Set-Cookie"] ?? "", /^sid=token-1; HttpOnly/)
    assert.equal(sessions.sessions.get("token-1")?.value, signedUp.userId.value)
  })

  test("signIn rejects a wrong password or an unknown email without starting a session", async () => {
    const db = new MemoryEventDatabase()
    const sessions = new MemorySessionStore()
    const email = "me@example.com"
    const password = "correct horse battery"
    await result(
      signUp.handler({
        payload: { email, password },
        ...anonymousAuth,
        session: new Session(sessions, Nothing()),
        withEventStore: db.withEventStore,
      })
    )
    const attempt = async (attemptEmail: string, attemptPassword: string) => {
      const session = new Session(sessions, Nothing())
      const error = await rejection(
        signIn.handler({
          payload: { email: attemptEmail, password: attemptPassword },
          ...anonymousAuth,
          session,
          withEventStore: db.withEventStore,
        })
      )
      assert.match(JSON.stringify(error), /401/)
      assert.match(JSON.stringify(error), /Invalid email or password/)
      assert.deepEqual(session.headers, {})
    }
    await attempt(email, "wrong password!!")
    await attempt("unknown@example.com", password)
    assert.equal(sessions.sessions.size, 0)
  })

  test("signOut destroys the session and clears the cookie", async () => {
    const db = new MemoryEventDatabase()
    const sessions = new MemorySessionStore()
    const userId = Id.random<"User">()
    const token = await sessions.create(userId).promise((error) => error)
    assert.equal(token, "token-1")
    const session = new Session(sessions, Just(token))
    const actor: UserActor = { type: "User", userId }
    await result(
      signOut.handler({
        payload: {},
        actor,
        auth: { result: "allow", actor },
        session,
        withEventStore: db.withEventStore,
      })
    )
    assert.equal(sessions.sessions.has("token-1"), false)
    assert.match(session.headers["Set-Cookie"] ?? "", /Max-Age=0/)
  })

  test("whoAmI passes the resolved actor through unchanged", async () => {
    const projections = {} as ReadProjections
    const anonymous = await result(whoAmI.handler({ payload: {}, ...anonymousAuth, projections }))
    assert.deepEqual(anonymous, { actor: { type: "Anonymous" } })

    const actor: UserActor = { type: "User", userId: Id.random<"User">() }
    const signedIn = await result(whoAmI.handler({ payload: {}, actor, auth: { result: "allow" }, projections }))
    assert.deepEqual(signedIn, { actor })
  })
})
