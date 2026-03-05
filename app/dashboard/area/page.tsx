"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Building2, Download, Pencil, PlusCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { apiEndpoints, authRequest } from "@/lib/api-client"
import useUserStore from "@/stores/useUserStore"

type Empresa = { id: number; razon_social: string }
type Sucursal = { id: number; empresa: number; nombre: string }
type Area = {
  id: number
  sucursal: number
  codigo: string
  nombre: string
  tipo: "GERENCIA" | "OFICINA" | "SUBGERENCIA" | "UNIDAD"
  parent: number | null
  activo: boolean
}

type FormState = {
  codigo: string
  nombre: string
  tipo: Area["tipo"]
  parent: string
  activo: boolean
}

const emptyForm = (): FormState => ({
  codigo: "",
  nombre: "",
  tipo: "GERENCIA",
  parent: "",
  activo: true,
})

const asArray = (x: unknown) =>
  Array.isArray(x) ? x : x && typeof x === "object" && Array.isArray((x as { results?: unknown[] }).results) ? (x as { results: unknown[] }).results : []

const tipoLabel: Record<Area["tipo"], string> = {
  GERENCIA: "Gerencia",
  OFICINA: "Oficina",
  SUBGERENCIA: "Subgerencia",
  UNIDAD: "Unidad",
}

export default function Page() {
  const token = useUserStore((s) => s.accessToken)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [empresaId, setEmpresaId] = useState("")
  const [sucursalId, setSucursalId] = useState("")
  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    const load = async () => {
      if (!token) return setLoading(false)
      try {
        const [e, s, a] = await Promise.all([
          authRequest(apiEndpoints.empresas, { token }),
          authRequest(apiEndpoints.sucursales, { token }),
          authRequest(apiEndpoints.areas, { token }),
        ])
        const nextEmpresas = asArray(e) as Empresa[]
        const nextSucursales = asArray(s) as Sucursal[]
        const nextAreas = asArray(a) as Area[]
        setEmpresas(nextEmpresas)
        setSucursales(nextSucursales)
        setAreas(nextAreas)

        const firstEmpresa = nextEmpresas[0]?.id
        const firstSucursal = nextSucursales.find((x) => x.empresa === firstEmpresa)?.id || nextSucursales[0]?.id
        setEmpresaId(firstEmpresa ? String(firstEmpresa) : "")
        setSucursalId(firstSucursal ? String(firstSucursal) : "")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo cargar areas")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const sucursalesFiltradas = useMemo(() => {
    if (!empresaId) return sucursales
    return sucursales.filter((x) => x.empresa === Number(empresaId))
  }, [empresaId, sucursales])

  const areasFiltradas = useMemo(() => {
    if (!sucursalId) return areas
    return areas.filter((x) => x.sucursal === Number(sucursalId))
  }, [areas, sucursalId])

  const areaById = useMemo(() => Object.fromEntries(areas.map((x) => [x.id, x])), [areas])

  const parentsDisponibles = useMemo(() => {
    if (!sucursalId) return []
    const base = areas.filter((x) => x.sucursal === Number(sucursalId) && x.id !== editingId)
    if (form.tipo === "SUBGERENCIA") return base.filter((x) => x.tipo === "GERENCIA")
    if (form.tipo === "UNIDAD") return base.filter((x) => x.tipo === "SUBGERENCIA")
    return []
  }, [areas, sucursalId, form.tipo, editingId])

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm())
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token || !sucursalId) return

    const payload = {
      sucursal: Number(sucursalId),
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      parent: form.tipo === "SUBGERENCIA" || form.tipo === "UNIDAD" ? (form.parent ? Number(form.parent) : null) : null,
      activo: form.activo,
    }

    try {
      setSaving(true)
      if (editingId) {
        const updated = (await authRequest(`${apiEndpoints.areas}${editingId}/`, {
          method: "PUT",
          body: payload,
          token,
        })) as Area
        setAreas((prev) => prev.map((x) => (x.id === editingId ? updated : x)))
        toast.success("Area actualizada")
      } else {
        const created = (await authRequest(apiEndpoints.areas, {
          method: "POST",
          body: payload,
          token,
        })) as Area
        setAreas((prev) => [created, ...prev])
        toast.success("Area registrada")
      }
      setOpen(false)
      resetForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el area")
    } finally {
      setSaving(false)
    }
  }

  const onEdit = (item: Area) => {
    setEditingId(item.id)
    setForm({
      codigo: item.codigo,
      nombre: item.nombre,
      tipo: item.tipo,
      parent: item.parent ? String(item.parent) : "",
      activo: item.activo,
    })
    setSucursalId(String(item.sucursal))
    const suc = sucursales.find((x) => x.id === item.sucursal)
    if (suc) setEmpresaId(String(suc.empresa))
    setOpen(true)
  }

  const onDelete = async (item: Area) => {
    if (!token || !window.confirm(`Eliminar area "${item.nombre}"?`)) return
    try {
      await authRequest(`${apiEndpoints.areas}${item.id}/`, { method: "DELETE", token })
      setAreas((prev) => prev.filter((x) => x.id !== item.id))
      toast.success("Area eliminada")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el area")
    }
  }

  if (!token) return <section className="p-6 text-sm text-slate-600">Inicia sesion para continuar.</section>

  return (
    <section className="min-h-[calc(100vh-7rem)] bg-[radial-gradient(circle_at_top_right,#dcfce7_0%,#f8fafc_45%,#eef2ff_100%)] p-3 md:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <header className="rounded-2xl border border-white/50 bg-white/80 p-5 shadow-lg backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                <Building2 size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-800 md:text-3xl">Gestion de Areas</h1>
                <p className="text-sm text-slate-500">Administra y organiza las areas institucionales.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50">
                <Download size={16} />
                Reporte
              </button>
              <Dialog
                open={open}
                onOpenChange={(next) => {
                  setOpen(next)
                  if (!next) resetForm()
                }}
              >
                <DialogTrigger asChild>
                  <button
                    onClick={() => {
                      resetForm()
                      setOpen(true)
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-emerald-700"
                  >
                    <PlusCircle size={16} />
                    Nueva Area
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>{editingId ? "Editar Area" : "Nueva Area"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={onSubmit} className="grid gap-3">
                    <Input placeholder="Codigo" required value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} />
                    <Input placeholder="Nombre del area" required value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} />
                    <select
                      className="h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-slate-700"
                      value={form.tipo}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          tipo: e.target.value as Area["tipo"],
                          parent: "",
                        }))
                      }
                    >
                      <option value="GERENCIA">Gerencia</option>
                      <option value="OFICINA">Oficina</option>
                      <option value="SUBGERENCIA">Subgerencia</option>
                      <option value="UNIDAD">Unidad</option>
                    </select>
                    {(form.tipo === "SUBGERENCIA" || form.tipo === "UNIDAD") && (
                      <select
                        required
                        className="h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-slate-700"
                        value={form.parent}
                        onChange={(e) => setForm((p) => ({ ...p, parent: e.target.value }))}
                      >
                        <option value="">Seleccione area padre</option>
                        {parentsDisponibles.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.codigo} - {x.nombre}
                          </option>
                        ))}
                      </select>
                    )}
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={form.activo} onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))} />
                      Activo
                    </label>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                      <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="mb-2 block text-sm font-medium text-slate-700">Empresa</label>
            <select
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-slate-700"
              value={empresaId}
              onChange={(e) => {
                const nextEmpresaId = e.target.value
                setEmpresaId(nextEmpresaId)
                const firstSucursal = sucursales.find((x) => x.empresa === Number(nextEmpresaId))
                setSucursalId(firstSucursal ? String(firstSucursal.id) : "")
              }}
            >
              {empresas.map((x) => (
                <option key={x.id} value={x.id}>{x.razon_social}</option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="mb-2 block text-sm font-medium text-slate-700">Sucursal</label>
            <select className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-slate-700" value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}>
              {sucursalesFiltradas.map((x) => (
                <option key={x.id} value={x.id}>{x.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="max-h-[460px] overflow-auto">
            <table className="w-full min-w-[900px]">
              <thead className="sticky top-0 z-10 bg-teal-700 text-white">
                <tr className="text-sm">
                  <th className="w-24 px-4 py-3 text-left font-semibold">Codigo</th>
                  <th className="px-4 py-3 text-left font-semibold">Area</th>
                  <th className="w-36 px-4 py-3 text-left font-semibold">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold">Depende de</th>
                  <th className="w-24 px-4 py-3 text-center font-semibold">Editar</th>
                  <th className="w-24 px-4 py-3 text-center font-semibold">Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="border-t border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                      Cargando areas...
                    </td>
                  </tr>
                ) : areasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border-t border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                      No hay registros.
                    </td>
                  </tr>
                ) : (
                  areasFiltradas.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.codigo}</td>
                      <td className="border-t border-slate-200 px-4 py-3 font-medium text-slate-700">{item.nombre}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{tipoLabel[item.tipo]}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">
                        {item.parent ? areaById[item.parent]?.nombre || "-" : "-"}
                      </td>
                      <td className="border-t border-slate-200 px-4 py-3 text-center">
                        <button onClick={() => onEdit(item)} className="inline-flex rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-600 transition hover:bg-amber-100">
                          <Pencil size={16} />
                        </button>
                      </td>
                      <td className="border-t border-slate-200 px-4 py-3 text-center">
                        <button onClick={() => onDelete(item)} className="inline-flex rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

