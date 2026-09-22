export { handleQuery }
export type { QueryController, QueryHandler } from "@be/app/handlers"

import * as express from "express"
import { route } from "@lib/router"
import { type Repositories, readProjections } from "@be/app/projections"
import { type WithProjectionReader } from "@be/app/projectionStore"
import { toResponse, internalServerError, decodeBody } from "@be/app/responses"
import { type QueryController } from "@be/app/handlers"

/** A client never learns why the store failed: every store error becomes the same generic 500. */
const hideStoreError = (_: Error) => internalServerError

/**
 * Turn a `QueryController` into an Express handler: decode the body, run
 * the handler with a fresh read-only projection view, encode the response.
 */
function handleQuery<Query, Res>(
  withProjectionReader: WithProjectionReader,
  repositories: Repositories,
  { endpoint, handler }: QueryController<Query, Res>
): express.Handler {
  return route((req) =>
    decodeBody(endpoint.request, req.body, "request").chain((query) =>
      withProjectionReader(hideStoreError, (store) =>
        handler({
          payload: query,
          projections: readProjections(repositories, store),
        }).map((res) => toResponse(endpoint, res))
      )
    )
  )
}
