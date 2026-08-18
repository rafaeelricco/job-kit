import type { IncomingMessage } from "node:http"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type PluginOption } from "vite"

import { loadStore } from "./server/scout/store"
import { trashDossiers } from "./server/scout/trash"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), storePlugin(), trashPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

// Read-only: resolves the profile root and parses the store per request, so a
// scout run shows up on reload. Dev only — a static build has no backend.
function storePlugin(): PluginOption {
  return {
    name: "scout-store",
    configureServer(server) {
      server.middlewares.use("/api/store", (_req, res) => {
        loadStore(process.env, process.cwd())
          .then((store) => {
            res.setHeader("Content-Type", "application/json")
            res.end(JSON.stringify(store))
          })
          .catch((error: unknown) => {
            res.statusCode = 500
            res.setHeader("Content-Type", "application/json")
            res.end(JSON.stringify({ error: String(error) }))
          })
      })
    },
  }
}

// The one write path in the app. Its own mount point, not a subpath of
// /api/store — that one is prefix-mounted and answers every method.
function trashPlugin(): PluginOption {
  return {
    name: "scout-trash",
    configureServer(server) {
      server.middlewares.use("/api/trash", (req, res) => {
        const reply = (status: number, body: unknown): void => {
          res.statusCode = status
          res.setHeader("Content-Type", "application/json")
          res.end(JSON.stringify(body))
        }

        if (req.method !== "POST") {
          reply(405, { error: "POST only" })
          return
        }
        // A JSON content-type forces a CORS preflight, and nothing here answers
        // one — so no other origin can reach this from a browser. The dev
        // server has no auth, and this route deletes files.
        if (req.headers["content-type"] !== "application/json") {
          reply(415, { error: "expected application/json" })
          return
        }

        readBody(req)
          .then(async (body) => {
            const parsed = trashRequestOf(body)
            if (parsed === null) {
              reply(400, { error: "expected { root, files }" })
              return
            }
            reply(200, await trashDossiers(process.env, process.cwd(), parsed.root, parsed.files))
          })
          .catch((error: unknown) => reply(500, { error: String(error) }))
      })
    },
  }
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return JSON.parse(Buffer.concat(chunks).toString("utf8"))
}

function trashRequestOf(body: unknown): { root: string; files: readonly string[] } | null {
  if (typeof body !== "object" || body === null) return null
  if (!("root" in body) || typeof body.root !== "string" || body.root === "") return null
  if (!("files" in body) || !Array.isArray(body.files)) return null
  return {
    root: body.root,
    files: body.files.filter((f: unknown): f is string => typeof f === "string"),
  }
}
