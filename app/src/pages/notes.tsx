export default NotesPage

import { MDXProvider } from "@mdx-js/react"
import { ArrowLeft } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import { mdxComponents } from "@/components/mdx/mdx-components"
import { getNoteByPath } from "@/module/notes/helpers/notes-loader"

function NotesPage() {
  const { pathname } = useLocation()
  const note = getNoteByPath(pathname.replace(/^\/notes/, "") || "/")

  return (
    <div className="bg-background min-h-svh">
      <div className="border-border mx-auto max-w-3xl border-x border-dashed">
        <header className="border-border border-b border-dashed px-4 py-4 sm:px-8">
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Home</span>
          </Link>
        </header>

        <main className="px-4 py-8 sm:px-8 md:py-12">
          {note ? (
            <article className="prose prose-neutral dark:prose-invert max-w-none">
              <div className="mb-8">
                <h1 className="mb-2 text-2xl font-bold tracking-tight">
                  {note.metadata.title}
                </h1>
                {note.metadata.description && (
                  <p className="text-muted-foreground text-base">
                    {note.metadata.description}
                  </p>
                )}
              </div>
              <hr className="border-border my-4 border-t" />
              <MDXProvider components={mdxComponents}>
                <note.Component />
              </MDXProvider>
            </article>
          ) : (
            <div className="py-24 text-center">
              <h1 className="text-foreground text-2xl font-bold">
                Page not found
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                The requested page could not be found.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
