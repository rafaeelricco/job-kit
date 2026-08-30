export { Router }

import { lazy, Suspense } from "react"
import { createBrowserRouter, RouterProvider } from "react-router-dom"

import { AppLayout } from "@/components/app-layout"

const DossiersPage = lazy(() => import("@/pages/dossiers"))
const HomePage = lazy(() => import("@/pages/home"))

const basename = import.meta.env.BASE_URL.replace(/\/$/, "")

const router = createBrowserRouter(
  [
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
      ],
    },
  ],
  { basename }
)

function Router() {
  return <RouterProvider router={router} />
}
