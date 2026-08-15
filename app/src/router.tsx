export { Router }

import { lazy, Suspense } from "react"
import { createBrowserRouter, RouterProvider } from "react-router-dom"

import App from "@/App"

const NotesPage = lazy(() => import("@/pages/notes"))

const router = createBrowserRouter([
  { path: "/", element: <App /> },
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
