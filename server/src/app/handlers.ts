import { Future } from "@lib/future"
import { Response } from "@lib/router"
import { PlainEndpoint } from "@be/app/endpoint"
import { ReadProjections } from "@be/app/projections"
import { WithEventStore } from "@be/lib/event-sourcing/store"

/**
 * A command's business logic. Receives the decoded payload and the event
 * store runner; rejects with the HTTP reply to send.
 *
 * ```ts
 * const handler: CommandHandler<Command, CommandResponse> = ({ payload, withEventStore }) =>
 *   withEventStore(internalError, function* (store) { ... })
 * ```
 */
export type CommandHandler<Req, Res> = (args: { payload: Req; withEventStore: WithEventStore }) => Future<Response, Res>

/**
 * A query's business logic. Receives the decoded payload and read-only
 * access to the projections; rejects with the HTTP reply to send.
 */
export type QueryHandler<Req, Res> = (args: { payload: Req; projections: ReadProjections }) => Future<Response, Res>

export type CommandController<Req, Res> = {
  endpoint: PlainEndpoint<Req, Res>
  handler: CommandHandler<Req, Res>
}

export type QueryController<Req, Res> = {
  endpoint: PlainEndpoint<Req, Res>
  handler: QueryHandler<Req, Res>
}
