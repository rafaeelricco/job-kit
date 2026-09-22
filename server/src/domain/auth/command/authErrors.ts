export { type AuthError, respond, parseEmail, parsePassword }

import { Future } from "@lib/future"
import { type Result, Success, Failure } from "@lib/result"
import { json, Response } from "@lib/router"

/** A length floor rather than composition rules, as NIST SP 800-63B recommends. */
const MIN_PASSWORD_LENGTH = 12

/** Everything an auth command can refuse; `toResponse` maps each to its HTTP reply. */
type AuthError =
  { type: "invalid_email" } | { type: "weak_password" } | { type: "email_taken" } | { type: "invalid_credentials" }

/**
 * `invalid_credentials` deliberately covers both "no such email" and "wrong
 * password", so a failed sign-in never reveals which emails are registered.
 */
function toResponse(error: AuthError): Response {
  switch (error.type) {
    case "invalid_email":
      return json({ status: 400, content: { error: { message: "Enter a valid email address" } } })
    case "weak_password":
      return json({
        status: 400,
        content: { error: { message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` } },
      })
    case "email_taken":
      return json({ status: 409, content: { error: { message: "Email already registered" } } })
    case "invalid_credentials":
      return json({ status: 401, content: { error: { message: "Invalid email or password" } } })
    default: {
      const _exhaustiveCheck: never = error
      throw new Error(`Unknown: ${JSON.stringify(_exhaustiveCheck)}`)
    }
  }
}

/** Leave the `Result` world at the edge of a handler, as `noteErrors.respond` does. */
function respond<T>(result: Result<AuthError, T>): Future<Response, T> {
  return result.either<Future<Response, T>>(
    (error) => Future.reject(toResponse(error)),
    (ok) => Future.resolve(ok)
  )
}

/** Trim and lowercase, so `A@x.io ` and `a@x.io` are one account (see `User.idForEmail`). */
function parseEmail(raw: string): Result<AuthError, string> {
  const email = raw.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+$/.test(email) ? Success(email) : Failure({ type: "invalid_email" })
}

/** Checked only at sign-up; sign-in compares whatever it gets, so raising the minimum never locks out old accounts. */
function parsePassword(raw: string): Result<AuthError, string> {
  return raw.length >= MIN_PASSWORD_LENGTH ? Success(raw) : Failure({ type: "weak_password" })
}
