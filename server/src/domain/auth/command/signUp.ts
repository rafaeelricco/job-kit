export { controller, handler }

import { Just } from "@lib/maybe"
import { type Result, Success, Failure } from "@lib/result"
import { Response } from "@lib/router"
import { type Command, type CommandResponse, endpoint } from "@be/domain/auth/command/signUp.api"
import { type CommandController, type CommandHandler } from "@be/app/handlers"
import { Auth, type GuardResult } from "@be/app/auth/policy"
import { internalServerError } from "@be/app/responses"
import { hashPassword } from "@be/lib/password-hash"
import { User } from "@be/domain/user/aggregate/user"
import { UserRegistered } from "@be/domain/user/events/user/userRegistered"
import { type AuthError, respond, parseEmail, parsePassword } from "@be/domain/auth/command/authErrors"

const authGuard = Auth.public()
/** Named `Result_` because `Result` is the `@lib/result` type used below. */
type Result_ = GuardResult<typeof authGuard>

/**
 * Register a user; does not sign in. A second sign-up for the same email finds
 * the stream `User.idForEmail` names and gets 409. Two racing sign-ups collide
 * on aggregate version 0, and the store's retry turns the loser into that 409.
 */
const handler: CommandHandler<Command, CommandResponse, Result_> = ({ payload, withEventStore }) =>
  respond(
    parseEmail(payload.email).chain((email) => parsePassword(payload.password).map((password) => ({ email, password })))
  )
    .chain(({ email, password }) =>
      hashPassword(password)
        .mapRej((): Response => internalServerError)
        // Hash before opening the store, so the slow scrypt run holds no transaction open.
        .chain((passwordHash) =>
          withEventStore<Response, Result<AuthError, CommandResponse>>(
            () => internalServerError,
            function* (store) {
              const userId = User.idForEmail(email)
              if ((yield* store.try_find(User, userId)) instanceof Just) return Failure({ type: "email_taken" })
              yield* store.emit({
                aggregate: User,
                event: new UserRegistered({ type: UserRegistered.type, aggregateId: userId, email, passwordHash }),
              })
              return Success({ userId })
            }
          )
        )
    )
    .chain(respond)

const controller: CommandController<Command, CommandResponse, Result_> = { endpoint, authGuard, handler }
