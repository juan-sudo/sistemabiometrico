"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Building2, Download, Pencil, PlusCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { apiEndpoints, authRequest } from "@/lib/api-client"
import useUserStore from "@/stores/useUserStore"

type Empresa = {
  id: number
  razon_social: string
}

type Sucursal = {
  id: number
  empresa: number
  codigo: string
  nombre: string
  activo: boolean
}

type FormState = {
  empresa: string
  codigo: string
  nombre: string
  activo: boolean
}

const emptyForm = (): FormState => ({
  empresa: "",
  codigo: "",
  nombre: "",
  activo: true,
})

const asArray = (x: unknown) =>
  Array.isArray(x) ? x : x && typeof x === "object" && Array.isArray((x as { results?: unknown[] }).results) ? (x as { results: unknown[] }).results : []

export default function Page() {
  const token = useUserStore((s) => s.accessToken)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [empresaFilter, setEmpresaFilter] = useState("")
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)

  const empresaMap = useMemo(
    () => Object.fromEntries(empresas.map((x) => [x.id, x.razon_social])),
    [empresas]
  )

  const filteredRows = useMemo(() => {
    if (!empresaFilter) return sucursales
    return sucursales.filter((x) => x.empresa === Number(empresaFilter))
  }, [sucursales, empresaFilter])

  useEffect(() => {
    const load = async () => {
      if (!token) return setLoading(false)
      try {
        const [e, s] = await Promise.all([
          authRequest(apiEndpoints.empresas, { token }),
          authRequest(apiEndpoints.sucursales, { token }),
        ])
        const nextEmpresas = asArray(e) as Empresa[]
        const nextSucursales = asArray(s) as Sucursal[]
        setEmpresas(nextEmpresas)
        setSucursales(nextSucursales)
        if (nextEmpresas[0]) {
          setEmpresaFilter(String(nextEmpresas[0].id))
          setForm((prev) => ({ ...prev, empresa: String(nextEmpresas[0].id) }))
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo cargar sucursales")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const resetForm = () => {
    setEditingId(null)
    setForm({
      ...emptyForm(),
      empresa: empresas[0] ? String(empresas[0].id) : "",
    })
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) return

    const payload = {
      empresa: Number(form.empresa),
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      activo: form.activo,
    }

    try {
      setSaving(true)
      if (editingId) {
        const updated = (await authRequest(`${apiEndpoints.sucursales}${editingId}/`, {
          method: "PUT",
          body: payload,
          token,
        })) as Sucursal
        setSucursales((prev) => prev.map((x) => (x.id === editingId ? updated : x)))
        toast.success("Sucursal actualizada")
      } else {
        const created = (await authRequest(apiEndpoints.sucursales, {
          method: "POST",
          body: payload,
          token,
        })) as Sucursal
        setSucursales((prev) => [created, ...prev])
        toast.success("Sucursal creada")
      }
      setOpen(false)
      resetForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la sucursal")
    } finally {
      setSaving(false)
    }
  }

  const onEdit = (item: Sucursal) => {
    setEditingId(item.id)
    setForm({
      empresa: String(item.empresa),
      codigo: item.codigo,
      nombre: item.nombre,
      activo: item.activo,
    })
    setOpen(true)
  }

  const onDelete = async (item: Sucursal) => {
    if (!token || !window.confirm(`Eliminar sucursal "${item.nombre}"?`)) return
    try {
      await authRequest(`${apiEndpoints.sucursales}${item.id}/`, { method: "DELETE", token })
      setSucursales((prev) => prev.filter((x) => x.id !== item.id))
      toast.success("Sucursal eliminada")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la sucursal")
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
                <h1 className="text-2xl font-semibold tracking-tight text-slate-800 md:text-3xl">Lista de Sucursales</h1>
                <p className="text-sm text-slate-500">Administra las sucursales de cada empresa municipal.</p>
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
                    Nueva Sucursal
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>{editingId ? "Editar Sucursal" : "Nueva Sucursal"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={onSubmit} className="grid gap-3">
                    <label className="text-sm font-medium text-slate-700">Empresa</label>
                    <select
                      required
                      className="h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-slate-700"
                      value={form.empresa}
                      onChange={(e) => setForm((p) => ({ ...p, empresa: e.target.value }))}
                    >
                      {empresas.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.razon_social}
                        </option>
                      ))}
                    </select>
                    <Input placeholder="Codigo (ej: MPLP)" required value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} />
                    <Input placeholder="Nombre de sucursal" required value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} />
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={form.activo} onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))} />
                      Activa
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

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-slate-700">Empresa</label>
          <select
            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-slate-700 md:max-w-2xl"
            value={empresaFilter}
            onChange={(e) => setEmpresaFilter(e.target.value)}
          >
            {empresas.map((x) => (
              <option key={x.id} value={x.id}>
                {x.razon_social}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full min-w-[900px]">
              <thead className="sticky top-0 z-10 bg-teal-700 text-white">
                <tr className="text-sm">
                  <th className="w-24 px-4 py-3 text-left font-semibold">Codigo</th>
                  <th className="px-4 py-3 text-left font-semibold">Sucursal</th>
                  <th className="px-4 py-3 text-left font-semibold">Empresa</th>
                  <th className="w-28 px-4 py-3 text-left font-semibold">Estado</th>
                  <th className="w-24 px-4 py-3 text-center font-semibold">Editar</th>
                  <th className="w-24 px-4 py-3 text-center font-semibold">Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="border-t border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                      Cargando sucursales...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border-t border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                      No hay registros.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.codigo}</td>
                      <td className="border-t border-slate-200 px-4 py-3 font-medium text-slate-700">{item.nombre}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{empresaMap[item.empresa] || "-"}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.activo ? "Activa" : "Inactiva"}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-center">
                        <button onClick={() => onEdit(item)} className="inline-flex rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-600 transition hover:bg-amber-100" aria-label="Editar sucursal">
                          <Pencil size={16} />
                        </button>
                      </td>
                      <td className="border-t border-slate-200 px-4 py-3 text-center">
                        <button onClick={() => onDelete(item)} className="inline-flex rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100" aria-label="Eliminar sucursal">
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

