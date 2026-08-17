export { Router }

import { lazy, Suspense } from "react"
import { createBrowserRouter, RouterProvider } from "react-router-dom"

import { AppLayout } from "@/components/app-layout"

const NotesPage = lazy(() => import("@/pages/notes"))
const DossiersPage = lazy(() => import("@/pages/dossiers"))
const HomePage = lazy(() => import("@/pages/home"))

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: (
          <Suspense>
            <HomePage />
          </Suspense>
        ),
      },
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
