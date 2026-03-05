"use client"

import useUserStore from "@/stores/useUserStore"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { loginRequest } from "@/lib/api-client"

export function useLoginForm() {
  const setSession = useUserStore((state) => state.setSession)
  const router = useRouter()

  const [values, setValues] = useState({
    username: "",
    password: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      const data = await loginRequest(values.username.trim(), values.password)
      setSession({
        user: data.user,
        accessToken: data.access,
        refreshToken: data.refresh,
      })
      toast.success(`Bienvenido ${data.user?.username || "usuario"}`)
      router.replace("/dashboard")
      router.refresh()
    } catch (error) {
      const message = error?.message || "No se pudo iniciar sesion"
      if (error?.status >= 500) {
        console.error("Error al iniciar sesion:", error)
      }
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    values,
    isSubmitting,
    handleInputChange,
    handleSubmit,
  }
}
