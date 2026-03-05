"use client"

import { Building2 } from "lucide-react"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function TeamSwitcher({
  team,
}: {
  team: {
    name: string
    plan: string
    subtitle?: string
  }
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="h-auto rounded-2xl bg-transparent px-2 py-2 shadow-none hover:bg-transparent"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm">
            <Building2 className="size-5" />
          </div>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate text-base font-semibold tracking-tight text-slate-900">{team.name}</span>
            <span className="truncate text-xs font-medium uppercase tracking-[0.16em] text-emerald-700">
              {team.plan}
            </span>
            {team.subtitle ? (
              <span className="truncate pt-0.5 text-[11px] text-slate-500">{team.subtitle}</span>
            ) : null}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
