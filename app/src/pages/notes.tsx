export default NotesPage

import { MDXProvider } from "@mdx-js/react"
import { useLocation } from "react-router-dom"

import { mdxComponents } from "@/components/mdx/mdx-components"
import { getNoteByPath } from "@/module/notes/helpers/notes-loader"

function NotesPage() {
  const { pathname } = useLocation()
  const note = getNoteByPath(pathname.replace(/^\/notes/, "") || "/")

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl flex-1 border-x border-dashed border-border">
        <main className="px-4 py-8 sm:px-8 md:py-12">
          {note ? (
            <article className="prose max-w-none prose-neutral dark:prose-invert">
              <div className="mb-8">
                <h1 className="mb-2 text-2xl font-bold tracking-tight">{note.metadata.title}</h1>
                {note.metadata.description && (
                  <p className="text-base text-muted-foreground">{note.metadata.description}</p>
                )}
              </div>
              <hr className="my-4 border-t border-border" />
              <MDXProvider components={mdxComponents}>
                <note.Component />
              </MDXProvider>
            </article>
          ) : (
            <div className="py-24 text-center">
              <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
              <p className="mt-2 text-sm text-muted-foreground">The requested page could not be found.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
