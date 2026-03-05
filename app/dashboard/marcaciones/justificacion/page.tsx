"use client"

import { Download, Eye, FileSpreadsheet, FileText, Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { apiEndpoints, authRequest } from "@/lib/api-client"
import useUserStore from "@/stores/useUserStore"
import { toast } from "sonner"

type Personal = { id: number; numero_documento: string; nombres_completos: string; sucursal: number; area: number }
type Sucursal = { id: number; nombre: string }
type Area = { id: number; nombre: string; sucursal: number }
type Justificacion = {
  id: number
  personal: number
  sucursal: number
  area: number
  motivo: string
  tipo: "SALIDA" | "INGRESO"
  rango: "PARCIAL" | "COMPLETO"
  fecha_inicio: string
  fecha_fin: string
  dias: number
  descripcion: string
  tiene_adjunto: boolean
  numero_documento: string
  nombre_documento: string
  estado: "AUTORIZADO" | "NO_AUTORIZADO" | "PENDIENTE"
  motivo_no_autorizacion: string
}

const asArray = (x: unknown) =>
  Array.isArray(x) ? x : x && typeof x === "object" && Array.isArray((x as { results?: unknown[] }).results) ? (x as { results: unknown[] }).results : []

const defaultForm = {
  motivo: "",
  tipo: "SALIDA" as Justificacion["tipo"],
  rango: "PARCIAL" as Justificacion["rango"],
  fecha_inicio: "",
  fecha_fin: "",
  dias: "1",
  descripcion: "",
  tiene_adjunto: false,
  numero_documento: "",
  nombre_documento: "",
}

export default function Page() {
  const token = useUserStore((s) => s.accessToken)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openCrear, setOpenCrear] = useState(false)
  const [busquedaGeneral, setBusquedaGeneral] = useState("")
  const [filtroMotivo, setFiltroMotivo] = useState("")
  const [filtroFecha, setFiltroFecha] = useState("")
  const [sucursalId, setSucursalId] = useState("")
  const [areaId, setAreaId] = useState("")
  const [busquedaEmpleado, setBusquedaEmpleado] = useState("")
  const [selectedPersonalId, setSelectedPersonalId] = useState<number | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [personales, setPersonales] = useState<Personal[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [justificaciones, setJustificaciones] = useState<Justificacion[]>([])
  const [detailRow, setDetailRow] = useState<Justificacion | null>(null)

  const loadData = async () => {
    if (!token) return
    const [p, s, a, j] = await Promise.all([
      authRequest(apiEndpoints.personales, { token }),
      authRequest(apiEndpoints.sucursales, { token }),
      authRequest(apiEndpoints.areas, { token }),
      authRequest(apiEndpoints.justificaciones, { token }),
    ])
    const pList = asArray(p) as Personal[]
    const sList = asArray(s) as Sucursal[]
    const aList = asArray(a) as Area[]
    const jList = asArray(j) as Justificacion[]
    setPersonales(pList)
    setSucursales(sList)
    setAreas(aList)
    setJustificaciones(jList)
    if (!sucursalId && sList[0]) setSucursalId(String(sList[0].id))
    if (!areaId && aList[0]) setAreaId(String(aList[0].id))
  }

  useEffect(() => {
    const run = async () => {
      if (!token) return setLoading(false)
      try {
        setLoading(true)
        await loadData()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo cargar justificaciones")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [token])

  const sucursalMap = useMemo(() => Object.fromEntries(sucursales.map((x) => [x.id, x.nombre])), [sucursales])
  const areaMap = useMemo(() => Object.fromEntries(areas.map((x) => [x.id, x.nombre])), [areas])
  const personalMap = useMemo(() => Object.fromEntries(personales.map((x) => [x.id, x])), [personales])
  const areasFiltradas = useMemo(() => {
    if (!sucursalId) return areas
    return areas.filter((x) => x.sucursal === Number(sucursalId))
  }, [areas, sucursalId])

  const empleadosFiltrados = useMemo(() => {
    const q = busquedaEmpleado.trim().toLowerCase()
    const base = personales.filter((p) => !sucursalId || p.sucursal === Number(sucursalId))
    if (!q) return base
    return base.filter((p) => `${p.nombres_completos} ${p.numero_documento}`.toLowerCase().includes(q))
  }, [personales, busquedaEmpleado, sucursalId])

  const justificacionesFiltradas = useMemo(() => {
    return justificaciones.filter((j) => {
      const p = personalMap[j.personal]
      if (!p) return false
      if (sucursalId && j.sucursal !== Number(sucursalId)) return false
      if (areaId && j.area !== Number(areaId)) return false
      if (filtroMotivo && !j.motivo.toLowerCase().includes(filtroMotivo.toLowerCase())) return false
      if (filtroFecha && j.fecha_inicio !== filtroFecha) return false
      if (busquedaGeneral) {
        const t = busquedaGeneral.toLowerCase()
        const ok = `${p.nombres_completos} ${p.numero_documento} ${areaMap[j.area] || ""}`.toLowerCase().includes(t)
        if (!ok) return false
      }
      return true
    })
  }, [justificaciones, personalMap, sucursalId, areaId, filtroMotivo, filtroFecha, busquedaGeneral, areaMap])

  const exportRows = useMemo(
    () =>
      justificacionesFiltradas.map((j) => {
        const p = personalMap[j.personal]
        return {
          nombres: p?.nombres_completos || "-",
          dni: p?.numero_documento || "-",
          motivo: j.motivo,
          tipo: j.tipo,
          fechaInicio: j.fecha_inicio,
          fechaFin: j.fecha_fin,
          dias: j.dias,
          nombreDoc: j.nombre_documento || "-",
          estado: j.estado,
        }
      }),
    [justificacionesFiltradas, personalMap]
  )

  const descargarExcel = () => {
    const headers = ["Nombres Completos", "DNI", "Motivo", "Tipo", "Fecha Inicio", "Fecha Fin", "Dias", "Nombre Doc.", "Estado"]
    const lines = [
      headers.join(","),
      ...exportRows.map((x) =>
        [x.nombres, x.dni, x.motivo, x.tipo, x.fechaInicio, x.fechaFin, x.dias, x.nombreDoc, x.estado]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ]
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "justificaciones.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const descargarPdf = () => {
    const rowsHtml = exportRows
      .map((x) => `<tr><td>${x.nombres}</td><td>${x.dni}</td><td>${x.motivo}</td><td>${x.tipo}</td><td>${x.fechaInicio}</td><td>${x.fechaFin}</td><td>${x.dias}</td><td>${x.nombreDoc}</td><td>${x.estado}</td></tr>`)
      .join("")
    const w = window.open("", "_blank", "width=1200,height=800")
    if (!w) return
    w.document.write(`<html><head><title>Justificaciones</title><style>body{font-family:Arial;padding:20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #d1d5db;padding:6px}th{background:#65a30d;color:#fff}</style></head><body><h1>Reporte de Justificaciones</h1><table><thead><tr><th>Nombres</th><th>DNI</th><th>Motivo</th><th>Tipo</th><th>Inicio</th><th>Fin</th><th>Dias</th><th>Nombre Doc.</th><th>Estado</th></tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`)
    w.document.close()
    w.print()
  }

  const guardar = async () => {
    if (!token || !selectedPersonalId) return
    const personal = personalMap[selectedPersonalId]
    if (!personal || !form.motivo.trim()) return
    try {
      setSaving(true)
      await authRequest(apiEndpoints.justificaciones, {
        method: "POST",
        body: {
          personal: personal.id,
          sucursal: personal.sucursal,
          area: personal.area,
          motivo: form.motivo.trim(),
          tipo: form.tipo,
          rango: form.rango,
          fecha_inicio: form.fecha_inicio,
          fecha_fin: form.fecha_fin,
          dias: Number(form.dias || "1"),
          descripcion: form.descripcion.trim(),
          tiene_adjunto: form.tiene_adjunto,
          numero_documento: form.numero_documento.trim(),
          nombre_documento: form.nombre_documento.trim(),
          estado: "PENDIENTE",
          motivo_no_autorizacion: "",
        },
        token,
      })
      await loadData()
      setOpenCrear(false)
      setSelectedPersonalId(null)
      setForm(defaultForm)
      toast.success("Justificacion registrada")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  if (!token) return <section className="p-6 text-sm text-slate-600">Inicia sesion para continuar.</section>

  return (
    <section className="min-h-[calc(100vh-7rem)] min-w-0 max-w-full overflow-x-hidden bg-[radial-gradient(circle_at_top_right,#dcfce7_0%,#f8fafc_45%,#eef2ff_100%)] p-3 md:p-6">
      <div className="mx-auto w-full min-w-0 max-w-7xl space-y-5">
        <header className="rounded-2xl border border-white/50 bg-white/80 p-5 shadow-lg backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                <FileText size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-800 md:text-3xl">Registrar justificacion</h1>
                <p className="text-sm text-slate-500">Registra y gestiona justificaciones del personal.</p>
              </div>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
              <Button
                type="button"
                variant="outline"
                className="w-full border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 sm:w-auto"
                onClick={descargarPdf}
              >
                <FileText size={16} className="mr-2" />
                Descargar PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 sm:w-auto"
                onClick={descargarExcel}
              >
                <FileSpreadsheet size={16} className="mr-2" />
                Descargar Excel
              </Button>
              <Dialog open={openCrear} onOpenChange={setOpenCrear}>
                <DialogTrigger asChild>
                  <Button type="button" className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto">
                    <Download size={16} className="mr-2" />
                    Crear justificacion
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[96vw] max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Crear justificacion por empleado</DialogTitle></DialogHeader>
                  <div className="grid gap-4 lg:grid-cols-[620px_420px] lg:justify-between">
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">Personal</div>
                      <div className="border-b border-slate-200 p-2"><Input value={busquedaEmpleado} onChange={(e) => setBusquedaEmpleado(e.target.value)} placeholder="Filtrar empleado por nombre o DNI" /></div>
                      <div className="h-[420px] overflow-y-scroll overflow-x-auto">
                        <table className="w-full min-w-[500px]">
                          <thead className="sticky top-0 z-10 bg-teal-700 text-white"><tr className="text-xs"><th className="w-10 px-2 py-2 text-center">#</th><th className="w-28 px-3 py-2 text-left">Documento</th><th className="min-w-[190px] px-3 py-2 text-left">Nombres Completos</th><th className="w-12 px-2 py-2 text-center">Ver</th></tr></thead>
                          <tbody>
                            {empleadosFiltrados.map((row, index) => (
                              <tr key={row.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                <td className="border-t border-slate-200 px-2 py-2 text-center"><input type="radio" name="personal-modal" checked={selectedPersonalId === row.id} onChange={() => setSelectedPersonalId(row.id)} /></td>
                                <td className="border-t border-slate-200 px-3 py-3 text-xs text-slate-700">{row.numero_documento}</td>
                                <td className="border-t border-slate-200 px-3 py-3 text-xs leading-5 text-slate-700">{row.nombres_completos}</td>
                                <td className="border-t border-slate-200 px-2 py-2 text-center"><button type="button" className="inline-flex rounded-md border border-blue-200 bg-blue-50 p-1 text-blue-600"><Search size={14} /></button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-700">
                        <p className="font-medium">{selectedPersonalId ? personalMap[selectedPersonalId]?.nombres_completos : "Sin personal seleccionado"}</p>
                        <p className="text-xs text-slate-500">Doc: {selectedPersonalId ? personalMap[selectedPersonalId]?.numero_documento : "-"}</p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Motivo</label><Input value={form.motivo} onChange={(e) => setForm((p) => ({ ...p, motivo: e.target.value }))} placeholder="Comision de servicios" /></div>
                        <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Dias</label><Input value={form.dias} onChange={(e) => setForm((p) => ({ ...p, dias: e.target.value }))} /></div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Tipo</label><select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as Justificacion["tipo"] }))}><option value="SALIDA">Salida</option><option value="INGRESO">Ingreso</option></select></div>
                        <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Rango</label><select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={form.rango} onChange={(e) => setForm((p) => ({ ...p, rango: e.target.value as Justificacion["rango"] }))}><option value="PARCIAL">Parcial</option><option value="COMPLETO">Completo</option></select></div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Fecha Inicio</label><Input type="date" value={form.fecha_inicio} onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))} /></div>
                        <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Fecha Fin</label><Input type="date" value={form.fecha_fin} onChange={(e) => setForm((p) => ({ ...p, fecha_fin: e.target.value }))} /></div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Nro Doc.</label><Input value={form.numero_documento} onChange={(e) => setForm((p) => ({ ...p, numero_documento: e.target.value }))} /></div>
                        <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Nombre Doc.</label><Input value={form.nombre_documento} onChange={(e) => setForm((p) => ({ ...p, nombre_documento: e.target.value }))} /></div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Descripcion</label><Input value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} /></div>
                        <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Adjunto</label><select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={form.tiene_adjunto ? "SI" : "NO"} onChange={(e) => setForm((p) => ({ ...p, tiene_adjunto: e.target.value === "SI" }))}><option value="SI">SI</option><option value="NO">NO</option></select></div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpenCrear(false)}>Cancelar</Button>
                    <Button type="button" onClick={guardar} disabled={!selectedPersonalId || saving}>{saving ? "Guardando..." : "Guardar"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <div className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-5">
            <FilterSelect label="Sucursal" value={sucursalId} options={sucursales.map((x) => ({ label: x.nombre, value: String(x.id) }))} onChange={setSucursalId} />
            <FilterSelect label="Area" value={areaId} options={areasFiltradas.map((x) => ({ label: x.nombre, value: String(x.id) }))} onChange={setAreaId} />
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Filtrar por</label>
              <Input value={busquedaGeneral} onChange={(e) => setBusquedaGeneral(e.target.value)} placeholder="Buscar por nombres completos o documento" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Buscar por Motivo</label>
              <Input value={filtroMotivo} onChange={(e) => setFiltroMotivo(e.target.value)} placeholder="Comision, permiso..." />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Buscar por Fechas</label>
              <Input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-700">Justificaciones</p>

            <div className="min-w-0 max-w-full overflow-x-auto rounded-xl border border-slate-200">
              <div className="max-h-[250px] overflow-auto">
                <table className="w-full min-w-[920px]">
                  <thead className="sticky top-0 z-[1] bg-teal-700 text-white">
                    <tr className="text-xs">
                      <th className="px-2 py-2 text-left">Nombres Completos</th><th className="px-2 py-2 text-left">DNI</th><th className="px-2 py-2 text-left">Motivo</th><th className="px-2 py-2 text-left">Tipo</th><th className="px-2 py-2 text-left">Fecha Inicio</th><th className="px-2 py-2 text-left">Fecha Fin</th><th className="px-2 py-2 text-left">Dias</th><th className="px-2 py-2 text-left">Nombre Doc.</th><th className="px-2 py-2 text-center">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={9} className="border-t border-slate-200 px-3 py-4 text-center text-sm text-slate-500">Cargando...</td></tr>
                    ) : justificacionesFiltradas.map((row, index) => {
                      const p = personalMap[row.personal]
                      return (
                        <tr key={row.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="border-t border-slate-200 px-2 py-2 text-xs text-slate-700">{p?.nombres_completos || "-"}</td>
                          <td className="border-t border-slate-200 px-2 py-2 text-xs text-slate-700">{p?.numero_documento || "-"}</td>
                          <td className="border-t border-slate-200 px-2 py-2 text-xs text-slate-700">{row.motivo}</td>
                          <td className="border-t border-slate-200 px-2 py-2 text-xs text-slate-700">{row.tipo === "SALIDA" ? "Salida" : "Ingreso"}</td>
                          <td className="border-t border-slate-200 px-2 py-2 text-xs text-slate-700">{row.fecha_inicio}</td>
                          <td className="border-t border-slate-200 px-2 py-2 text-xs text-slate-700">{row.fecha_fin}</td>
                          <td className="border-t border-slate-200 px-2 py-2 text-xs text-slate-700">{row.dias}</td>
                          <td className="border-t border-slate-200 px-2 py-2 text-xs text-slate-700">{row.nombre_documento || "-"}</td>
                          <td className="border-t border-slate-200 px-2 py-2 text-center"><button type="button" onClick={() => setDetailRow(row)} className="inline-flex rounded-md border border-blue-200 bg-blue-50 p-1.5 text-blue-600 transition hover:bg-blue-100"><Eye size={14} /></button></td>
                        </tr>
                      )
                    })}
                    {!loading && justificacionesFiltradas.length === 0 && (
                      <tr><td colSpan={9} className="border-t border-slate-200 px-3 py-4 text-center text-sm text-slate-500">No se encontro registros</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!detailRow} onOpenChange={(next) => !next && setDetailRow(null)}>
        <DialogContent className="max-w-5xl overflow-hidden bg-white p-0">
          <DialogHeader><DialogTitle className="px-6 pt-6 text-xl font-semibold text-slate-800">Detalle de Justificacion</DialogTitle></DialogHeader>
          {detailRow && (
            <div className="space-y-5 px-6 pb-4">
              <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 p-5 text-white shadow-lg">
                <p className="text-lg font-semibold tracking-tight">{personalMap[detailRow.personal]?.nombres_completos || "Sin nombre"}</p>
                <p className="text-sm text-slate-200">DNI: {personalMap[detailRow.personal]?.numero_documento || "-"}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <DetailItem label="Sucursal" value={sucursalMap[detailRow.sucursal] || "-"} />
                <DetailItem label="Area" value={areaMap[detailRow.area] || "-"} />
                <DetailItem label="Motivo" value={detailRow.motivo} />
                <DetailItem label="Tipo" value={detailRow.tipo} />
                <DetailItem label="Rango" value={detailRow.rango} />
                <DetailItem label="Fecha Inicio" value={detailRow.fecha_inicio} />
                <DetailItem label="Fecha Fin" value={detailRow.fecha_fin} />
                <DetailItem label="Dias" value={String(detailRow.dias)} />
                <DetailItem label="Estado" value={detailRow.estado} />
                <DetailItem label="Nombre Documento" value={detailRow.nombre_documento || "-"} />
                <div className="md:col-span-3"><DetailItem label="Descripcion / Observacion" value={detailRow.motivo_no_autorizacion || detailRow.descripcion || "-"} /></div>
              </div>
            </div>
          )}
          <DialogFooter><Button type="button" className="mb-5 mr-6 bg-slate-900 hover:bg-slate-800" onClick={() => setDetailRow(null)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: { label: string; value: string }[]; onChange: (value: string) => void }) {
  return (
    <div className="w-full space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <select className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm md:h-9" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 transition hover:shadow-md">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-800">{value || "-"}</p>
    </div>
  )
}

