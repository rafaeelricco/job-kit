export { controller, handler }

import { Just } from "@lib/maybe"
import { Failure } from "@lib/result"
import { Response } from "@lib/router"
import { type Command, type CommandResponse, endpoint } from "@be/domain/auth/command/signIn.api"
import { type CommandController, type CommandHandler } from "@be/app/handlers"
import { Auth, type GuardResult } from "@be/app/auth/policy"
import { internalServerError } from "@be/app/responses"
import { verifyPassword, unmatchableHash } from "@be/lib/password-hash"
import { User } from "@be/domain/user/aggregate/user"
import { respond, parseEmail } from "@be/domain/auth/command/authErrors"

/** Public: signing in is how a caller gets a session in the first place. */
const authGuard = Auth.public()
type Result_ = GuardResult<typeof authGuard>

/**
 * Verify credentials and start a session (Set-Cookie). An unknown email is
 * verified against `unmatchableHash`, so it costs the same scrypt run as a
 * wrong password and response time does not reveal which emails exist.
 * Every success issues a new token; a session the request already carried is
 * left to expire on its own.
 */
const handler: CommandHandler<Command, CommandResponse, Result_> = ({ payload, withEventStore, session }) =>
  respond(parseEmail(payload.email)).chain((email) =>
    withEventStore(
      () => internalServerError,
      function* (store) {
        return yield* store.try_find(User, User.idForEmail(email))
      }
    ).chain((found) =>
      verifyPassword(
        payload.password,
        found.maybe(unmatchableHash, (user) => user.values.passwordHash)
      )
        .mapRej((): Response => internalServerError)
        .chain((matches) =>
          // `matches` alone would do (nothing derives to `unmatchableHash`); `instanceof Just` narrows `found` for the id.
          found instanceof Just && matches
            ? session
                .start(found.value.aggregateId)
                .mapRej((): Response => internalServerError)
                .map(() => ({ userId: found.value.aggregateId }))
            : respond<CommandResponse>(Failure({ type: "invalid_credentials" }))
        )
    )
  )

const controller: CommandController<Command, CommandResponse, Result_> = { endpoint, authGuard, handler }
