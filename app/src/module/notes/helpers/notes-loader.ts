export { getAllNotePages, getNoteByPath }
export type { NoteMetadata, NotePage }

import type { ComponentType } from "react"

type NoteMetadata = {
  title: string
  description?: string
}

type NotePage = {
  path: string
  metadata: NoteMetadata
  Component: ComponentType
}

type MdxModule = {
  default: ComponentType
  frontmatter: NoteMetadata
}

const modules = import.meta.glob<MdxModule>(
  "/src/module/notes/content/**/*.{md,mdx}",
  { eager: true }
)

// content/index.mdx -> "/", content/guides/setup.md -> "/guides/setup"
function getAllNotePages(): NotePage[] {
  return Object.entries(modules).map(([filePath, mod]) => {
    const raw = filePath
      .replace("/src/module/notes/content", "")
      .replace(/\.mdx?$/, "")
      .replace(/\/index$/, "")

    return {
      path: raw === "" ? "/" : raw,
      metadata: mod.frontmatter,
      Component: mod.default,
    }
  })
}

function getNoteByPath(notePath: string): NotePage | undefined {
  return getAllNotePages().find((page) => page.path === notePath)
}
