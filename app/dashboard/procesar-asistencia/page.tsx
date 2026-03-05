"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, Cog, Search } from "lucide-react"
import { toast } from "sonner"
import { apiEndpoints, authRequest } from "@/lib/api-client"
import useUserStore from "@/stores/useUserStore"

type Personal = {
  id: number
  empresa: number
  sucursal: number
  area: number
  numero_documento: string
  codigo_empleado: string
  nombres_completos: string
}

type Catalog = { id: number; nombre?: string; razon_social?: string }

const asArray = (x: unknown) =>
  Array.isArray(x) ? x : x && typeof x === "object" && Array.isArray((x as { results?: unknown[] }).results) ? (x as { results: unknown[] }).results : []

const toInputDate = (value: Date) => value.toISOString().slice(0, 10)
const toSlashDate = (value: string) => {
  const [year, month, day] = value.split("-")
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}
const getPeriodFromRange = (start: string) => {
  const [year, month] = start.split("-")
  return { anio: year || String(new Date().getFullYear()), mes: String(Number(month || "1")) }
}

export default function ProcesarAsistenciaPage() {
  const token = useUserStore((s) => s.accessToken)
  const today = new Date()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [search, setSearch] = useState("")
  const [fechaInicio, setFechaInicio] = useState(toInputDate(new Date(today.getFullYear(), today.getMonth(), 1)))
  const [fechaFin, setFechaFin] = useState(toInputDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)))
  const [personales, setPersonales] = useState<Personal[]>([])
  const [empresas, setEmpresas] = useState<Catalog[]>([])
  const [sucursales, setSucursales] = useState<Catalog[]>([])
  const [areas, setAreas] = useState<Catalog[]>([])
  const [selected, setSelected] = useState<Record<number, boolean>>({})

  useEffect(() => {
    const run = async () => {
      if (!token) return setLoading(false)
      try {
        const [p, e, s, a] = await Promise.all([
          authRequest(apiEndpoints.personales, { token }),
          authRequest(apiEndpoints.empresas, { token }),
          authRequest(apiEndpoints.sucursales, { token }),
          authRequest(apiEndpoints.areas, { token }),
        ])
        setPersonales(asArray(p) as Personal[])
        setEmpresas(asArray(e) as Catalog[])
        setSucursales(asArray(s) as Catalog[])
        setAreas(asArray(a) as Catalog[])
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo cargar personal")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [token])

  const empresaMap = useMemo(() => Object.fromEntries(empresas.map((item) => [item.id, item.razon_social || "-"])), [empresas])
  const sucursalMap = useMemo(() => Object.fromEntries(sucursales.map((item) => [item.id, item.nombre || "-"])), [sucursales])
  const areaMap = useMemo(() => Object.fromEntries(areas.map((item) => [item.id, item.nombre || "-"])), [areas])

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return personales
    return personales.filter((item) =>
      `${empresaMap[item.empresa] || ""} ${sucursalMap[item.sucursal] || ""} ${areaMap[item.area] || ""} ${item.numero_documento} ${item.codigo_empleado} ${item.nombres_completos}`
        .toLowerCase()
        .includes(term)
    )
  }, [personales, search, empresaMap, sucursalMap, areaMap])

  const selectedIds = useMemo(
    () => filteredRows.filter((item) => selected[item.id]).map((item) => item.id),
    [filteredRows, selected]
  )

  const toggleAll = (checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev }
      filteredRows.forEach((item) => {
        next[item.id] = checked
      })
      return next
    })
  }

  const handleProcesar = async () => {
    if (!token || selectedIds.length === 0) return
    const periodo = getPeriodFromRange(fechaInicio)
    try {
      setProcessing(true)
      let ok = 0
      for (const personalId of selectedIds) {
        await authRequest(`${apiEndpoints.personales}${personalId}/reporte-general/?anio=${periodo.anio}&mes=${periodo.mes}`, { token })
        ok += 1
      }
      toast.success(`Se procesaron ${ok} trabajador(es) entre ${toSlashDate(fechaInicio)} y ${toSlashDate(fechaFin)}.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo procesar asistencia")
    } finally {
      setProcessing(false)
    }
  }

  if (!token) return <section className="p-6 text-sm text-slate-600">Inicia sesion para continuar.</section>

  return (
    <section className="min-h-[calc(100vh-7rem)] bg-white p-3 md:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <header className="rounded-2xl border border-white/50 bg-white p-5 shadow-lg md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                <Cog size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-800 md:text-3xl">Procesar asistencia</h1>
                <p className="text-sm text-slate-500">Genera el resumen mensual de asistencia y llena las tablas del reporte.</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-300 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-end">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span>Inicio</span>
            <input className="h-10 rounded-md border border-slate-400 px-3 text-sm" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span>Fin</span>
            <input className="h-10 rounded-md border border-slate-400 px-3 text-sm" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>
          <button
            onClick={handleProcesar}
            disabled={selectedIds.length === 0 || processing}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-lime-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-lime-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CalendarDays size={16} />
            {processing ? "Procesando..." : "Procesar"}
          </button>
        </div>

        <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-slate-700">Buscar personal</label>
          <div className="relative md:max-w-lg">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por empresa, sucursal, area, documento, codigo o nombre"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full min-w-[1120px]">
              <thead className="sticky top-0 z-10 bg-teal-700 text-white">
                <tr className="text-sm">
                  <th className="w-14 border-r border-lime-400 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={filteredRows.length > 0 && selectedIds.length === filteredRows.length}
                      onChange={(e) => toggleAll(e.target.checked)}
                      aria-label="Seleccionar todos"
                    />
                  </th>
                  <th className="border-r border-lime-400 px-3 py-3 text-left font-semibold">Empresa</th>
                  <th className="border-r border-lime-400 px-3 py-3 text-left font-semibold">Sucursal</th>
                  <th className="border-r border-lime-400 px-3 py-3 text-left font-semibold">Area</th>
                  <th className="border-r border-lime-400 px-3 py-3 text-left font-semibold">Numero de Documento</th>
                  <th className="border-r border-lime-400 px-3 py-3 text-left font-semibold">Codigo de Equipo</th>
                  <th className="px-3 py-3 text-left font-semibold">Nombres Completos</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="border-t border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                      Cargando personal...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border-t border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                      No se encontraron trabajadores.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? "bg-slate-50/50" : "bg-white"}>
                      <td className="border-t border-r border-slate-200 px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={!!selected[item.id]}
                          onChange={(e) => setSelected((prev) => ({ ...prev, [item.id]: e.target.checked }))}
                          aria-label={`Seleccionar ${item.nombres_completos}`}
                        />
                      </td>
                      <td className="border-t border-r border-slate-200 px-3 py-3 text-slate-700">{empresaMap[item.empresa] || "-"}</td>
                      <td className="border-t border-r border-slate-200 px-3 py-3 text-slate-700">{sucursalMap[item.sucursal] || "-"}</td>
                      <td className="border-t border-r border-slate-200 px-3 py-3 text-slate-700">{areaMap[item.area] || "-"}</td>
                      <td className="border-t border-r border-slate-200 px-3 py-3 text-slate-700">{item.numero_documento || "-"}</td>
                      <td className="border-t border-r border-slate-200 px-3 py-3 text-slate-700">{item.codigo_empleado || "-"}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-slate-700">{item.nombres_completos || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="px-1 text-sm font-semibold text-slate-700">Registros: {filteredRows.length}</p>
      </div>
    </section>
  )
}

