export { AppLayout }

import type { CSSProperties } from "react"
import { Outlet, useSearchParams } from "react-router-dom"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { SettingsDialog } from "@/module/profile/components/settings-dialog"

function AppLayout() {
  const [params, setParams] = useSearchParams()

  // Settings is a search param, not a path: the route behind it stays matched
  // and mounted, so the dialog opens over the page you were already on rather
  // than over a blank shell. Deep links and the back button both still work.
  const settingsOpen = params.has("settings")
  // The param's value is the panel, so a section is deep-linkable the way the
  // console's /settings/<section> is. Bare `?settings` still opens the first.
  const panel = params.get("settings") ?? ""
  const closeSettings = (next: boolean): void => {
    if (next) return
    const rest = new URLSearchParams(params)
    rest.delete("settings")
    void setParams(rest, { replace: true })
  }
  // replace, not push: flipping through panels must not bury the page you were
  // on under seven history entries.
  const selectPanel = (next: string): void => {
    const all = new URLSearchParams(params)
    all.set("settings", next)
    void setParams(all, { replace: true })
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem" } as CSSProperties}>
      <AppSidebar />
      <SidebarInset>
        {/* Below md the sidebar is a sheet, so its own trigger goes with it.
            Without this bar there is no way back to navigation on a phone. */}
        <header className="flex h-12 shrink-0 items-center px-3 md:hidden">
          <SidebarTrigger />
        </header>
        <Outlet />
      </SidebarInset>
      <SettingsDialog open={settingsOpen} panel={panel} onPanelChange={selectPanel} onOpenChange={closeSettings} />
    </SidebarProvider>
  )
}
