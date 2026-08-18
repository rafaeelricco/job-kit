export { Router }

import { lazy, Suspense } from "react"
import { createBrowserRouter, RouterProvider } from "react-router-dom"

import App from "@/App"
import { AppLayout } from "@/components/app-layout"

const NotesPage = lazy(() => import("@/pages/notes"))
const DossiersPage = lazy(() => import("@/pages/dossiers"))

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
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
    ],
  },
])

function Router() {
  return <RouterProvider router={router} />
}
