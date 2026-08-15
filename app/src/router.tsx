export { Router }

import { lazy, Suspense } from "react"
import { createBrowserRouter, RouterProvider } from "react-router-dom"

import App from "@/App"

const NotesPage = lazy(() => import("@/pages/notes"))
const DossiersPage = lazy(() => import("@/pages/dossiers"))

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  {
    path: "/dossiers",
    element: (
      <Suspense>
        <DossiersPage />
      </Suspense>
    ),
  },
  {
    path: "/notes/*",
    element: (
      <Suspense>
        <NotesPage />
      </Suspense>
    ),
  },
])

function Router() {
  return <RouterProvider router={router} />
}
