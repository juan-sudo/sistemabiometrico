"use client"

import * as React from "react"
import { AlertTriangle, Bell } from "lucide-react"

import {
  ATTENDANCE_NOTIFICATIONS_EVENT,
  type MissingMarkNotificationPayload,
  normalizeAttendanceNotifications,
  readAttendanceNotifications,
  writeAttendanceNotifications,
} from "@/lib/attendance-notifications"
import { apiEndpoints, authRequest } from "@/lib/api-client"
import useUserStore from "@/stores/useUserStore"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const emptyPayload: MissingMarkNotificationPayload = {
  fecha: "",
  total: 0,
  items: [],
}

export function NotificationsMenu() {
  const token = useUserStore((state) => state.accessToken)
  const [payload, setPayload] = React.useState<MissingMarkNotificationPayload>(emptyPayload)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    setPayload(readAttendanceNotifications())

    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<MissingMarkNotificationPayload>
      setPayload(normalizeAttendanceNotifications(customEvent.detail))
    }

    window.addEventListener(ATTENDANCE_NOTIFICATIONS_EVENT, handleUpdate as EventListener)
    return () =>
      window.removeEventListener(ATTENDANCE_NOTIFICATIONS_EVENT, handleUpdate as EventListener)
  }, [])

  const refreshNotifications = React.useCallback(async () => {
    if (!token) return

    try {
      setLoading(true)
      const response = await authRequest(apiEndpoints.notificacionesMarcacionesFaltantes, { token })
      writeAttendanceNotifications(response)
    } catch {
      // La campana no debe romper el layout si falla la consulta.
    } finally {
      setLoading(false)
    }
  }, [token])

  return (
    <DropdownMenu onOpenChange={(open) => {
      if (open) {
        void refreshNotifications()
      }
    }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg border border-slate-200 hover:bg-slate-50">
          <Bell className="h-4 w-4" />
          {payload.total > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {payload.total > 9 ? "9+" : payload.total}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] rounded-xl">
        <DropdownMenuLabel className="flex items-center justify-between gap-3">
          <span>Notificaciones</span>
          <span className="text-xs font-medium text-slate-500">
            {payload.total} pendiente{payload.total === 1 ? "" : "s"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[24rem] overflow-y-auto p-1">
          {loading ? (
            <div className="px-3 py-3 text-sm text-slate-500">Cargando notificaciones...</div>
          ) : payload.items.length === 0 ? (
            <div className="px-3 py-3 text-sm text-slate-500">
              No hay personal con marcaciones faltantes hoy.
            </div>
          ) : (
            payload.items.map((item) => (
              <div
                key={`${item.personal_id}-${item.fecha}`}
                className="rounded-lg border border-slate-200 px-3 py-3 text-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800">{item.personal_nombre}</p>
                    <p className="truncate text-xs text-slate-500">
                      DNI: {item.numero_documento} | {item.area}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Turno: {item.turno} | Registradas: {item.total_registradas}/{item.total_esperadas}
                    </p>
                    <p className="mt-2 text-xs font-medium text-rose-700">
                      Falta: {item.faltantes.map((slot) => `${slot.label} (${slot.hora})`).join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
