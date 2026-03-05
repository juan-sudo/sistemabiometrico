"use client"

import { FormEvent, useEffect, useState } from "react"
import { Building2, Download, Pencil, PlusCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { apiEndpoints, authRequest } from "@/lib/api-client"
import useUserStore from "@/stores/useUserStore"

type Empresa = {
  id: number
  codigo: string
  razon_social: string
  ruc: string
  correo: string
  logo: string | null
  activo: boolean
}

type FormState = {
  codigo: string
  razon_social: string
  ruc: string
  correo: string
  activo: boolean
}

const emptyForm = (): FormState => ({
  codigo: "",
  razon_social: "",
  ruc: "",
  correo: "",
  activo: true,
})

const asArray = (x: unknown) =>
  Array.isArray(x) ? x : x && typeof x === "object" && Array.isArray((x as { results?: unknown[] }).results) ? (x as { results: unknown[] }).results : []

export default function Page() {
  const token = useUserStore((s) => s.accessToken)
  const [items, setItems] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    const load = async () => {
      if (!token) return setLoading(false)
      try {
        const data = await authRequest(apiEndpoints.empresas, { token })
        setItems(asArray(data) as Empresa[])
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo cargar empresas")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm())
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) return

    const payload = {
      codigo: form.codigo.trim(),
      razon_social: form.razon_social.trim(),
      ruc: form.ruc.trim(),
      correo: form.correo.trim(),
      activo: form.activo,
    }

    try {
      setSaving(true)
      if (editingId) {
        const updated = (await authRequest(`${apiEndpoints.empresas}${editingId}/`, {
          method: "PUT",
          body: payload,
          token,
        })) as Empresa
        setItems((prev) => prev.map((x) => (x.id === editingId ? updated : x)))
        toast.success("Empresa actualizada")
      } else {
        const created = (await authRequest(apiEndpoints.empresas, {
          method: "POST",
          body: payload,
          token,
        })) as Empresa
        setItems((prev) => [created, ...prev])
        toast.success("Empresa creada")
      }
      setOpen(false)
      resetForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la empresa")
    } finally {
      setSaving(false)
    }
  }

  const onEdit = (item: Empresa) => {
    setEditingId(item.id)
    setForm({
      codigo: item.codigo,
      razon_social: item.razon_social,
      ruc: item.ruc,
      correo: item.correo || "",
      activo: item.activo,
    })
    setOpen(true)
  }

  const onDelete = async (item: Empresa) => {
    if (!token || !window.confirm(`Eliminar empresa "${item.razon_social}"?`)) return
    try {
      await authRequest(`${apiEndpoints.empresas}${item.id}/`, { method: "DELETE", token })
      setItems((prev) => prev.filter((x) => x.id !== item.id))
      toast.success("Empresa eliminada")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la empresa")
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
                <h1 className="text-2xl font-semibold tracking-tight text-slate-800 md:text-3xl">Lista de Empresas</h1>
                <p className="text-sm text-slate-500">Administra y organiza las empresas institucionales.</p>
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
                    Nueva Empresa
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>{editingId ? "Editar Empresa" : "Nueva Empresa"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={onSubmit} className="grid gap-3">
                    <Input placeholder="Codigo" required value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} />
                    <Input placeholder="Razon Social" required value={form.razon_social} onChange={(e) => setForm((p) => ({ ...p, razon_social: e.target.value }))} />
                    <Input placeholder="RUC" required value={form.ruc} onChange={(e) => setForm((p) => ({ ...p, ruc: e.target.value }))} />
                    <Input placeholder="Correo" type="email" value={form.correo} onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))} />
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

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full min-w-[980px]">
              <thead className="sticky top-0 z-10 bg-teal-700 text-white">
                <tr className="text-sm">
                  <th className="w-20 px-4 py-3 text-left font-semibold">Codigo</th>
                  <th className="w-24 px-4 py-3 text-left font-semibold">Logo</th>
                  <th className="px-4 py-3 text-left font-semibold">Razon Social</th>
                  <th className="w-44 px-4 py-3 text-left font-semibold">RUC</th>
                  <th className="w-64 px-4 py-3 text-left font-semibold">Correo</th>
                  <th className="w-24 px-4 py-3 text-center font-semibold">Editar</th>
                  <th className="w-24 px-4 py-3 text-center font-semibold">Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="border-t border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                      Cargando empresas...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border-t border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                      No hay registros.
                    </td>
                  </tr>
                ) : (
                  items.map((empresa, index) => (
                    <tr key={empresa.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{empresa.codigo}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-500">{empresa.logo ? "Cargado" : "-"}</td>
                      <td className="border-t border-slate-200 px-4 py-3 font-medium text-slate-700">{empresa.razon_social}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{empresa.ruc}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{empresa.correo || "-"}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-center">
                        <button onClick={() => onEdit(empresa)} className="inline-flex rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-600 transition hover:bg-amber-100" aria-label="Editar empresa">
                          <Pencil size={16} />
                        </button>
                      </td>
                      <td className="border-t border-slate-200 px-4 py-3 text-center">
                        <button onClick={() => onDelete(empresa)} className="inline-flex rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100" aria-label="Eliminar empresa">
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

