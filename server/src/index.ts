import { Server } from "node:http"
import { api } from "@be/api"
import { configureDependencies, Dependencies } from "@be/app/integrations"
import { handleCommand } from "@be/app/handleCommand"
import { handleQuery } from "@be/app/handleQuery"
import { handleProjection } from "@be/app/handleProjection"
import { defineAPI, Implementation } from "@be/lib/event-sourcing/server"
import { EventBusAuthMiddleware } from "@be/lib/event-delivery"
import { controller as auth_signUp } from "@be/domain/auth/command/signUp"
import { controller as auth_signIn } from "@be/domain/auth/command/signIn"
import { controller as auth_signOut } from "@be/domain/auth/command/signOut"
import { controller as auth_query_whoAmI } from "@be/domain/auth/query/whoAmI"
import { controller as note_createNote } from "@be/domain/note/command/createNote"
import { controller as note_updateNote } from "@be/domain/note/command/updateNote"
import { controller as note_deleteNote } from "@be/domain/note/command/deleteNote"
import { controller as note_query_note } from "@be/domain/note/query/getNote"
import { controller as note_query_notes } from "@be/domain/note/query/listNotes"
import { controller as notesProjection } from "@be/domain/note/projection/notes"
import { createEngineProxy } from "@be/app/engine"

import express from "express"
import env from "@be/app/environment"

const implementation: Implementation<typeof api> = {
  command: { auth_signUp, auth_signIn, auth_signOut, note_createNote, note_updateNote, note_deleteNote },
  query: { auth_query_whoAmI, note_query_note, note_query_notes },
}

// Status and message live in one table, so a status can never be sent with another status's message.
const ERROR_MESSAGES = { 400: "Invalid JSON", 413: "Request body too large", 500: "Internal Server Error" } as const
type ErrorStatus = keyof typeof ERROR_MESSAGES

/** Express's JSON parser tags malformed and oversized bodies with a status; anything else is ours (500). */
function errorStatus(error: unknown): ErrorStatus {
  const parserStatus = error instanceof Error && "status" in error ? error.status : undefined
  return parserStatus === 400 || parserStatus === 413 ? parserStatus : 500
}

function errorHandler(error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction): void {
  const status = errorStatus(error)
  if (status === 500) console.error(error)
  res.status(status).json({ error: { message: ERROR_MESSAGES[status] } })
}

/** Marks every response as not cacheable. */
function noStore(_req: express.Request, res: express.Response, next: express.NextFunction): void {
  res.set("Cache-Control", "no-store")
  next()
}

function notFound(_req: express.Request, res: express.Response): void {
  res.status(404).json({ error: { message: "Endpoint not found" } })
}

/** Mount the event-projection endpoint: its own auth middleware and a 5mb JSON limit, ahead of the global parser. */
function mountProjection(app: express.Express, dependencies: Dependencies): void {
  const projectionPath = "/api/v1/note/projection/notes"
  app.post(
    projectionPath,
    EventBusAuthMiddleware,
    express.json({ limit: "5mb" }),
    handleProjection(projectionPath, dependencies.withProjectionWriter, dependencies.repositories, notesProjection)
  )
}

function mountApi(app: express.Express, dependencies: Dependencies): void {
  defineAPI(
    api,
    implementation,
    (endpoint, controller) =>
      app.post(endpoint.path, handleCommand(dependencies.withEventStore, dependencies.sessions, controller)),
    (endpoint, controller) =>
      app.post(
        endpoint.path,
        handleQuery(dependencies.withProjectionReader, dependencies.repositories, dependencies.sessions, controller)
      )
  )
}

/**
 * Route order matters: the projection endpoint is mounted with its own 5mb
 * JSON body limit before the global `express.json()`, so its limit wins over
 * the default one; `notFound` and `errorHandler` are mounted last as the
 * fallbacks for everything else.
 */
function createApp(dependencies: Dependencies): express.Express {
  const app = express()
  app.disable("x-powered-by")
  app.set("etag", false)
  app.use(noStore)
  app.use("/api/dev/engine", createEngineProxy())
  mountProjection(app, dependencies)
  app.use(express.json())
  mountApi(app, dependencies)
  app.get("/docker_healthcheck", (_req, res) => res.send("OK"))
  app.use(notFound)
  app.use(errorHandler)
  return app
}

/** Ensures a shutdown handler runs at most once, however many signals arrive. */
function once(f: () => void): () => void {
  let called = false
  return (): void => {
    if (called) return
    called = true
    f()
  }
}

/** Stop accepting connections and close both database clients on SIGINT/SIGTERM, forcing exit after 10s. */
function registerShutdown(server: Server, dependencies: Dependencies): void {
  const shutdown = once((): void => {
    const timeout = setTimeout(() => process.exit(1), 10000)
    timeout.unref()
    server.close(() => {
      void Promise.all([dependencies.postgres.disconnect(), dependencies.mongo.disconnect()])
        .then(() => {
          clearTimeout(timeout)
          process.exitCode = 0
        })
        .catch((error) => {
          console.error(error)
          process.exitCode = 1
        })
    })
  })
  process.once("SIGINT", shutdown)
  process.once("SIGTERM", shutdown)
}

function start(dependencies: Dependencies): void {
  const server = createApp(dependencies).listen(env.PORT, "0.0.0.0", () => {
    console.log(`Event Sourcing Scaffold listening on port ${env.PORT}`)
  })
  registerShutdown(server, dependencies)
}

function exitWithError(error: Error): void {
  console.error(error)
  process.exit(1)
}

configureDependencies().fork(exitWithError, start)
