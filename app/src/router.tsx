export { Router }

import { lazy, Suspense } from "react"
import { createBrowserRouter, RouterProvider } from "react-router-dom"

import { AppLayout } from "@/components/app-layout"

const AnswersPage = lazy(() => import("@/pages/answers"))
const DossiersPage = lazy(() => import("@/pages/dossiers"))
const HomePage = lazy(() => import("@/pages/home"))
const RecommendationsPage = lazy(() => import("@/pages/recommendations"))
const ResumesPage = lazy(() => import("@/pages/resumes"))

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
        {
          path: "/resumes",
          element: (
            <Suspense>
              <ResumesPage />
            </Suspense>
          ),
        },
        {
          path: "/recommendations",
          element: (
            <Suspense>
              <RecommendationsPage />
            </Suspense>
          ),
        },
        {
          path: "/answers",
          element: (
            <Suspense>
              <AnswersPage />
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
