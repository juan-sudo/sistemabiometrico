"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, Download, FileText, Search } from "lucide-react"
import { toast } from "sonner"
import { apiEndpoints, authRequest } from "@/lib/api-client"
import { openPayrollSlipPrint, type PayrollSlipPayload } from "@/lib/payroll-slip"
import useUserStore from "@/stores/useUserStore"

type Personal = {
  id: number
  numero_documento: string
  nombres_completos: string
  area: number
  tipo_trabajador: number
}

type Area = { id: number; nombre: string }
type TipoTrabajador = { id: number; descripcion: string }
type Boleta = { id: number; personal: number; anio: number; mes: number; sueldo_base: string | number }

type PersonalBoleta = {
  id: number
  documento: string
  nombres: string
  area: string
  tipoTrabajador: string
  sueldoBase: number
}

const monthOptions = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
]

const getYearOptions = () => {
  const y = new Date().getFullYear()
  return [y - 1, y, y + 1]
}

const PEN = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
})

const asArray = (x: unknown) =>
  Array.isArray(x) ? x : x && typeof x === "object" && Array.isArray((x as { results?: unknown[] }).results) ? (x as { results: unknown[] }).results : []

export default function BoletaMensualPage() {
  const token = useUserStore((s) => s.accessToken)
  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [personales, setPersonales] = useState<Personal[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [tiposTrabajador, setTiposTrabajador] = useState<TipoTrabajador[]>([])
  const [boletas, setBoletas] = useState<Boleta[]>([])

  const loadBase = async () => {
    if (!token) return
    const [p, a, t] = await Promise.all([
      authRequest(apiEndpoints.personales, { token }),
      authRequest(apiEndpoints.areas, { token }),
      authRequest(apiEndpoints.tiposTrabajador, { token }),
    ])
    setPersonales(asArray(p) as Personal[])
    setAreas(asArray(a) as Area[])
    setTiposTrabajador(asArray(t) as TipoTrabajador[])
  }

  const loadBoletas = async () => {
    if (!token) return
    const data = await authRequest(`${apiEndpoints.boletasMensuales}?anio=${year}&mes=${Number(month)}`, { token })
    setBoletas(asArray(data) as Boleta[])
  }

  useEffect(() => {
    const run = async () => {
      if (!token) return setLoading(false)
      try {
        setLoading(true)
        await loadBase()
        await loadBoletas()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo cargar informacion")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [token])

  useEffect(() => {
    if (!token) return
    loadBoletas().catch(() => {})
  }, [month, year, token])

  const areaMap = useMemo(() => Object.fromEntries(areas.map((x) => [x.id, x.nombre])), [areas])
  const tipoMap = useMemo(() => Object.fromEntries(tiposTrabajador.map((x) => [x.id, x.descripcion])), [tiposTrabajador])
  const boletaByPersonal = useMemo(() => Object.fromEntries(boletas.map((x) => [x.personal, x])), [boletas])

  const rows = useMemo<PersonalBoleta[]>(() => {
    return personales.map((p) => {
      const b = boletaByPersonal[p.id]
      const sueldo = b ? Number(b.sueldo_base || 0) : 0
      return {
        id: p.id,
        documento: p.numero_documento,
        nombres: p.nombres_completos,
        area: areaMap[p.area] || "-",
        tipoTrabajador: tipoMap[p.tipo_trabajador] || "-",
        sueldoBase: Number.isFinite(sueldo) ? sueldo : 0,
      }
    })
  }, [personales, boletaByPersonal, areaMap, tipoMap])

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((x) => `${x.nombres} ${x.documento} ${x.area}`.toLowerCase().includes(term))
  }, [rows, search])

  const selectedIds = useMemo(
    () => filteredRows.filter((item) => selected[item.id]).map((item) => item.id),
    [filteredRows, selected]
  )

  const toggleAllVisible = (checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev }
      filteredRows.forEach((item) => {
        next[item.id] = checked
      })
      return next
    })
  }

  const getPeriodo = () => {
    const m = monthOptions.find((x) => x.value === month)?.label ?? month
    return `${m} ${year}`
  }

  const handleGenerarBoletas = async () => {
    if (!token || selectedIds.length === 0) return
    try {
      setGenerating(true)
      const res = await authRequest(`${apiEndpoints.boletasMensuales}generar/`, {
        method: "POST",
        body: {
          anio: Number(year),
          mes: Number(month),
          personal_ids: selectedIds,
          sueldo_base: 0,
        },
        token,
      })
      await loadBoletas()
      const created = Number((res as { creados?: number }).creados || 0)
      const existing = Number((res as { existentes?: number }).existentes || 0)
      toast.success(`Periodo ${getPeriodo()}: ${created} boleta(s) creada(s), ${existing} existente(s).`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo generar boletas")
    } finally {
      setGenerating(false)
    }
  }

  const getSelectedRows = () => rows.filter((x) => selectedIds.includes(x.id))

  const handleDescargarExcel = () => {
    if (selectedIds.length === 0) return
    const selectedRows = getSelectedRows()
    const lines = [
      "documento,nombres,area,tipo_trabajador,sueldo_base,periodo",
      ...selectedRows.map((x) =>
        `"${x.documento}","${x.nombres.replace(/"/g, '""')}","${x.area}","${x.tipoTrabajador}",${x.sueldoBase},"${getPeriodo()}"`
      ),
    ]
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `boletas_${year}_${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDescargarPdf = async () => {
    if (selectedIds.length === 0) return
    if (selectedIds.length === 1 && token) {
      try {
        const resumen = await authRequest(
          `${apiEndpoints.personales}${selectedIds[0]}/resumen-planilla/?anio=${year}&mes=${Number(month)}`,
          { token }
        )
        openPayrollSlipPrint(resumen as PayrollSlipPayload)
        return
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo generar la boleta individual")
        return
      }
    }

    const selectedRows = getSelectedRows()
    const htmlRows = selectedRows
      .map(
        (x) => `
          <tr>
            <td>${x.documento}</td>
            <td>${x.nombres}</td>
            <td>${x.area}</td>
            <td>${x.tipoTrabajador}</td>
            <td style="text-align:right">${PEN.format(x.sueldoBase)}</td>
          </tr>
        `
      )
      .join("")

    const win = window.open("", "_blank", "width=1000,height=700")
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>Boletas ${getPeriodo()}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin: 0 0 8px; font-size: 22px; }
            p { margin: 0 0 16px; color: #334155; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 13px; }
            th { background: #65a30d; color: white; text-align: left; }
          </style>
        </head>
        <body>
          <h1>Boleta de personal por mes</h1>
          <p>Periodo: ${getPeriodo()} | Seleccionados: ${selectedRows.length}</p>
          <table>
            <thead>
              <tr>
                <th>Documento</th>
                <th>Nombres completos</th>
                <th>Area</th>
                <th>Tipo trabajador</th>
                <th>Sueldo base</th>
              </tr>
            </thead>
            <tbody>${htmlRows}</tbody>
          </table>
          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `)
    win.document.close()
  }

  if (!token) return <section className="p-6 text-sm text-slate-600">Inicia sesion para continuar.</section>

  return (
    <section className="min-h-[calc(100vh-7rem)] bg-[radial-gradient(circle_at_top_right,#dcfce7_0%,#f8fafc_45%,#eef2ff_100%)] p-3 md:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <header className="rounded-2xl border border-white/50 bg-white/80 p-5 shadow-lg backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                <FileText size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-800 md:text-3xl">Boleta de personal por mes</h1>
                <p className="text-sm text-slate-500">Genera y descarga boletas para el periodo seleccionado.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleGenerarBoletas}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={selectedIds.length === 0 || generating}
              >
                <CalendarDays size={16} />
                {generating ? "Generando..." : "Generar boletas"}
              </button>
              <button
                onClick={handleDescargarPdf}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={selectedIds.length === 0}
              >
                <Download size={16} />
                Descargar PDF
              </button>
              <button
                onClick={handleDescargarExcel}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={selectedIds.length === 0}
              >
                <Download size={16} />
                Descargar Excel
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Mes</label>
            <select className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={month} onChange={(e) => setMonth(e.target.value)}>
              {monthOptions.map((x) => (
                <option key={x.value} value={x.value}>{x.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Año</label>
            <select className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={year} onChange={(e) => setYear(e.target.value)}>
              {getYearOptions().map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Buscar personal</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input className="h-10 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, documento o area" />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full min-w-[900px]">
              <thead className="sticky top-0 z-10 bg-teal-700 text-white">
                <tr className="text-sm">
                  <th className="w-14 px-4 py-3 text-center">
                    <input type="checkbox" checked={filteredRows.length > 0 && selectedIds.length === filteredRows.length} onChange={(e) => toggleAllVisible(e.target.checked)} aria-label="Seleccionar todos" />
                  </th>
                  <th className="w-44 px-4 py-3 text-left font-semibold">Documento</th>
                  <th className="px-4 py-3 text-left font-semibold">Nombres completos</th>
                  <th className="w-40 px-4 py-3 text-left font-semibold">Area</th>
                  <th className="w-40 px-4 py-3 text-left font-semibold">Tipo trabajador</th>
                  <th className="w-40 px-4 py-3 text-right font-semibold">Sueldo base</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="border-t border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                      Cargando personal...
                    </td>
                  </tr>
                ) : filteredRows.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="border-t border-slate-200 px-4 py-3 text-center">
                      <input type="checkbox" checked={!!selected[item.id]} onChange={(e) => setSelected((prev) => ({ ...prev, [item.id]: e.target.checked }))} aria-label={`Seleccionar ${item.nombres}`} />
                    </td>
                    <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.documento}</td>
                    <td className="border-t border-slate-200 px-4 py-3 font-medium text-slate-700">{item.nombres}</td>
                    <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.area}</td>
                    <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.tipoTrabajador}</td>
                    <td className="border-t border-slate-200 px-4 py-3 text-right text-slate-700">{PEN.format(item.sueldoBase)}</td>
                  </tr>
                ))}
                {!loading && filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="border-t border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                      No se encontraron registros con el filtro aplicado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="px-1 text-sm font-semibold text-slate-600">
          Periodo: {getPeriodo()} | Seleccionados: {selectedIds.length}
        </p>
      </div>
    </section>
  )
}

