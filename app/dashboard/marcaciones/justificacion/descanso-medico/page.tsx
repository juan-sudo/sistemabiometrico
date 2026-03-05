"use client"

import { Download, Eye, FileSpreadsheet, FileText, Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { apiEndpoints, authRequest } from "@/lib/api-client"
import useUserStore from "@/stores/useUserStore"
import { toast } from "sonner"

type Personal = {
  id: number
  codigo_empleado: string
  numero_documento: string
  nombres_completos: string
  sucursal: number
  area: number
  cargo: number | null
  estado: "ACTIVO" | "INACTIVO"
  correo: string
  telefono: string
  fecha_ingreso: string | null
}
type Sucursal = { id: number; nombre: string }
type Area = { id: number; nombre: string; sucursal: number }
type Descanso = {
  id: number
  personal: number
  motivo: "SALUD" | "SUBSIDIO"
  fecha_inicio: string
  fecha_fin: string
  dias: number
  citt: string
  diagnostico: string
  tiene_adjunto: boolean
  numero_documento: string
}

const asArray = (x: unknown) =>
  Array.isArray(x) ? x : x && typeof x === "object" && Array.isArray((x as { results?: unknown[] }).results) ? (x as { results: unknown[] }).results : []

const defaultForm = {
  motivo: "" as "" | "SALUD" | "SUBSIDIO",
  fecha_inicio: "",
  fecha_fin: "",
  dias: "1",
  citt: "",
  diagnostico: "",
  tiene_adjunto: false,
  numero_documento: "",
}

export default function Page() {
  const token = useUserStore((s) => s.accessToken)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openCrearDescanso, setOpenCrearDescanso] = useState(false)
  const [perfilEmpleado, setPerfilEmpleado] = useState<Personal | null>(null)
  const [selectedPersonalId, setSelectedPersonalId] = useState<number | null>(null)
  const [busquedaPersonal, setBusquedaPersonal] = useState("")
  const [busquedaEmpleadoModal, setBusquedaEmpleadoModal] = useState("")
  const [filtroMotivo, setFiltroMotivo] = useState("")
  const [filtroFecha, setFiltroFecha] = useState("")
  const [sucursalId, setSucursalId] = useState("")
  const [areaId, setAreaId] = useState("")
  const [form, setForm] = useState(defaultForm)
  const [personales, setPersonales] = useState<Personal[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [descansos, setDescansos] = useState<Descanso[]>([])

  const loadData = async () => {
    if (!token) return
    const [p, s, a, d] = await Promise.all([
      authRequest(apiEndpoints.personales, { token }),
      authRequest(apiEndpoints.sucursales, { token }),
      authRequest(apiEndpoints.areas, { token }),
      authRequest(apiEndpoints.descansosMedicos, { token }),
    ])
    const pList = asArray(p) as Personal[]
    const sList = asArray(s) as Sucursal[]
    const aList = asArray(a) as Area[]
    setPersonales(pList)
    setSucursales(sList)
    setAreas(aList)
    setDescansos(asArray(d) as Descanso[])
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
        toast.error(err instanceof Error ? err.message : "No se pudo cargar descansos medicos")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [token])

  const personalMap = useMemo(() => Object.fromEntries(personales.map((x) => [x.id, x])), [personales])
  const sucursalMap = useMemo(() => Object.fromEntries(sucursales.map((x) => [x.id, x.nombre])), [sucursales])
  const areaMap = useMemo(() => Object.fromEntries(areas.map((x) => [x.id, x.nombre])), [areas])
  const areasFiltradas = useMemo(() => (!sucursalId ? areas : areas.filter((x) => x.sucursal === Number(sucursalId))), [areas, sucursalId])

  const empleadosFiltrados = useMemo(() => {
    const q = busquedaEmpleadoModal.trim().toLowerCase()
    const base = personales.filter((p) => !sucursalId || p.sucursal === Number(sucursalId))
    if (!q) return base
    return base.filter((e) => `${e.numero_documento} ${e.nombres_completos} ${e.codigo_empleado}`.toLowerCase().includes(q))
  }, [personales, busquedaEmpleadoModal, sucursalId])

  const descansosFiltrados = useMemo(() => {
    const texto = busquedaPersonal.trim().toLowerCase()
    return descansos.filter((d) => {
      const emp = personalMap[d.personal]
      if (!emp) return false
      if (sucursalId && emp.sucursal !== Number(sucursalId)) return false
      if (areaId && emp.area !== Number(areaId)) return false
      if (filtroMotivo && d.motivo !== filtroMotivo) return false
      if (filtroFecha && d.fecha_inicio !== filtroFecha) return false
      if (texto) {
        const ok = `${emp.nombres_completos} ${emp.numero_documento} ${emp.codigo_empleado}`.toLowerCase().includes(texto)
        if (!ok) return false
      }
      return true
    })
  }, [descansos, personalMap, sucursalId, areaId, filtroMotivo, filtroFecha, busquedaPersonal])

  const exportRows = useMemo(
    () =>
      descansosFiltrados.map((row) => ({
        nombres: personalMap[row.personal]?.nombres_completos || "-",
        dni: personalMap[row.personal]?.numero_documento || "-",
        motivo: row.motivo === "SALUD" ? "Por salud" : "Subsidio",
        fechaInicio: row.fecha_inicio,
        fechaFin: row.fecha_fin,
        dias: row.dias,
        citt: row.citt || "-",
        diagnostico: row.diagnostico || "-",
        adjunto: row.tiene_adjunto ? "SI" : "NO",
        nroDoc: row.numero_documento || "-",
      })),
    [descansosFiltrados, personalMap]
  )

  const descargarExcel = () => {
    const headers = ["Nombres Completos", "DNI", "Motivo", "Fecha Inicio", "Fecha Fin", "Dias", "CITT", "Diagnostico", "Adjunto", "Nro Doc."]
    const lines = [headers.join(","), ...exportRows.map((x) => [x.nombres, x.dni, x.motivo, x.fechaInicio, x.fechaFin, x.dias, x.citt, x.diagnostico, x.adjunto, x.nroDoc].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))]
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "descansos-medicos.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const descargarPdf = () => {
    const rowsHtml = exportRows.map((x) => `<tr><td>${x.nombres}</td><td>${x.dni}</td><td>${x.motivo}</td><td>${x.fechaInicio}</td><td>${x.fechaFin}</td><td>${x.dias}</td><td>${x.citt}</td><td>${x.diagnostico}</td><td>${x.adjunto}</td><td>${x.nroDoc}</td></tr>`).join("")
    const w = window.open("", "_blank", "width=1200,height=800")
    if (!w) return
    w.document.write(`<html><head><title>Descansos Medicos</title><style>body{font-family:Arial;padding:20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #d1d5db;padding:6px}th{background:#65a30d;color:#fff}</style></head><body><h1>Reporte de Descansos Medicos</h1><table><thead><tr><th>Nombres</th><th>DNI</th><th>Motivo</th><th>Inicio</th><th>Fin</th><th>Dias</th><th>CITT</th><th>Diagnostico</th><th>Adjunto</th><th>Nro Doc.</th></tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`)
    w.document.close()
    w.print()
  }

  const guardar = async () => {
    if (!token || !selectedPersonalId || !form.motivo) return
    try {
      setSaving(true)
      await authRequest(apiEndpoints.descansosMedicos, {
        method: "POST",
        body: {
          personal: selectedPersonalId,
          motivo: form.motivo,
          fecha_inicio: form.fecha_inicio,
          fecha_fin: form.fecha_fin,
          dias: Number(form.dias || "1"),
          citt: form.citt.trim(),
          diagnostico: form.diagnostico.trim(),
          tiene_adjunto: form.tiene_adjunto,
          numero_documento: form.numero_documento.trim(),
        },
        token,
      })
      await loadData()
      setForm(defaultForm)
      setOpenCrearDescanso(false)
      setSelectedPersonalId(null)
      toast.success("Descanso medico registrado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  if (!token) return <section className="p-6 text-sm text-slate-600">Inicia sesion para continuar.</section>

  return (
    <section className="min-h-[calc(100vh-7rem)] bg-[radial-gradient(circle_at_top_right,#dcfce7_0%,#f8fafc_45%,#eef2ff_100%)] p-3 md:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <header className="rounded-2xl border border-white/50 bg-white/80 p-5 shadow-lg backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                <FileText size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-800 md:text-3xl">Descansos Medicos y Subsidios</h1>
                <p className="text-sm text-slate-500">Registra y gestiona descansos medicos del personal.</p>
              </div>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
              <Button type="button" variant="outline" className="w-full border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 sm:w-auto" onClick={descargarPdf}>
                <FileText size={16} className="mr-2" />
                Descargar PDF
              </Button>
              <Button type="button" variant="outline" className="w-full border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 sm:w-auto" onClick={descargarExcel}>
                <FileSpreadsheet size={16} className="mr-2" />
                Descargar Excel
              </Button>
              <Dialog open={openCrearDescanso} onOpenChange={setOpenCrearDescanso}>
                <DialogTrigger asChild>
                  <Button type="button" className="w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto">
                    <Download size={16} className="mr-2" />
                    Crear descanso medico
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[96vw] max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Crear descanso medico por empleado</DialogTitle></DialogHeader>
                  <div className="grid gap-4 lg:grid-cols-[620px_420px] lg:justify-between">
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">Personal</div>
                      <div className="border-b border-slate-200 p-2"><Input value={busquedaEmpleadoModal} onChange={(e) => setBusquedaEmpleadoModal(e.target.value)} placeholder="Filtrar empleado por nombre o DNI" /></div>
                      <div className="h-[420px] overflow-y-scroll overflow-x-auto">
                        <table className="w-full min-w-[500px]">
                          <thead className="sticky top-0 z-10 bg-teal-700 text-white"><tr className="text-xs"><th className="w-10 px-2 py-2 text-center">#</th><th className="w-28 px-3 py-2 text-left">Codigo</th><th className="w-28 px-3 py-2 text-left">Documento</th><th className="min-w-[190px] px-3 py-2 text-left">Nombres Completos</th><th className="w-12 px-2 py-2 text-center">Ver</th></tr></thead>
                          <tbody>
                            {empleadosFiltrados.map((row, i) => (
                              <tr key={row.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                <td className="border-t border-slate-200 px-2 py-2 text-center"><input type="radio" name="personal-modal" checked={selectedPersonalId === row.id} onChange={() => setSelectedPersonalId(row.id)} /></td>
                                <td className="border-t border-slate-200 px-3 py-3 text-xs text-slate-700">{row.codigo_empleado}</td>
                                <td className="border-t border-slate-200 px-3 py-3 text-xs text-slate-700">{row.numero_documento}</td>
                                <td className="border-t border-slate-200 px-3 py-3 text-xs leading-5 text-slate-700">{row.nombres_completos}</td>
                                <td className="border-t border-slate-200 px-2 py-2 text-center"><button type="button" onClick={() => setPerfilEmpleado(row)} className="inline-flex rounded-md border border-blue-200 bg-blue-50 p-1 text-blue-600"><Search size={14} /></button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-700"><p className="font-medium">{selectedPersonalId ? personalMap[selectedPersonalId]?.nombres_completos : "Sin personal seleccionado"}</p><p className="text-xs text-slate-500">Doc: {selectedPersonalId ? personalMap[selectedPersonalId]?.numero_documento : "-"}</p></div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Motivo</label><select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={form.motivo} onChange={(e) => setForm((p) => ({ ...p, motivo: e.target.value as "SALUD" | "SUBSIDIO" | "" }))}><option value="">---</option><option value="SALUD">Por salud</option><option value="SUBSIDIO">Subsidio</option></select></div>
                        <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Dias</label><Input value={form.dias} onChange={(e) => setForm((p) => ({ ...p, dias: e.target.value }))} /></div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Fecha Inicio</label><Input type="date" value={form.fecha_inicio} onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))} /></div>
                        <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Fecha Fin</label><Input type="date" value={form.fecha_fin} onChange={(e) => setForm((p) => ({ ...p, fecha_fin: e.target.value }))} /></div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1"><label className="text-sm font-medium text-slate-700">CITT</label><Input value={form.citt} onChange={(e) => setForm((p) => ({ ...p, citt: e.target.value }))} /></div>
                        <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Nro Doc.</label><Input value={form.numero_documento} onChange={(e) => setForm((p) => ({ ...p, numero_documento: e.target.value }))} /></div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Diagnostico</label><Input value={form.diagnostico} onChange={(e) => setForm((p) => ({ ...p, diagnostico: e.target.value }))} /></div>
                        <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Adjunto</label><select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={form.tiene_adjunto ? "SI" : "NO"} onChange={(e) => setForm((p) => ({ ...p, tiene_adjunto: e.target.value === "SI" }))}><option value="SI">SI</option><option value="NO">NO</option></select></div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter><Button type="button" variant="outline" onClick={() => setOpenCrearDescanso(false)}>Cancelar</Button><Button type="button" onClick={guardar} disabled={!selectedPersonalId || saving}>{saving ? "Guardando..." : "Guardar"}</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-5">
            <FilterSelect label="Sucursal" value={sucursalId} options={[{ label: "Todos", value: "" }, ...sucursales.map((x) => ({ label: x.nombre, value: String(x.id) }))]} onChange={setSucursalId} />
            <FilterSelect label="Area" value={areaId} options={[{ label: "Todos", value: "" }, ...areasFiltradas.map((x) => ({ label: x.nombre, value: String(x.id) }))]} onChange={setAreaId} />
            <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Filtrar por</label><Input value={busquedaPersonal} onChange={(e) => setBusquedaPersonal(e.target.value)} placeholder="Buscar por nombres completos, numero de documento o codigo" /></div>
            <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Buscar por Motivo</label><select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={filtroMotivo} onChange={(e) => setFiltroMotivo(e.target.value)}><option value="">---</option><option value="SALUD">Por salud</option><option value="SUBSIDIO">Subsidio</option></select></div>
            <div className="space-y-1"><label className="text-sm font-medium text-slate-700">Buscar por Fechas</label><Input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} /></div>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-700">Descansos medicos</p>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="max-h-[250px] overflow-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="sticky top-0 z-10 bg-teal-700 text-white"><tr className="text-xs"><th className="px-2 py-2 text-left">Nombres Completos</th><th className="px-2 py-2 text-left">DNI</th><th className="px-2 py-2 text-left">Motivo</th><th className="px-2 py-2 text-left">Fecha Inicio</th><th className="px-2 py-2 text-left">Fecha Fin</th><th className="px-2 py-2 text-left">Dias</th><th className="px-2 py-2 text-left">CITT</th><th className="px-2 py-2 text-left">Diagnostico</th><th className="px-2 py-2 text-left">Adjunto</th><th className="px-2 py-2 text-left">Nro Doc.</th><th className="w-20 px-2 py-2 text-center">Detalle</th></tr></thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={11} className="border-t border-slate-200 px-3 py-4 text-center text-sm text-slate-500">Cargando...</td></tr>
                    ) : descansosFiltrados.map((row, i) => {
                      const emp = personalMap[row.personal]
                      return (
                        <tr key={row.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="border-t border-slate-200 px-2 py-2 text-xs text-slate-700">{emp?.nombres_completos || "-"}</td>
                          <td className="border-t border-slate-200 px-2 py-2 text-xs text-slate-700">{emp?.numero_documento || "-"}</td>
                          <td className="border-t border-slate-200 px-2 py-2 text-xs text-slate-700">{row.motivo === "SALUD" ? "Por salud" : "Subsidio"}</td>
                          <td className="border-t border-slate-200 px-2 py-2 text-xs text-slate-700">{row.fecha_inicio}</td>
                          <td className="border-t border-slate-200 px-2 py-2 text-xs text-slate-700">{row.fecha_fin}</td>
                          <td className="border-t border-slate-200 px-2 py-2 text-xs text-slate-700">{row.dias}</td>
                          <td className="border-t border-slate-200 px-2 py-2 text-xs text-slate-700">{row.citt || "-"}</td>
                          <td className="border-t border-slate-200 px-2 py-2 text-xs text-slate-700">{row.diagnostico || "-"}</td>
                          <td className="border-t border-slate-200 px-2 py-2 text-xs text-slate-700">{row.tiene_adjunto ? "SI" : "NO"}</td>
                          <td className="border-t border-slate-200 px-2 py-2 text-xs text-slate-700">{row.numero_documento || "-"}</td>
                          <td className="border-t border-slate-200 px-2 py-2 text-center"><button type="button" onClick={() => emp && setPerfilEmpleado(emp)} className="inline-flex rounded-md border border-blue-200 bg-blue-50 p-1.5 text-blue-600 transition hover:bg-blue-100"><Eye size={14} /></button></td>
                        </tr>
                      )
                    })}
                    {!loading && descansosFiltrados.length === 0 && <tr><td colSpan={11} className="border-t border-slate-200 px-3 py-4 text-center text-sm text-slate-500">No se encontro registros</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!perfilEmpleado} onOpenChange={(next) => !next && setPerfilEmpleado(null)}>
        <DialogContent className="w-[92vw] max-w-4xl border-slate-200 bg-gradient-to-b from-white to-slate-50/70">
          <DialogHeader><DialogTitle className="text-xl text-slate-800">Resumen del perfil del personal</DialogTitle></DialogHeader>
          {perfilEmpleado && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-lime-500 text-lg font-bold text-white shadow-sm">{getInitials(perfilEmpleado.nombres_completos)}</div>
                    <div><p className="text-xl font-semibold tracking-tight text-slate-800">{perfilEmpleado.nombres_completos}</p><p className="text-sm text-slate-600">DNI: {perfilEmpleado.numero_documento}</p></div>
                  </div>
                  <span className={perfilEmpleado.estado === "ACTIVO" ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700" : "rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700"}>{perfilEmpleado.estado === "ACTIVO" ? "Activo" : "Inactivo"}</span>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <ProfileItem label="Codigo Empleado" value={perfilEmpleado.codigo_empleado} />
                <ProfileItem label="Area" value={areaMap[perfilEmpleado.area] || "-"} />
                <ProfileItem label="Sucursal" value={sucursalMap[perfilEmpleado.sucursal] || "-"} />
                <ProfileItem label="Correo" value={perfilEmpleado.correo || "-"} />
                <ProfileItem label="Telefono" value={perfilEmpleado.telefono || "-"} />
                <ProfileItem label="Fecha de Ingreso" value={perfilEmpleado.fecha_ingreso || "-"} />
              </div>
            </div>
          )}
          <DialogFooter><Button type="button" className="bg-slate-900 hover:bg-slate-800" onClick={() => setPerfilEmpleado(null)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: { label: string; value: string }[]; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={`${label}-${o.value || "all"}`} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-700">{value || "-"}</p>
    </div>
  )
}

function getInitials(nombre: string) {
  const parts = nombre.split(" ").filter(Boolean)
  const first = parts[0]?.[0] ?? ""
  const second = parts[1]?.[0] ?? ""
  return `${first}${second}`.toUpperCase()
}

