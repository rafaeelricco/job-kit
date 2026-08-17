import type { IncomingMessage } from "node:http"
import path from "path"
import mdx from "@mdx-js/rollup"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import rehypePrettyCode from "rehype-pretty-code"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import remarkMdxFrontmatter from "remark-mdx-frontmatter"
import type { ShikiTransformer } from "shiki"
import { defineConfig, type PluginOption } from "vite"

import { loadStore } from "./server/scout/store"
import { trashDossiers } from "./server/scout/trash"

// Decorates Shiki output; styled by the pre[data-line-numbers] rules in prose-reset.css
const visualTransformers: ShikiTransformer[] = [
  {
    pre(node) {
      node.properties["class"] = "no-scrollbar min-w-0 overflow-x-auto px-4 py-3.5 outline-none !bg-transparent"
    },
    code(node) {
      node.properties["data-line-numbers"] = ""
    },
    line(node) {
      node.properties["data-line"] = ""
    },
  },
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [mdxPlugin(), react(), tailwindcss(), storePlugin(), trashPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

// enforce: "pre" — MDX must become JSX before @vitejs/plugin-react sees it.
// Default extensions cover both .mdx (format "mdx") and .md (format "md").
function mdxPlugin(): PluginOption {
  return {
    enforce: "pre",
    ...mdx({
      providerImportSource: "@mdx-js/react",
      remarkPlugins: [remarkGfm, remarkFrontmatter, remarkMdxFrontmatter],
      rehypePlugins: [
        [
          rehypePrettyCode,
          {
            theme: { dark: "github-dark", light: "github-light" },
            transformers: visualTransformers,
            keepBackground: false,
          },
        ],
      ],
    }),
  }
}

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
          .then((body) => trashDossiers(process.env, process.cwd(), filesOf(body)))
          .then((result) => reply(200, result))
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

const filesOf = (body: unknown): readonly string[] =>
  typeof body === "object" && body !== null && "files" in body && Array.isArray(body.files)
    ? body.files.filter((f: unknown): f is string => typeof f === "string")
    : []
