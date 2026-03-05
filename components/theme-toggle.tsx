"use client"

import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

import { useTheme } from "@/components/theme-provider"

export function ThemeToggleButton({
  className,
}: {
  className?: string
}) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(className)}
      aria-label={isDark ? "Activar tema claro" : "Activar tema oscuro"}
      title={isDark ? "Cambiar a claro" : "Cambiar a oscuro"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}

export function ThemeToggleMenuItem() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <DropdownMenuItem onClick={toggleTheme}>
      {isDark ? <Sun /> : <Moon />}
      {isDark ? "Tema claro" : "Tema oscuro"}
    </DropdownMenuItem>
  )
}
