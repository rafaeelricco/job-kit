import "@/index.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ThemeProvider } from "@components/ui/theme-provider"
import { Toaster } from "@ui/sonner"
import { Router } from "@/router"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <Router />
      <Toaster />
    </ThemeProvider>
  </StrictMode>
)
