export { Router }

import { lazy, Suspense } from "react"
import { createBrowserRouter, RouterProvider } from "react-router-dom"

import App from "@/App"
import { AppLayout } from "@/components/app-layout"

const NotesPage = lazy(() => import("@/pages/notes"))

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <App /> },
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
