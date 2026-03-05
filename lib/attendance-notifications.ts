"use client"

export type MissingMarkSlot = {
  tipo: string
  label: string
  hora: string
}

export type MissingMarkNotification = {
  personal_id: number
  personal_nombre: string
  numero_documento: string
  sucursal: string
  area: string
  turno: string
  fecha: string
  total_esperadas: number
  total_registradas: number
  total_faltantes: number
  faltantes: MissingMarkSlot[]
}

export type MissingMarkNotificationPayload = {
  fecha: string
  total: number
  items: MissingMarkNotification[]
}

const STORAGE_KEY = "attendance-missing-notifications"
export const ATTENDANCE_NOTIFICATIONS_EVENT = "attendance-notifications-updated"

const emptyPayload: MissingMarkNotificationPayload = {
  fecha: "",
  total: 0,
  items: [],
}

export function readAttendanceNotifications(): MissingMarkNotificationPayload {
  if (typeof window === "undefined") {
    return emptyPayload
  }

  const raw = window.sessionStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return emptyPayload
  }

  try {
    const parsed = JSON.parse(raw)
    return normalizeAttendanceNotifications(parsed)
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY)
    return emptyPayload
  }
}

export function normalizeAttendanceNotifications(
  payload: unknown
): MissingMarkNotificationPayload {
  if (!payload || typeof payload !== "object") {
    return emptyPayload
  }

  const source = payload as {
    fecha?: unknown
    total?: unknown
    items?: unknown
  }

  const items = Array.isArray(source.items)
    ? source.items.filter((item) => item && typeof item === "object")
    : []

  return {
    fecha: typeof source.fecha === "string" ? source.fecha : "",
    total:
      typeof source.total === "number"
        ? source.total
        : items.length,
    items: items as MissingMarkNotification[],
  }
}

export function writeAttendanceNotifications(payload: unknown) {
  if (typeof window === "undefined") {
    return
  }

  const normalized = normalizeAttendanceNotifications(payload)
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  window.dispatchEvent(
    new CustomEvent(ATTENDANCE_NOTIFICATIONS_EVENT, { detail: normalized })
  )
}
