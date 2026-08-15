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

// Decorates Shiki output; styled by the pre[data-line-numbers] rules in prose-reset.css
const visualTransformers: ShikiTransformer[] = [
  {
    pre(node) {
      node.properties["class"] =
        "no-scrollbar min-w-0 overflow-x-auto px-4 py-3.5 outline-none !bg-transparent"
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
  plugins: [mdxPlugin(), react(), tailwindcss(), storePlugin()],
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
