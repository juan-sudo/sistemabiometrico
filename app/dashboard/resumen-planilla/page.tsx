"use client"

import { Download, FileText, Search } from "lucide-react"
import { type ReactNode, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { apiEndpoints, authRequest } from "@/lib/api-client"
import { type PayrollSlipPayload } from "@/lib/payroll-slip"
import { openPersonalReportPrint, type ReporteGeneralPayload } from "@/lib/report-personal"
import useUserStore from "@/stores/useUserStore"

type Personal = {
  id: number
  numero_documento: string
  nombres_completos: string
}

type ResumenPayload = PayrollSlipPayload & {
  resumen: {
    dias_periodo: number
    dias_con_marcacion: number
    dias_justificados: number
    dias_descanso_medico: number
    dias_falta: number
  }
  faltas: string[]
  justificaciones: {
    id: number
    motivo: string
    estado: string
    fecha_inicio: string
    fecha_fin: string
    dias: number
  }[]
  descansos_medicos: {
    id: number
    motivo: string
    fecha_inicio: string
    fecha_fin: string
    dias: number
    citt: string
  }[]
  marcaciones: {
    id: number
    fecha_hora: string
    tipo_evento: string
  }[]
}

const asArray = (x: unknown) =>
  Array.isArray(x) ? x : x && typeof x === "object" && Array.isArray((x as { results?: unknown[] }).results) ? (x as { results: unknown[] }).results : []

const monthOptions = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
]

export default function Page() {
  const token = useUserStore((s) => s.accessToken)
  const today = new Date()
  const [loading, setLoading] = useState(true)
  const [loadingResumen, setLoadingResumen] = useState(false)
  const [personales, setPersonales] = useState<Personal[]>([])
  const [search, setSearch] = useState("")
  const [openTrabajadorModal, setOpenTrabajadorModal] = useState(false)
  const [modalSearch, setModalSearch] = useState("")
  const [personalId, setPersonalId] = useState("")
  const [mes, setMes] = useState(String(today.getMonth() + 1))
  const [anio, setAnio] = useState(String(today.getFullYear()))
  const [resumen, setResumen] = useState<ResumenPayload | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!token) return setLoading(false)
      try {
        setLoading(true)
        const data = await authRequest(apiEndpoints.personales, { token })
        const rows = asArray(data) as Personal[]
        setPersonales(rows)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo cargar personal")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [token])

  const filteredPersonales = useMemo(() => {
    const term = modalSearch.trim().toLowerCase()
    if (!term) return personales
    return personales.filter((item) =>
      `${item.numero_documento} ${item.nombres_completos}`.toLowerCase().includes(term)
    )
  }, [personales, modalSearch])

  const selectedPersonal = useMemo(
    () => personales.find((item) => String(item.id) === personalId) || null,
    [personales, personalId]
  )

  useEffect(() => {
    const run = async () => {
      if (!token || !personalId) {
        setResumen(null)
        return
      }
      try {
        setLoadingResumen(true)
        const data = await authRequest(
          `${apiEndpoints.personales}${personalId}/resumen-planilla/?anio=${anio}&mes=${mes}`,
          { token }
        )
        setResumen(data as ResumenPayload)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo cargar el resumen")
      } finally {
        setLoadingResumen(false)
      }
    }
    run()
  }, [token, personalId, anio, mes])

  const handleDescargarExcel = () => {
    if (!resumen) return
    const lines = [
      "campo,valor",
      `"Trabajador","${resumen.personal.nombres_completos}"`,
      `"DNI","${resumen.personal.numero_documento}"`,
      `"Codigo","${resumen.personal.codigo_empleado || "-"}"`,
      `"Anio","${resumen.periodo.anio}"`,
      `"Mes","${resumen.periodo.mes}"`,
      `"Dias con marcacion","${resumen.resumen.dias_con_marcacion}"`,
      `"Dias justificados","${resumen.resumen.dias_justificados}"`,
      `"Descanso medico","${resumen.resumen.dias_descanso_medico}"`,
      `"Faltas","${resumen.resumen.dias_falta}"`,
      `"Sueldo base","${resumen.boleta.sueldo_base}"`,
      `"Neto a pagar","${resumen.boleta.neto_pagar}"`,
    ]
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `resumen-${resumen.personal.numero_documento}-${resumen.periodo.anio}-${resumen.periodo.mes}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDescargarPdf = () => {
    if (!resumen || !token || !personalId) return
    authRequest(`${apiEndpoints.personales}${personalId}/reporte-general/?anio=${anio}&mes=${mes}`, { token })
      .then((data) => {
        openPersonalReportPrint(data as ReporteGeneralPayload)
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "No se pudo generar el reporte PDF")
      })
  }

  if (!token) return <section className="p-6 text-sm text-slate-600">Inicia sesion para continuar.</section>

  return (
    <section className="min-h-[calc(100vh-7rem)] bg-[radial-gradient(circle_at_top_right,#dcfce7_0%,#f8fafc_45%,#eef2ff_100%)] p-3 md:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <header className="rounded-2xl border border-white/50 bg-white/80 p-5 shadow-lg backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                <FileText size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-800 md:text-3xl">Resumen</h1>
                <p className="text-sm text-slate-500">Consulta el consolidado mensual de un trabajador para generar su boleta.</p>
              </div>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
              <Button
                type="button"
                variant="outline"
                className="w-full border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 sm:w-auto"
                onClick={handleDescargarPdf}
                disabled={!resumen}
              >
                <Download size={16} className="mr-2" />
                Descargar PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 sm:w-auto"
                onClick={handleDescargarExcel}
                disabled={!resumen}
              >
                <Download size={16} className="mr-2" />
                Descargar Excel
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Buscar personal</label>
            <Dialog open={openTrabajadorModal} onOpenChange={setOpenTrabajadorModal}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 text-left text-sm text-slate-700"
                >
                  <span className={selectedPersonal ? "text-slate-800" : "text-slate-400"}>
                    {selectedPersonal
                      ? `${selectedPersonal.numero_documento} - ${selectedPersonal.nombres_completos}`
                      : "Seleccionar trabajador"}
                  </span>
                  <Search size={16} className="text-slate-400" />
                </button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100vw-1.5rem)] max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Seleccionar trabajador</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      className="h-10 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm"
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                      placeholder="Buscar por DNI o nombre"
                    />
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="max-h-[420px] overflow-auto">
                      <table className="w-full min-w-[560px]">
                        <thead className="sticky top-0 z-10 bg-teal-700 text-white">
                          <tr className="text-xs">
                            <th className="px-3 py-2 text-left font-semibold">DNI</th>
                            <th className="px-3 py-2 text-left font-semibold">Nombres completos</th>
                            <th className="w-28 px-3 py-2 text-center font-semibold">Accion</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPersonales.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="border-t border-slate-200 px-3 py-4 text-center text-sm text-slate-500">
                                No se encontraron trabajadores.
                              </td>
                            </tr>
                          ) : filteredPersonales.map((item, index) => (
                            <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                              <td className="border-t border-slate-200 px-3 py-2 text-sm text-slate-700">{item.numero_documento}</td>
                              <td className="border-t border-slate-200 px-3 py-2 text-sm text-slate-700">{item.nombres_completos}</td>
                              <td className="border-t border-slate-200 px-3 py-2 text-center">
                                <Button
                                  type="button"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => {
                                    setPersonalId(String(item.id))
                                    setSearch(`${item.numero_documento} - ${item.nombres_completos}`)
                                    setOpenTrabajadorModal(false)
                                  }}
                                >
                                  Seleccionar
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Trabajador</label>
            <input
              className="h-10 w-full rounded-md border border-input bg-slate-50 px-3 text-sm text-slate-700"
              value={search}
              readOnly
              placeholder="Sin trabajador seleccionado"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Mes</label>
              <select className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={mes} onChange={(e) => setMes(e.target.value)}>
                {monthOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Anio</label>
              <select className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={anio} onChange={(e) => setAnio(e.target.value)}>
                {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Cargando resumen...
          </div>
        ) : !personalId ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Selecciona un trabajador para ver su resumen.
          </div>
        ) : loadingResumen || !resumen ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Cargando resumen...
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <SummaryCard title="Dias con marcacion" value={String(resumen.resumen.dias_con_marcacion)} tone="emerald" />
              <SummaryCard title="Dias justificados" value={String(resumen.resumen.dias_justificados)} tone="blue" />
              <SummaryCard title="Descanso medico" value={String(resumen.resumen.dias_descanso_medico)} tone="amber" />
              <SummaryCard title="Faltas" value={String(resumen.resumen.dias_falta)} tone="rose" />
              <SummaryCard title="Neto a pagar" value={`S/ ${Number(resumen.boleta.neto_pagar || 0).toFixed(2)}`} tone="slate" />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <Panel title="Datos del trabajador">
                <DataRow label="Codigo" value={resumen.personal.codigo_empleado || "-"} />
                <DataRow label="DNI" value={resumen.personal.numero_documento || "-"} />
                <DataRow label="Nombres" value={resumen.personal.nombres_completos || "-"} />
                <DataRow label="Boleta" value={resumen.boleta.estado} />
                <DataRow label="Sueldo base" value={`S/ ${Number(resumen.boleta.sueldo_base || 0).toFixed(2)}`} />
              </Panel>

              <Panel title="Faltas del periodo">
                <div className="max-h-56 space-y-2 overflow-auto">
                  {resumen.faltas.length === 0 ? (
                    <p className="text-sm text-slate-500">No hay faltas registradas.</p>
                  ) : resumen.faltas.map((item) => (
                    <div key={item} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                      {item}
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Marcaciones del periodo">
                <div className="max-h-56 space-y-2 overflow-auto">
                  {resumen.marcaciones.length === 0 ? (
                    <p className="text-sm text-slate-500">No hay marcaciones en el periodo.</p>
                  ) : resumen.marcaciones.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <p className="font-medium">{new Date(item.fecha_hora).toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{item.tipo_evento}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Panel title="Justificaciones">
                <TableBlock
                  headers={["Motivo", "Estado", "Inicio", "Fin", "Dias"]}
                  rows={resumen.justificaciones.map((item) => [item.motivo, item.estado, item.fecha_inicio, item.fecha_fin, String(item.dias)])}
                  emptyLabel="No hay justificaciones en el periodo."
                />
              </Panel>

              <Panel title="Descansos medicos">
                <TableBlock
                  headers={["Motivo", "Inicio", "Fin", "Dias", "CITT"]}
                  rows={resumen.descansos_medicos.map((item) => [item.motivo, item.fecha_inicio, item.fecha_fin, String(item.dias), item.citt || "-"])}
                  emptyLabel="No hay descansos medicos en el periodo."
                />
              </Panel>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function SummaryCard({ title, value, tone }: { title: string; value: string; tone: "emerald" | "blue" | "amber" | "rose" | "slate" }) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "blue"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : tone === "rose"
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-slate-200 bg-slate-50 text-slate-700"

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wider">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-slate-700">{title}</p>
      {children}
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 text-sm last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  )
}

function TableBlock({ headers, rows, emptyLabel }: { headers: string[]; rows: string[][]; emptyLabel: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="max-h-72 overflow-auto">
        <table className="w-full min-w-[520px]">
          <thead className="sticky top-0 z-10 bg-teal-700 text-white">
            <tr className="text-xs">
              {headers.map((header) => (
                <th key={header} className="px-3 py-2 text-left font-semibold">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="border-t border-slate-200 px-3 py-4 text-center text-sm text-slate-500">
                  {emptyLabel}
                </td>
              </tr>
            ) : rows.map((row, index) => (
              <tr key={`${row.join("-")}-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                {row.map((cell, cellIndex) => (
                  <td key={`${cell}-${cellIndex}`} className="border-t border-slate-200 px-3 py-2 text-sm text-slate-700">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

