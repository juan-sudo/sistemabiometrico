"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Eye, Pencil, PlusCircle, Trash2, UsersRound } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { apiEndpoints, authRequest } from "@/lib/api-client"
import useUserStore from "@/stores/useUserStore"

type Personal = {
  id: number
  empresa: number
  sucursal: number
  area: number
  tipo_documento: number
  tipo_trabajador: number
  categoria: number
  tipo_sindicato: number | null
  codigo_empleado: string
  numero_documento: string
  nombres_completos: string
  estado: "ACTIVO" | "INACTIVO"
}

type Catalog = { id: number; empresa?: number; sucursal?: number; nombre?: string; descripcion?: string; razon_social?: string }

type FormState = {
  empresa: string
  sucursal: string
  area: string
  tipo_documento: string
  tipo_trabajador: string
  categoria: string
  tipo_sindicato: string
  codigo_empleado: string
  numero_documento: string
  nombres_completos: string
  estado: "ACTIVO" | "INACTIVO"
}

const asArray = (x: unknown) =>
  Array.isArray(x) ? x : x && typeof x === "object" && Array.isArray((x as { results?: unknown[] }).results) ? (x as { results: unknown[] }).results : []

const emptyForm = (): FormState => ({
  empresa: "",
  sucursal: "",
  area: "",
  tipo_documento: "",
  tipo_trabajador: "",
  categoria: "",
  tipo_sindicato: "",
  codigo_empleado: "",
  numero_documento: "",
  nombres_completos: "",
  estado: "ACTIVO",
})

export default function Page() {
  const token = useUserStore((s) => s.accessToken)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [detail, setDetail] = useState<Personal | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Personal[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)

  const [empresas, setEmpresas] = useState<Catalog[]>([])
  const [sucursales, setSucursales] = useState<Catalog[]>([])
  const [areas, setAreas] = useState<Catalog[]>([])
  const [tiposDoc, setTiposDoc] = useState<Catalog[]>([])
  const [tiposTrab, setTiposTrab] = useState<Catalog[]>([])
  const [categorias, setCategorias] = useState<Catalog[]>([])
  const [tiposSind, setTiposSind] = useState<Catalog[]>([])

  const byId = (arr: Catalog[]) => Object.fromEntries(arr.map((x) => [x.id, x.nombre || x.descripcion || x.razon_social || ""]))
  const areasMap = useMemo(() => byId(areas), [areas])
  const empMap = useMemo(() => byId(empresas), [empresas])
  const sucMap = useMemo(() => byId(sucursales), [sucursales])
  const docMap = useMemo(() => byId(tiposDoc), [tiposDoc])
  const trabMap = useMemo(() => byId(tiposTrab), [tiposTrab])
  const catMap = useMemo(() => byId(categorias), [categorias])
  const sindMap = useMemo(() => byId(tiposSind), [tiposSind])

  useEffect(() => {
    const load = async () => {
      if (!token) return setLoading(false)
      try {
        const [p, e, s, a, td, tt, c, ts] = await Promise.all([
          authRequest(apiEndpoints.personales, { token }),
          authRequest(apiEndpoints.empresas, { token }),
          authRequest(apiEndpoints.sucursales, { token }),
          authRequest(apiEndpoints.areas, { token }),
          authRequest(apiEndpoints.tiposDocumento, { token }),
          authRequest(apiEndpoints.tiposTrabajador, { token }),
          authRequest(apiEndpoints.categorias, { token }),
          authRequest(apiEndpoints.tiposSindicato, { token }),
        ])
        const nextEmp = asArray(e) as Catalog[]
        const nextSuc = asArray(s) as Catalog[]
        const nextAre = asArray(a) as Catalog[]
        const nextDoc = asArray(td) as Catalog[]
        const nextTrab = asArray(tt) as Catalog[]
        const nextCat = asArray(c) as Catalog[]
        const nextSind = asArray(ts) as Catalog[]
        setItems(asArray(p) as Personal[])
        setEmpresas(nextEmp)
        setSucursales(nextSuc)
        setAreas(nextAre)
        setTiposDoc(nextDoc)
        setTiposTrab(nextTrab)
        setCategorias(nextCat)
        setTiposSind(nextSind)
        setForm((prev) => ({
          ...prev,
          empresa: String(nextEmp[0]?.id || ""),
          sucursal: String(nextSuc[0]?.id || ""),
          area: String(nextAre[0]?.id || ""),
          tipo_documento: String(nextDoc[0]?.id || ""),
          tipo_trabajador: String(nextTrab[0]?.id || ""),
          categoria: String(nextCat[0]?.id || ""),
          tipo_sindicato: String(nextSind[0]?.id || ""),
        }))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo cargar personal")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((x) => `${x.nombres_completos} ${x.numero_documento} ${areasMap[x.area] || ""}`.toLowerCase().includes(q))
  }, [items, search, areasMap])

  const onSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) return
    const payload = {
      empresa: Number(form.empresa),
      sucursal: Number(form.sucursal),
      area: Number(form.area),
      ubicacion: null,
      tipo_documento: Number(form.tipo_documento),
      tipo_trabajador: Number(form.tipo_trabajador),
      categoria: Number(form.categoria),
      tipo_sindicato: form.tipo_sindicato ? Number(form.tipo_sindicato) : null,
      cargo: null,
      codigo_empleado: form.codigo_empleado.trim(),
      numero_documento: form.numero_documento.trim(),
      nombres_completos: form.nombres_completos.trim(),
      correo: "",
      telefono: "",
      fecha_ingreso: null,
      estado: form.estado,
    }
    try {
      setSaving(true)
      if (editingId) {
        const updated = (await authRequest(`${apiEndpoints.personales}${editingId}/`, { method: "PUT", body: payload, token })) as Personal
        setItems((prev) => prev.map((x) => (x.id === editingId ? updated : x)))
        toast.success("Personal actualizado")
      } else {
        const created = (await authRequest(apiEndpoints.personales, { method: "POST", body: payload, token })) as Personal
        setItems((prev) => [created, ...prev])
        toast.success("Personal creado")
      }
      setOpen(false)
      setEditingId(null)
      setForm((prev) => ({ ...prev, codigo_empleado: "", numero_documento: "", nombres_completos: "" }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  const edit = (x: Personal) => {
    setEditingId(x.id)
    setForm({
      empresa: String(x.empresa),
      sucursal: String(x.sucursal),
      area: String(x.area),
      tipo_documento: String(x.tipo_documento),
      tipo_trabajador: String(x.tipo_trabajador),
      categoria: String(x.categoria),
      tipo_sindicato: x.tipo_sindicato ? String(x.tipo_sindicato) : "",
      codigo_empleado: x.codigo_empleado,
      numero_documento: x.numero_documento,
      nombres_completos: x.nombres_completos,
      estado: x.estado,
    })
    setOpen(true)
  }

  const remove = async (x: Personal) => {
    if (!token || !window.confirm(`Eliminar a ${x.nombres_completos}?`)) return
    try {
      await authRequest(`${apiEndpoints.personales}${x.id}/`, { method: "DELETE", token })
      setItems((prev) => prev.filter((p) => p.id !== x.id))
      toast.success("Personal eliminado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar")
    }
  }

  if (!token) return <section className="p-6 text-sm text-slate-600">Inicia sesion para continuar.</section>

  return (
    <section className="min-h-[calc(100vh-7rem)] bg-[radial-gradient(circle_at_top_right,#dcfce7_0%,#f8fafc_45%,#eef2ff_100%)] p-3 md:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <header className="rounded-2xl border border-white/50 bg-white/80 p-5 shadow-lg backdrop-blur md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700"><UsersRound size={22} /></div>
              <div><h1 className="text-2xl font-semibold text-slate-800">Mantenimiento de Personal</h1></div>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button onClick={() => { setEditingId(null); setOpen(true) }} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
                  <PlusCircle size={16} /> Agregar personal
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader><DialogTitle>{editingId ? "Editar personal" : "Agregar personal"}</DialogTitle></DialogHeader>
                <form className="grid gap-3 md:grid-cols-3" onSubmit={onSave}>
                  <Input required placeholder="Codigo empleado" value={form.codigo_empleado} onChange={(e) => setForm((p) => ({ ...p, codigo_empleado: e.target.value }))} />
                  <Input required placeholder="Numero documento" value={form.numero_documento} onChange={(e) => setForm((p) => ({ ...p, numero_documento: e.target.value }))} />
                  <Input required placeholder="Nombres completos" value={form.nombres_completos} onChange={(e) => setForm((p) => ({ ...p, nombres_completos: e.target.value }))} />
                  <select className="h-9 rounded-md border px-3 text-sm" value={form.empresa} onChange={(e) => setForm((p) => ({ ...p, empresa: e.target.value }))}>{empresas.map((x) => <option key={x.id} value={x.id}>{x.razon_social}</option>)}</select>
                  <select className="h-9 rounded-md border px-3 text-sm" value={form.sucursal} onChange={(e) => setForm((p) => ({ ...p, sucursal: e.target.value }))}>{sucursales.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select>
                  <select className="h-9 rounded-md border px-3 text-sm" value={form.area} onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))}>{areas.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select>
                  <select className="h-9 rounded-md border px-3 text-sm" value={form.tipo_documento} onChange={(e) => setForm((p) => ({ ...p, tipo_documento: e.target.value }))}>{tiposDoc.map((x) => <option key={x.id} value={x.id}>{x.descripcion}</option>)}</select>
                  <select className="h-9 rounded-md border px-3 text-sm" value={form.tipo_trabajador} onChange={(e) => setForm((p) => ({ ...p, tipo_trabajador: e.target.value }))}>{tiposTrab.map((x) => <option key={x.id} value={x.id}>{x.descripcion}</option>)}</select>
                  <select className="h-9 rounded-md border px-3 text-sm" value={form.categoria} onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}>{categorias.map((x) => <option key={x.id} value={x.id}>{x.descripcion}</option>)}</select>
                  <select className="h-9 rounded-md border px-3 text-sm" value={form.tipo_sindicato} onChange={(e) => setForm((p) => ({ ...p, tipo_sindicato: e.target.value }))}><option value="">Sin sindicato</option>{tiposSind.map((x) => <option key={x.id} value={x.id}>{x.descripcion}</option>)}</select>
                  <select className="h-9 rounded-md border px-3 text-sm" value={form.estado} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value as FormState["estado"] }))}><option value="ACTIVO">Activo</option><option value="INACTIVO">Inactivo</option></select>
                  <DialogFooter className="md:col-span-3">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombres, numero de documento o area" className="md:max-w-xl" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[860px]">
            <thead className="bg-teal-700 text-white">
              <tr className="text-sm">
                <th className="px-4 py-3 text-left">Area</th><th className="px-4 py-3 text-left">Documento</th><th className="px-4 py-3 text-left">Nombres</th><th className="px-4 py-3 text-left">Estado</th><th className="px-4 py-3 text-center">Detalle</th><th className="px-4 py-3 text-center">Editar</th><th className="px-4 py-3 text-center">Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">Cargando...</td></tr> : filtered.map((x, i) => (
                <tr key={x.id} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                  <td className="border-t px-4 py-3">{areasMap[x.area] || "-"}</td>
                  <td className="border-t px-4 py-3">{x.numero_documento}</td>
                  <td className="border-t px-4 py-3 font-medium">{x.nombres_completos}</td>
                  <td className="border-t px-4 py-3">{x.estado === "ACTIVO" ? "Activo" : "Inactivo"}</td>
                  <td className="border-t px-4 py-3 text-center"><button onClick={() => setDetail(x)} className="rounded border border-blue-200 bg-blue-50 p-2 text-blue-600"><Eye size={16} /></button></td>
                  <td className="border-t px-4 py-3 text-center"><button onClick={() => edit(x)} className="rounded border border-amber-200 bg-amber-50 p-2 text-amber-600"><Pencil size={16} /></button></td>
                  <td className="border-t px-4 py-3 text-center"><button onClick={() => remove(x)} className="rounded border border-rose-200 bg-rose-50 p-2 text-rose-600"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Dialog open={!!detail} onOpenChange={(x) => !x && setDetail(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Detalle</DialogTitle></DialogHeader>
            {detail && (
              <div className="grid gap-2 text-sm">
                <div><b>Nombre:</b> {detail.nombres_completos}</div>
                <div><b>Documento:</b> {detail.numero_documento}</div>
                <div><b>Empresa:</b> {empMap[detail.empresa] || "-"}</div>
                <div><b>Sucursal:</b> {sucMap[detail.sucursal] || "-"}</div>
                <div><b>Area:</b> {areasMap[detail.area] || "-"}</div>
                <div><b>Tipo documento:</b> {docMap[detail.tipo_documento] || "-"}</div>
                <div><b>Tipo trabajador:</b> {trabMap[detail.tipo_trabajador] || "-"}</div>
                <div><b>Categoria:</b> {catMap[detail.categoria] || "-"}</div>
                <div><b>Sindicato:</b> {detail.tipo_sindicato ? sindMap[detail.tipo_sindicato] || "-" : "-"}</div>
              </div>
            )}
            <DialogFooter><Button onClick={() => setDetail(null)}>Cerrar</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <p className="px-1 text-sm font-semibold text-slate-600">Registros: {filtered.length}</p>
      </div>
    </section>
  )
}

