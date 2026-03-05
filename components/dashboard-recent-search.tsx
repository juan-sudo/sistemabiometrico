"use client"

import * as React from "react"
import { Clock3, Search } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { getDashboardSearchEntries } from "@/components/dashboard-nav-config"
import { Input } from "@/components/ui/input"
import useUserStore from "@/stores/useUserStore"

const SESSION_KEY = "dashboard-recent-pages"
const MAX_ITEMS = 5

type RecentEntry = {
  title: string
  group: string
  url: string
}

const searchEntries = getDashboardSearchEntries()

export function DashboardRecentSearch() {
  const pathname = usePathname()
  const router = useRouter()
  const loggedUser = useUserStore((state) => state.user)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [query, setQuery] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const [recentItems, setRecentItems] = React.useState<RecentEntry[]>([])
  const hasFullAccess = Boolean(loggedUser?.is_superuser || loggedUser?.is_staff)
  const permissions = Array.isArray(loggedUser?.module_permissions) ? loggedUser.module_permissions : null

  const allowedEntries = React.useMemo(() => {
    type ModulePermission = { modulo?: string; puede_ver?: boolean } | null | undefined

    return searchEntries.filter((item) => {
      if (!item.moduleCode) return true
      if (hasFullAccess) return true
      if (permissions === null) return true
      return permissions.some(
        (permission: ModulePermission) =>
          permission?.modulo === item.moduleCode && permission?.puede_ver
      )
    })
  }, [hasFullAccess, permissions])

  React.useEffect(() => {
    const saved = window.sessionStorage.getItem(SESSION_KEY)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        setRecentItems(parsed.slice(0, MAX_ITEMS))
      }
    } catch {
      window.sessionStorage.removeItem(SESSION_KEY)
    }
  }, [])

  React.useEffect(() => {
    const matched = allowedEntries.find((item) => item.url === pathname)
    if (!matched) return

    setRecentItems((prev) => {
      const next = [
        { title: matched.title, group: matched.group, url: matched.url },
        ...prev.filter((item) => item.url !== matched.url),
      ].slice(0, MAX_ITEMS)
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
      return next
    })
  }, [allowedEntries, pathname])

  React.useEffect(() => {
    setRecentItems((prev) => {
      const next = prev.filter((item) =>
        allowedEntries.some((allowed) => allowed.url === item.url)
      )

      if (next.length !== prev.length) {
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
      }

      return next
    })
  }, [allowedEntries])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredItems = React.useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return recentItems
    return recentItems.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.group.toLowerCase().includes(term)
    )
  }, [query, recentItems])

  const handleOpenPage = (url: string) => {
    setIsOpen(false)
    setQuery("")
    router.push(url)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        type="search"
        value={query}
        placeholder="Buscar modulo o pagina..."
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value)
          setIsOpen(true)
        }}
        className="h-10 border-slate-200 bg-white pl-9 shadow-sm placeholder:text-slate-400"
      />

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Ultimas 5 carpetas visitadas
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {filteredItems.length === 0 ? (
              <div className="rounded-lg px-3 py-3 text-sm text-slate-500">
                {recentItems.length === 0 ? "Aun no hay paginas visitadas en esta sesion." : "No coincide con tu busqueda."}
              </div>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={item.url}
                  type="button"
                  onClick={() => handleOpenPage(item.url)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-slate-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">{item.title}</span>
                    <span className="block truncate text-xs text-slate-500">{item.group}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
