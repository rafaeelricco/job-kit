export { type SessionStore, Session, postgresSessionStore, initializeSessionTable, sessionToken }

import { createHash, randomBytes } from "node:crypto"
import { type Request } from "express"
import { Future } from "@lib/future"
import { type Maybe, Just, Nothing, fromOptional } from "@lib/maybe"
import { Postgres, type PostgresTransaction } from "@be/lib/postgres"
import { Id } from "@be/lib/event-sourcing/event"
import env from "@be/app/environment"

/** Cookie name; the value is the raw token, never the user id. */
const COOKIE = "sid"
/** Lives in the event-store database but outside the replication publication, so sessions never reach the event bus. */
const TABLE = "auth_sessions"
/** Fixed wall-clock lifetime, not sliding — like a `rolling: false` session store. */
const TTL_SECONDS = 24 * 60 * 60

/**
 * Server-side sessions. The cookie carries a random token; only its SHA-256 is
 * stored, so a leaked table cannot be replayed as cookies.
 */
type SessionStore = {
  /** Start a session for `userId`; resolves with the raw token for the cookie. */
  readonly create: (userId: Id<"User">) => Future<Error, string>
  /** The user an unexpired token belongs to, if any. */
  readonly find: (token: string) => Future<Error, Maybe<Id<"User">>>
  /** Forget `token`; a no-op when it is unknown or already expired. */
  readonly destroy: (token: string) => Future<Error, void>
}

/** What the table stores and looks up by: SHA-256 is enough here, since the token is 256 random bits, not a guessable password. */
const digest = (token: string): string => createHash("sha256").update(token).digest("hex")

/** Create the sessions table and its expiry index if missing; runs at startup next to the event-store setup. */
function initializeSessionTable(postgres: Postgres): Future<Error, void> {
  return postgres.withTransaction(
    { isolation: "ReadCommitted" },
    (e) => e,
    (t) =>
      Future.attemptP(async () => {
        await t.query(`CREATE TABLE IF NOT EXISTS ${TABLE} (
          token_hash TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL
        )`)
        await t.query(`CREATE INDEX IF NOT EXISTS ${TABLE}_expires_at ON ${TABLE} (expires_at)`)
      })
  )
}

/**
 * The production `SessionStore`: one short `ReadCommitted` transaction per call.
 * Expiry is decided by the database clock (`now()`), so app and DB never disagree
 * about whether a session is still valid.
 */
function postgresSessionStore(postgres: Postgres): SessionStore {
  const run = <T>(f: (t: PostgresTransaction) => Promise<T>): Future<Error, T> =>
    postgres.withTransaction(
      { isolation: "ReadCommitted" },
      (e) => e,
      (t) => Future.attemptP(() => f(t))
    )
  return {
    create: (userId) =>
      run(async (t) => {
        const token = randomBytes(32).toString("base64url")
        // Sweeping expired rows on every sign-in keeps the table bounded without a job.
        await t.query(`DELETE FROM ${TABLE} WHERE expires_at <= now()`)
        await t.query(
          `INSERT INTO ${TABLE} (token_hash, user_id, expires_at) VALUES ($1, $2, now() + make_interval(secs => $3))`,
          [digest(token), userId.value, TTL_SECONDS]
        )
        return token
      }),
    find: (token) =>
      run(async (t) => {
        const { rows } = await t.query(`SELECT user_id FROM ${TABLE} WHERE token_hash = $1 AND expires_at > now()`, [
          digest(token),
        ])
        const userId = rows[0]?.["user_id"]
        return typeof userId === "string" ? Just(new Id<"User">(userId)) : Nothing()
      }),
    destroy: (token) =>
      run(async (t) => {
        await t.query(`DELETE FROM ${TABLE} WHERE token_hash = $1`, [digest(token)])
      }),
  }
}

/**
 * The session token from the `Cookie` header, parsed by hand in place of
 * cookie-parser. `Nothing` when the header, the `sid` pair, or its value is missing.
 *
 * ```ts
 * sessionToken(req) // Cookie: "theme=dark; sid=abc" → Just("abc")
 * ```
 */
function sessionToken(req: Request): Maybe<string> {
  const pair = (req.headers.cookie ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE}=`))
  return fromOptional(pair?.slice(COOKIE.length + 1)).chain((token) => (token.length > 0 ? Just(token) : Nothing()))
}

/**
 * The `Set-Cookie` value for `sid`. `HttpOnly` keeps it from page scripts,
 * `SameSite=Lax` from cross-site POSTs, and `Secure` (production only) off plain
 * HTTP. `maxAge = 0` with an empty value tells the browser to delete it.
 */
function cookieHeader(value: string, maxAge: number): string {
  const secure = env.NODE_ENV === "production" ? "; Secure" : ""
  return `${COOKIE}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`
}

/**
 * A command handler's handle on the request's session — what `req.session` is
 * in express-session. `start` and `end` change the store and record the
 * `Set-Cookie` header the reply will carry.
 */
class Session {
  private readonly store: SessionStore
  private readonly token: Maybe<string>
  private cookie: Maybe<string> = Nothing()

  constructor(store: SessionStore, token: Maybe<string>) {
    this.store = store
    this.token = token
  }

  /** Issue a fresh token for `userId`. The request's token is never reused, so a planted cookie cannot be elevated. */
  start(userId: Id<"User">): Future<Error, void> {
    return this.store.create(userId).map((token) => {
      this.cookie = Just(cookieHeader(token, TTL_SECONDS))
    })
  }

  /** Destroy the request's session, if any, and clear the cookie. */
  end(): Future<Error, void> {
    return this.token
      .maybe(Future.resolve<Error, void>(undefined), (token) => this.store.destroy(token))
      .map(() => {
        this.cookie = Just(cookieHeader("", 0))
      })
  }

  /** The headers the reply must carry: `Set-Cookie` once `start` or `end` has run. */
  get headers(): Record<string, string> {
    return this.cookie.maybe({} as Record<string, string>, (cookie) => ({ "Set-Cookie": cookie }))
  }
}
