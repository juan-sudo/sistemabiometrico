"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface Props {
  label?: string
  className?: string
}

export function BackButton({ label = "", className }: Props) {
  const router = useRouter()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => router.back()}
      className={`flex items-center gap-2 ${className || ""}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  )
}
