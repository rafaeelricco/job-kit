import assert from "node:assert/strict"
import { describe, test } from "vitest"
import type * as express from "express"
import { Future } from "@lib/future"
import * as s from "@lib/json/schema"
import { json, type Response } from "@lib/router"
import { PlainEndpoint } from "@be/app/endpoint"
import { type CommandController, type QueryController } from "@be/app/handlers"
import { handleCommand } from "@be/app/handleCommand"
import { handleQuery } from "@be/app/handleQuery"
import { type Repositories } from "@be/app/projections"
import { type ProjectionReader, type WithProjectionReader } from "@be/app/projectionStore"
import { MemoryEventDatabase } from "@tests/support/memory"

type Captured = { status: number; body: unknown }

function invoke(handler: express.Handler, body: unknown): Promise<Captured> {
  return new Promise((resolve) => {
    let status = 200
    const response = {
      status(code: number) {
        status = code
        return response
      },
      set() {
        return response
      },
      json(value: unknown) {
        resolve({ status, body: value })
        return response
      },
      send(value: unknown) {
        resolve({ status, body: value })
        return response
      },
    } as unknown as express.Response
    handler({ body } as express.Request, response, (() => {}) as express.NextFunction)
  })
}

describe("HTTP command and query adapters", () => {
  test("decodes commands, encodes successful replies, and maps handler rejections", async () => {
    const endpoint = new PlainEndpoint({
      path: "/command",
      request: s.object({ value: s.number }),
      response: s.object({ accepted: s.number }),
    })
    const controller: CommandController<{ value: number }, { accepted: number }> = {
      endpoint,
      handler: ({ payload }) =>
        payload.value < 0
          ? Future.reject(json({ status: 409, content: { error: { message: "value must be nonnegative" } } }))
          : Future.resolve({ accepted: payload.value }),
    }
    const handler = handleCommand(new MemoryEventDatabase().withEventStore, controller)

    const decoded = await invoke(handler, { value: "wrong" })
    assert.equal(decoded.status, 400)
    assert.match(JSON.stringify(decoded.body), /Unable to decode command/)

    const success = await invoke(handler, { value: 4 })
    assert.equal(success.status, 200)
    assert.deepEqual(success.body, { accepted: 4 })

    const rejected = await invoke(handler, { value: -1 })
    assert.equal(rejected.status, 409)
    assert.deepEqual(rejected.body, { error: { message: "value must be nonnegative" } })
  })

  test("maps query decode failures to 400 and hides projection store errors behind 500", async () => {
    const endpoint = new PlainEndpoint({
      path: "/query",
      request: s.object({ term: s.string }),
      response: s.object({ term: s.string }),
    })
    const controller: QueryController<{ term: string }, { term: string }> = {
      endpoint,
      handler: ({ payload }) => Future.resolve<Response, { term: string }>({ term: payload.term }),
    }
    const withReader: WithProjectionReader = (_onError, procedure) => procedure({} as ProjectionReader)
    const handler = handleQuery(withReader, {} as Repositories, controller)

    const decoded = await invoke(handler, { term: 3 })
    assert.equal(decoded.status, 400)
    assert.match(JSON.stringify(decoded.body), /Unable to decode request/)

    const success = await invoke(handler, { term: "notes" })
    assert.equal(success.status, 200)
    assert.deepEqual(success.body, { term: "notes" })

    const unavailableReader: WithProjectionReader = (onError) => Future.reject(onError(new Error("private detail")))
    const unavailable = await invoke(handleQuery(unavailableReader, {} as Repositories, controller), { term: "notes" })
    assert.equal(unavailable.status, 500)
    assert.deepEqual(unavailable.body, { error: { message: "Internal Server Error" } })
    assert.equal(JSON.stringify(unavailable.body).includes("private detail"), false)
  })
})
