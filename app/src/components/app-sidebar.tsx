export { AppSidebar }

import { BadgeCheck, Bell, Briefcase, ChevronsUpDown, CreditCard, LayoutGrid, LogOut, Sparkles } from "lucide-react"
import { useEffect } from "react"
import { NavLink, useLocation } from "react-router-dom"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

// Taller and larger than the shadcn default, and the label sits at #777777
// (--muted-foreground) rather than near-black; only the active row goes dark.
const ITEM = "h-9 gap-2.5 rounded-lg px-2.5 text-[15px] font-normal text-muted-foreground data-active:text-foreground"
// Placeholder: job-kit has no auth, so nothing here is wired to an identity.
const USER = { name: "shadcn", email: "m@example.com" } as const

// A one-word name has no second initial to take, so it falls back to its first
// two letters rather than rendering a lonely "S".
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/)
  const letters = words.length > 1 ? words.map((word) => word[0] ?? "").join("") : (words[0] ?? "").slice(0, 2)
  return letters.slice(0, 2).toUpperCase()
}

const MAIN = [
  { label: "Home", Icon: LayoutGrid, to: "/" },
  { label: "Dossiers", Icon: Briefcase, to: "/dossiers" },
] as const

function AppSidebar() {
  const { pathname } = useLocation()
  const { setOpenMobile } = useSidebar()

  // Mobile sidebar is a controlled sheet. Navigating without closing it leaves
  // the destination under the drawer until the user dismisses it by hand.
  useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  return (
    <Sidebar collapsible="icon">
      {/* Icon mode leaves a 3rem rail; 12px of padding would squash the mark. */}
      <SidebarHeader className="p-3 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <img src="/job-kit-mark.png" alt="" className="size-7 shrink-0 object-contain" />
          <span className="truncate text-[15px] font-semibold group-data-[collapsible=icon]:hidden">Job Kit</span>
          <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>

      {/* The extra px-1 stacks with the group's own padding and pushes the
          collapsed rail's icons off-centre, so icon mode drops it. */}
      <SidebarContent className="gap-1 px-1 group-data-[collapsible=icon]:px-0">
        <SidebarGroup className="py-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {MAIN.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    isActive={pathname === item.to}
                    tooltip={item.label}
                    className={ITEM}
                    render={<NavLink to={item.to} />}
                  >
                    <item.Icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton size="lg" className="gap-2.5 rounded-lg data-[popup-open]:bg-sidebar-accent" />
                }
              >
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs">{initialsOf(USER.name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-[15px] font-medium text-foreground">{USER.name}</span>
                  <span className="truncate text-[13px] text-muted-foreground">{USER.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
              </DropdownMenuTrigger>

              <DropdownMenuContent side="top" align="end" sideOffset={8} className="w-60">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex items-center gap-2.5 py-2 font-normal">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">{initialsOf(USER.name)}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left leading-tight">
                      <span className="truncate text-[15px] font-medium text-foreground">{USER.name}</span>
                      <span className="truncate text-[13px] text-muted-foreground">{USER.email}</span>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Sparkles aria-hidden="true" />
                    Upgrade to Pro
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <BadgeCheck aria-hidden="true" />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard aria-hidden="true" />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell aria-hidden="true" />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <LogOut aria-hidden="true" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
