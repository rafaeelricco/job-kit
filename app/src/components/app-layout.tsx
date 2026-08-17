export { AppLayout }

import type { CSSProperties } from "react"
import { Outlet } from "react-router-dom"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

function AppLayout() {
  return (
    <SidebarProvider style={{ "--sidebar-width": "18.5rem" } as CSSProperties}>
      <AppSidebar />
      <SidebarInset>
        {/* Below md the sidebar is a sheet, so its own trigger goes with it.
            Without this bar there is no way back to navigation on a phone. */}
        <header className="flex h-12 shrink-0 items-center px-3 md:hidden">
          <SidebarTrigger />
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
