"use client"

import * as React from "react"

import { dashboardNavItems } from "@/components/dashboard-nav-config"
import { NavMain } from "@/components/nav-main"

import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import useUserStore from "@/stores/useUserStore"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  team: {
    name: "SIGA",
    plan: "Municipalidad",
    subtitle: "Sistema de Gestion Administrativa",
  },
  navMain: dashboardNavItems,

}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const loggedUser = useUserStore((state) => state.user)
  const hasFullAccess = Boolean(loggedUser?.is_superuser || loggedUser?.is_staff)
  const permissions = Array.isArray(loggedUser?.module_permissions) ? loggedUser.module_permissions : null
  type ModulePermission = { modulo?: string; puede_ver?: boolean } | null | undefined
  const user = {
    name: loggedUser?.username || loggedUser?.name || data.user.name,
    email: loggedUser?.email || data.user.email,
    avatar: data.user.avatar,
  }

  const canViewModule = (moduleCode?: string) => {
    if (!moduleCode) return true
    if (hasFullAccess) return true
    if (permissions === null) return true
    const found = permissions.find((item: ModulePermission) => item?.modulo === moduleCode)
    return Boolean(found?.puede_ver)
  }

  const navItems = data.navMain
    .map((group) => ({
      ...group,
      items: group.items?.filter((item) => canViewModule(item.moduleCode)),
    }))
    .filter((group) => (group.items ? group.items.length > 0 : true))

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200/80 bg-white/95" {...props}>
      <SidebarHeader className="border-b border-slate-200/70 p-2">
        <TeamSwitcher team={data.team} />
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter className="border-t border-slate-200/70 p-2">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
