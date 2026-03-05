"use client"

import { useEffect, useMemo, useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { writeAttendanceNotifications } from "@/lib/attendance-notifications"
import { apiEndpoints, authRequest } from "@/lib/api-client"
import useUserStore from "@/stores/useUserStore"
import { toast } from "sonner"

type Dispositivo = {
  id: number
  nombre: string
  direccion: string
  puerto: number
  uso: string
  activo: boolean
}

const asArray = (x: unknown) =>
  Array.isArray(x) ? x : x && typeof x === "object" && Array.isArray((x as { results?: unknown[] }).results) ? (x as { results: unknown[] }).results : []

export default function Page() {
  const token = useUserStore((s) => s.accessToken)
  const [tab, setTab] = useState<"dispositivo" | "usb" | "excel">("dispositivo")
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [devices, setDevices] = useState<Dispositivo[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const loadDevices = async () => {
    if (!token) return
    const data = await authRequest(apiEndpoints.dispositivos, { token })
    const rows = (asArray(data) as Dispositivo[]).filter((item) => item.activo)
    setDevices(rows)
  }

  useEffect(() => {
    const run = async () => {
      if (!token) return setLoading(false)
      try {
        setLoading(true)
        await loadDevices()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo cargar dispositivos")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [token])

  const allSelected = useMemo(
    () => devices.length > 0 && selectedIds.length === devices.length,
    [devices, selectedIds]
  )

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const descargarMarcaciones = async () => {
    if (!token || selectedIds.length === 0) return
    try {
      setDownloading(true)
      const response = await authRequest(`${apiEndpoints.descargasMarcaciones}descargar-dispositivo/`, {
        method: "POST",
        body: { dispositivo_ids: selectedIds, clave_comunicacion: 0 },
        token,
      })
      writeAttendanceNotifications((response as { notificaciones?: unknown }).notificaciones)
      const totalCreadas = Number((response as { total_creadas?: number }).total_creadas || 0)
      const reportesActualizados = Number((response as { reportes_actualizados?: number }).reportes_actualizados || 0)
      const resultados = asArray((response as { resultados?: unknown[] }).resultados)
      const errores = resultados.filter(
        (item) => item && typeof item === "object" && (item as { estado?: string }).estado === "error"
      )
      if (errores.length > 0) {
        const primerError = errores[0] as { detalle?: string }
        toast.error(primerError.detalle || "Una o mas descargas fallaron")
      } else {
        toast.success(`Descarga completada. Marcaciones nuevas: ${totalCreadas}. Reportes actualizados: ${reportesActualizados}.`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo descargar marcaciones")
    } finally {
      setDownloading(false)
    }
  }

  const contentDispositivo = (
    <div className="space-y-4 rounded-b-xl border border-slate-300 bg-white p-3 md:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Seleccionados: <span className="font-semibold text-slate-900">{selectedIds.length}</span>
        </p>
        <Button
          type="button"
          className="bg-lime-600 hover:bg-lime-700"
          disabled={selectedIds.length === 0 || downloading}
          onClick={descargarMarcaciones}
        >
          {downloading ? "Descargando..." : "Descargar Marcaciones"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200">
        <table className="w-full min-w-[760px]">
          <thead className="bg-lime-500 text-white">
            <tr className="text-sm">
              <th className="w-10 px-3 py-2 text-left font-semibold">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => setSelectedIds(e.target.checked ? devices.map((d) => d.id) : [])}
                />
              </th>
              <th className="px-3 py-2 text-left font-semibold">Nombre</th>
              <th className="px-3 py-2 text-left font-semibold">IP / Dominio</th>
              <th className="px-3 py-2 text-left font-semibold">Puerto</th>
              <th className="px-3 py-2 text-left font-semibold">Uso Dispositivo</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="border-t border-slate-200 px-3 py-4 text-center text-sm text-slate-500">
                  Cargando dispositivos...
                </td>
              </tr>
            ) : devices.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="border-t border-slate-200 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                  />
                </td>
                <td className="border-t border-slate-200 px-3 py-2 text-slate-700">{item.nombre}</td>
                <td className="border-t border-slate-200 px-3 py-2 text-slate-700">{item.direccion}</td>
                <td className="border-t border-slate-200 px-3 py-2 text-slate-700">{item.puerto}</td>
                <td className="border-t border-slate-200 px-3 py-2 text-slate-700">
                  {item.uso === "ASISTENCIA" ? "Control de Asistencia" : "Control de Acceso"}
                </td>
              </tr>
            ))}
            {!loading && devices.length === 0 ? (
              <tr>
                <td colSpan={5} className="border-t border-slate-200 px-3 py-4 text-center text-sm text-slate-500">
                  No hay dispositivos activos.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )

  const contentPlaceholder = (
    <div className="rounded-b-xl border border-slate-300 bg-white p-4 text-sm text-slate-500">
      Modulo en construccion.
    </div>
  )

  if (!token) return <section className="p-6 text-sm text-slate-600">Inicia sesion para continuar.</section>

  return (
    <section className="min-h-[calc(100vh-7rem)] bg-[radial-gradient(circle_at_top_right,#dcfce7_0%,#f8fafc_45%,#eef2ff_100%)] p-3 md:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <header className="rounded-2xl border border-white/50 bg-white/80 p-5 shadow-lg backdrop-blur md:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
              <Download size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-800 md:text-3xl">
                Descargar Marcaciones
              </h1>
              <p className="text-sm text-slate-500">
                Descarga y registra marcaciones desde dispositivos biometricos en modo solo lectura.
              </p>
            </div>
          </div>
        </header>

        <div className="rounded-xl bg-transparent">
          <div className="inline-flex">
            <button
              onClick={() => setTab("dispositivo")}
              className={`border border-slate-300 px-4 py-2 text-sm font-semibold ${
                tab === "dispositivo" ? "bg-lime-500 text-white" : "bg-white text-slate-700"
              }`}
            >
              Dispositivo
            </button>
            <button
              onClick={() => setTab("usb")}
              className={`border border-l-0 border-slate-300 px-4 py-2 text-sm font-semibold ${
                tab === "usb" ? "bg-lime-500 text-white" : "bg-white text-slate-700"
              }`}
            >
              USB
            </button>
            <button
              onClick={() => setTab("excel")}
              className={`border border-l-0 border-slate-300 px-4 py-2 text-sm font-semibold ${
                tab === "excel" ? "bg-lime-500 text-white" : "bg-white text-slate-700"
              }`}
            >
              Importacion Excel
            </button>
          </div>

          {tab === "dispositivo" && contentDispositivo}
          {tab === "usb" && contentPlaceholder}
          {tab === "excel" && contentPlaceholder}
        </div>
      </div>
    </section>
  )
}
