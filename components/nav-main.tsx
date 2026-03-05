"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo } from "react"

import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()

  const matchesPath = (url: string) => {
    if (!url || url === "#") return false
    if (pathname === url) return true
    return pathname.startsWith(`${url}/`)
  }

  const activeUrl = useMemo(() => {
    const subItemUrls = items.flatMap((item) => item.items?.map((subItem) => subItem.url) ?? [])
    const matchedUrls = subItemUrls.filter((url) => matchesPath(url))
    if (matchedUrls.length === 0) return null
    return matchedUrls.sort((a, b) => b.length - a.length)[0]
  }, [items, pathname])

  const isSubItemActive = (url: string) => activeUrl === url

  return (
    <SidebarGroup className="px-0">
      <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Plataforma</SidebarGroupLabel>
      <SidebarMenu className="space-y-1">
        {items.map((item) => {
          const hasActiveSubItem = !!item.items?.some((subItem) => isSubItemActive(subItem.url))
          return (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive || hasActiveSubItem}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={hasActiveSubItem}
                  className="h-9 rounded-lg px-2.5 font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 data-[active=true]:bg-emerald-50 data-[active=true]:text-emerald-700"
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="ml-2 border-l border-slate-200/80 pl-2">
                  {item.items?.map((subItem) => {
                    const isActive = isSubItemActive(subItem.url)
                    return (
                    <SidebarMenuSubItem key={subItem.title} className="relative">
                      {isActive && <span className="absolute -left-2 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-emerald-500" />}
                      <SidebarMenuSubButton
                        asChild
                        isActive={isActive}
                        className="rounded-md px-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 data-[active=true]:bg-emerald-50 data-[active=true]:font-semibold data-[active=true]:text-emerald-700"
                      >
                        <Link href={subItem.url}>
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )})}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        )})}
      </SidebarMenu>
    </SidebarGroup>
  )
}
