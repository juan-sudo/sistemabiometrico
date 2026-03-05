"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import useUserStore from "@/stores/useUserStore"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`)
    }
  }, [isAuthenticated, pathname, router])

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
