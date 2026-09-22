export { handleCommand }
export type { CommandController, CommandHandler } from "@be/app/handlers"

import * as express from "express"
import { route } from "@lib/router"
import { toResponse, decodeBody } from "@be/app/responses"
import { WithEventStore } from "@be/lib/event-sourcing/store"
import { type CommandController } from "@be/app/handlers"

/**
 * Turn a `CommandController` into an Express handler: decode the body, run
 * the handler against the event store, encode the response.
 */
function handleCommand<Command, Res>(
  withEventStore: WithEventStore,
  { endpoint, handler }: CommandController<Command, Res>
): express.Handler {
  return route((req) =>
    decodeBody(endpoint.request, req.body, "command").chain((command) =>
      handler({ payload: command, withEventStore }).map((res) => toResponse(endpoint, res))
    )
  )
}
