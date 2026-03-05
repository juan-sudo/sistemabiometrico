"use client"

import { Eye, FileSpreadsheet, FileText } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { apiEndpoints, authRequest } from "@/lib/api-client"
import useUserStore from "@/stores/useUserStore"
import { toast } from "sonner"

type FiltroEstado = "AUTORIZADO" | "NO_AUTORIZADO" | "TODOS"
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
  nombre_documento: string
  descripcion: string
  estado: "AUTORIZADO" | "NO_AUTORIZADO" | "PENDIENTE"
  gestionado_por: number | null
  fecha_gestion: string | null
  motivo_no_autorizacion: string
}
type Personal = { id: number; numero_documento: string; nombres_completos: string }
type Sucursal = { id: number; nombre: string }
type Area = { id: number; nombre: string; sucursal: number }

const months = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

const asArray = (x: unknown) =>
  Array.isArray(x) ? x : x && typeof x === "object" && Array.isArray((x as { results?: unknown[] }).results) ? (x as { results: unknown[] }).results : []

export default function Page() {
  const token = useUserStore((s) => s.accessToken)
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<Justificacion[]>([])
  const [personales, setPersonales] = useState<Personal[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [sucursal, setSucursal] = useState("")
  const [area, setArea] = useState("")
  const [mes, setMes] = useState("")
  const [anio, setAnio] = useState(String(new Date().getFullYear()))
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("TODOS")
  const [openAutorizarModal, setOpenAutorizarModal] = useState(false)
  const [openNoAutorizarModal, setOpenNoAutorizarModal] = useState(false)
  const [descripcionNoAutorizado, setDescripcionNoAutorizado] = useState("")
  const [detailRow, setDetailRow] = useState<Justificacion | null>(null)

  const loadBase = async () => {
    if (!token) return
    const [p, s, a] = await Promise.all([
      authRequest(apiEndpoints.personales, { token }),
      authRequest(apiEndpoints.sucursales, { token }),
      authRequest(apiEndpoints.areas, { token }),
    ])
    const pList = asArray(p) as Personal[]
    const sList = asArray(s) as Sucursal[]
    const aList = asArray(a) as Area[]
    setPersonales(pList)
    setSucursales(sList)
    setAreas(aList)
    if (!sucursal && sList[0]) setSucursal(String(sList[0].id))
    if (!area && aList[0]) setArea(String(aList[0].id))
  }

  const loadRows = async () => {
    if (!token) return
    const qs = new URLSearchParams()
    if (sucursal) qs.set("sucursal", sucursal)
    if (area) qs.set("area", area)
    if (mes) qs.set("mes", String(months.indexOf(mes)))
    if (anio) qs.set("anio", anio)
    if (filtroEstado !== "TODOS") qs.set("estado", filtroEstado)
    const data = await authRequest(`${apiEndpoints.justificaciones}?${qs.toString()}`, { token })
    setRows(asArray(data) as Justificacion[])
  }

  useEffect(() => {
    const run = async () => {
      if (!token) return setLoading(false)
      try {
        setLoading(true)
        await loadBase()
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [token])

  useEffect(() => {
    if (!token) return
    loadRows().catch(() => {})
  }, [token, sucursal, area, mes, anio, filtroEstado])

  useEffect(() => {
    setSelectedIds([])
  }, [sucursal, area, mes, anio, filtroEstado])

  const personalMap = useMemo(() => Object.fromEntries(personales.map((x) => [x.id, x])), [personales])
  const sucursalMap = useMemo(() => Object.fromEntries(sucursales.map((x) => [x.id, x.nombre])), [sucursales])
  const areaMap = useMemo(() => Object.fromEntries(areas.map((x) => [x.id, x.nombre])), [areas])
  const areasFiltradas = useMemo(() => (!sucursal ? areas : areas.filter((x) => x.sucursal === Number(sucursal))), [areas, sucursal])
  const visibleRows = useMemo(
    () => (filtroEstado === "TODOS" ? rows : rows.filter((x) => x.estado === filtroEstado)),
    [rows, filtroEstado]
  )
  const selectedRows = useMemo(() => visibleRows.filter((x) => selectedIds.includes(x.id)), [visibleRows, selectedIds])

  const toggleSelected = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const gestionar = async (accion: "AUTORIZAR" | "NO_AUTORIZAR", motivo = "") => {
    if (!token || selectedIds.length === 0) return
    try {
      await authRequest(`${apiEndpoints.justificaciones}gestionar/`, {
        method: "POST",
        body: { ids: selectedIds, accion, motivo },
        token,
      })
      await loadRows()
      setSelectedIds([])
      toast.success(accion === "AUTORIZAR" ? "Justificaciones autorizadas" : "Justificaciones no autorizadas")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar estado")
    }
  }

  const exportRows = visibleRows.map((row) => ({
    sucursal: sucursalMap[row.sucursal] || "-",
    area: areaMap[row.area] || "-",
    numeroDocumento: personalMap[row.personal]?.numero_documento || "-",
    nombres: personalMap[row.personal]?.nombres_completos || "-",
    motivo: row.motivo,
    fechaInicio: row.fecha_inicio,
    fechaFin: row.fecha_fin,
    dias: row.dias,
    nombreDocumento: row.nombre_documento || "-",
    estado: row.estado,
  }))

  const exportarExcel = () => {
    const headers = ["Sucursal", "Area", "Numero de Documento", "Nombres", "Motivo", "Fecha Inicio", "Fecha Fin", "Dias", "Nombre Documento", "Estado"]
    const lines = [
      headers.join(","),
      ...exportRows.map((x) => [x.sucursal, x.area, x.numeroDocumento, x.nombres, x.motivo, x.fechaInicio, x.fechaFin, x.dias, x.nombreDocumento, x.estado].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ]
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `autorizacion-justificacion-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportarPdf = () => {
    const html = exportRows.map((x) => `<tr><td>${x.sucursal}</td><td>${x.area}</td><td>${x.numeroDocumento}</td><td>${x.nombres}</td><td>${x.motivo}</td><td>${x.fechaInicio}</td><td>${x.fechaFin}</td><td>${x.dias}</td><td>${x.nombreDocumento}</td><td>${x.estado}</td></tr>`).join("")
    const w = window.open("", "_blank", "width=1200,height=800")
    if (!w) return
    w.document.write(`<html><head><title>Autorizacion de Justificacion</title><style>body{font-family:Arial;padding:20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #d1d5db;padding:6px}th{background:#65a30d;color:#fff}</style></head><body><h1>Reporte de Autorizacion de Justificacion</h1><table><thead><tr><th>Sucursal</th><th>Area</th><th>Nro Documento</th><th>Nombres</th><th>Motivo</th><th>Inicio</th><th>Fin</th><th>Dias</th><th>Nombre Documento</th><th>Estado</th></tr></thead><tbody>${html}</tbody></table></body></html>`)
    w.document.close()
    w.print()
  }

  if (!token) return <section className="p-6 text-sm text-slate-600">Inicia sesion para continuar.</section>

  return (
    <section className="min-h-[calc(100vh-7rem)] min-w-0 max-w-full overflow-x-hidden bg-[radial-gradient(circle_at_top_right,#dcfce7_0%,#f8fafc_45%,#eef2ff_100%)] p-3 md:p-6">
      <div className="mx-auto w-full min-w-0 max-w-7xl space-y-4">
        <header className="rounded-2xl border border-white/50 bg-white/80 p-5 shadow-lg backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                <FileText size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-800 md:text-3xl">Autorizacion de Justificacion</h1>
                <p className="text-sm text-slate-500">Gestiona y autoriza justificaciones del personal.</p>
              </div>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
              <Button type="button" variant="outline" className="w-full border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 sm:w-auto" onClick={exportarPdf}>
                <FileText size={16} className="mr-2" />
                Exportar PDF
              </Button>
              <Button type="button" variant="outline" className="w-full border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 sm:w-auto" onClick={exportarExcel}>
                <FileSpreadsheet size={16} className="mr-2" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </header>
        <div className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-5">
            <FilterSelect label="Sucursal" value={sucursal} onChange={setSucursal} options={[{ label: "Todos", value: "" }, ...sucursales.map((x) => ({ label: x.nombre, value: String(x.id) }))]} />
            <FilterSelect label="Area" value={area} onChange={setArea} options={[{ label: "Todos", value: "" }, ...areasFiltradas.map((x) => ({ label: x.nombre, value: String(x.id) }))]} />
            <FilterSelect label="Mes" value={mes} onChange={setMes} options={[{ label: "Todos", value: "" }, ...months.filter(Boolean).map((m) => ({ label: m, value: m }))]} />
            <FilterSelect label="Anio" value={anio} onChange={setAnio} options={[String(new Date().getFullYear() - 1), String(new Date().getFullYear()), String(new Date().getFullYear() + 1)].map((x) => ({ label: x, value: x }))} />
            <FilterSelect
              label="Filtro de Estado"
              value={filtroEstado}
              onChange={(value) => setFiltroEstado(value as FiltroEstado)}
              options={[
                { label: "Todos", value: "TODOS" },
                { label: "Autorizado", value: "AUTORIZADO" },
                { label: "No Autorizado", value: "NO_AUTORIZADO" },
              ]}
            />
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-700">
              Seleccionados: <span className="font-semibold text-slate-900">{selectedIds.length}</span>
            </p>
            <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto">
              <Button type="button" className="w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto" disabled={selectedIds.length === 0} onClick={() => setOpenAutorizarModal(true)}>Autorizar</Button>
              <Button type="button" className="w-full bg-rose-600 hover:bg-rose-700 sm:w-auto" disabled={selectedIds.length === 0} onClick={() => setOpenNoAutorizarModal(true)}>No Autorizar</Button>
            </div>
          </div>
          <div className="min-w-0 max-w-full overflow-x-auto rounded-xl border border-slate-200">
            <div className="max-h-[430px] overflow-auto">
              <table className="w-full min-w-[760px] lg:min-w-[980px]">
                <thead className="sticky top-0 z-[1] bg-teal-700 text-white"><tr className="text-xs"><th className="w-10 px-2 py-2 text-center">#</th><th className="px-2 py-2 text-left">Sucursal</th><th className="hidden px-2 py-2 text-left md:table-cell">Area</th><th className="px-2 py-2 text-left">Numero de Documento</th><th className="px-2 py-2 text-left">Nombres Completos</th><th className="hidden px-2 py-2 text-left lg:table-cell">Motivo</th><th className="hidden px-2 py-2 text-left lg:table-cell">Dias</th><th className="px-2 py-2 text-left">Estado</th><th className="w-20 px-2 py-2 text-center">Detalle</th></tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} className="border-t border-slate-200 px-3 py-4 text-center text-sm text-slate-500">Cargando...</td></tr>
                  ) : visibleRows.map((row, index) => {
                    const p = personalMap[row.personal]
                    return (
                      <tr key={row.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="border-t border-slate-200 px-2 py-2 text-center"><input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelected(row.id)} /></td>
                        <td className="border-t border-slate-200 px-2 py-2 text-xs text-slate-700">{sucursalMap[row.sucursal] || "-"}</td>
                        <td className="hidden border-t border-slate-200 px-2 py-2 text-xs text-slate-700 md:table-cell">{areaMap[row.area] || "-"}</td>
                        <td className="border-t border-slate-200 px-2 py-2 text-xs text-slate-700">{p?.numero_documento || "-"}</td>
                        <td className="border-t border-slate-200 px-2 py-2 text-xs text-slate-700">{p?.nombres_completos || "-"}</td>
                        <td className="hidden border-t border-slate-200 px-2 py-2 text-xs text-slate-700 lg:table-cell">{row.motivo}</td>
                        <td className="hidden border-t border-slate-200 px-2 py-2 text-xs text-slate-700 lg:table-cell">{row.dias}</td>
                        <td className="border-t border-slate-200 px-2 py-2 text-xs"><span className={row.estado === "AUTORIZADO" ? "font-semibold text-emerald-700" : row.estado === "NO_AUTORIZADO" ? "font-semibold text-rose-700" : "font-semibold text-amber-700"}>{row.estado}</span></td>
                        <td className="border-t border-slate-200 px-2 py-2 text-center"><button type="button" onClick={() => setDetailRow(row)} className="inline-flex rounded-md border border-blue-200 bg-blue-50 p-1.5 text-blue-600 transition hover:bg-blue-100"><Eye size={14} /></button></td>
                      </tr>
                    )
                  })}
                  {!loading && visibleRows.length === 0 && <tr><td colSpan={9} className="border-t border-slate-200 px-3 py-4 text-center text-sm text-slate-500">No se encontro registros</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Dialog open={openAutorizarModal} onOpenChange={setOpenAutorizarModal}>
          <DialogContent className="w-[calc(100vw-1.5rem)] max-w-xl">
            <DialogHeader><DialogTitle>Confirmar autorizacion</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm text-slate-700"><p>Se va a autorizar al siguiente personal:</p><div className="max-h-48 space-y-1 overflow-auto rounded-lg border bg-slate-50 p-3">{selectedRows.map((r) => <p key={r.id} className="font-medium">{personalMap[r.personal]?.nombres_completos || "-"}</p>)}</div></div>
            <DialogFooter className="grid grid-cols-1 gap-2 sm:flex">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setOpenAutorizarModal(false)}>Cancelar</Button>
              <Button type="button" className="w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto" onClick={() => { gestionar("AUTORIZAR"); setOpenAutorizarModal(false) }}>Confirmar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openNoAutorizarModal} onOpenChange={setOpenNoAutorizarModal}>
          <DialogContent className="w-[calc(100vw-1.5rem)] max-w-xl">
            <DialogHeader><DialogTitle>No autorizar personal</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm text-slate-700"><p>Ingrese la descripcion del motivo por el cual no se autoriza.</p><div className="max-h-32 space-y-1 overflow-auto rounded-lg border bg-slate-50 p-3">{selectedRows.map((r) => <p key={r.id} className="font-medium">{personalMap[r.personal]?.nombres_completos || "-"}</p>)}</div><div className="space-y-1"><label className="text-sm font-medium text-slate-700">Descripcion</label><textarea className="min-h-[110px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={descripcionNoAutorizado} onChange={(e) => setDescripcionNoAutorizado(e.target.value)} /></div></div>
            <DialogFooter className="grid grid-cols-1 gap-2 sm:flex">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setOpenNoAutorizarModal(false)}>Cancelar</Button>
              <Button type="button" className="w-full bg-rose-600 hover:bg-rose-700 sm:w-auto" disabled={!descripcionNoAutorizado.trim()} onClick={() => { gestionar("NO_AUTORIZAR", descripcionNoAutorizado.trim()); setDescripcionNoAutorizado(""); setOpenNoAutorizarModal(false) }}>Confirmar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!detailRow} onOpenChange={(next) => !next && setDetailRow(null)}>
          <DialogContent className="w-[calc(100vw-1.25rem)] max-w-3xl overflow-hidden bg-white p-0">
            <DialogHeader><DialogTitle className="px-4 pt-4 text-lg font-semibold text-slate-800 sm:px-6 sm:pt-6 sm:text-xl">Detalle de Justificacion</DialogTitle></DialogHeader>
            {detailRow && (
              <div className="max-h-[75vh] space-y-3 overflow-y-auto px-3 pb-3 sm:px-4 sm:pb-4">
                <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 p-4 text-white shadow-lg"><p className="text-base font-semibold tracking-tight sm:text-lg">{personalMap[detailRow.personal]?.nombres_completos || "-"}</p><p className="text-sm text-slate-200">DNI: {personalMap[detailRow.personal]?.numero_documento || "-"}</p></div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <DetailItem label="Sucursal" value={sucursalMap[detailRow.sucursal] || "-"} />
                  <DetailItem label="Area" value={areaMap[detailRow.area] || "-"} />
                  <DetailItem label="Motivo" value={detailRow.motivo} />
                  <DetailItem label="Tipo" value={detailRow.tipo} />
                  <DetailItem label="Rango" value={detailRow.rango} />
                  <DetailItem label="Fecha Inicio" value={detailRow.fecha_inicio} />
                  <DetailItem label="Fecha Fin" value={detailRow.fecha_fin} />
                  <DetailItem label="Dias" value={String(detailRow.dias)} />
                  <DetailItem label="Nombre Documento" value={detailRow.nombre_documento || "-"} />
                  <DetailItem label="Estado" value={detailRow.estado} />
                  <div className="sm:col-span-2 lg:col-span-3"><DetailItem label="Motivo de No Autorizacion / Observacion" value={detailRow.motivo_no_autorizacion || detailRow.descripcion || "-"} /></div>
                </div>
              </div>
            )}
            <DialogFooter className="px-3 pb-3 sm:px-4 sm:pb-4"><Button type="button" className="w-full bg-slate-900 hover:bg-slate-800 sm:ml-auto sm:w-auto" onClick={() => setDetailRow(null)}>Cerrar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: { label: string; value: string }[]; onChange: (value: string) => void }) {
  return (
    <div className="w-full space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <select className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm md:h-9" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={`${label}-${o.value || "all"}`} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200/80 transition hover:shadow-md sm:p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-slate-800 sm:mt-2">{value || "-"}</p>
    </div>
  )
}

