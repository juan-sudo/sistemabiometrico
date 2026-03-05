"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Clock3, Download, FileUp, Pencil, PlusCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { apiEndpoints, authRequest } from "@/lib/api-client"
import useUserStore from "@/stores/useUserStore"

type Turno = {
  id: number
  codigo: string
  nombre: string
  tipo: "GENERAL" | "GENERAL_PERSONALIZADO" | "DESCANSO"
  activo: boolean
}

type Bloque = {
  id: number
  turno: number
  orden: number
  hora_entrada: string
  hora_salida: string
}

type FormState = {
  codigo: string
  nombre: string
  tipo: Turno["tipo"]
  activo: boolean
  entrada1: string
  salida1: string
  entrada2: string
  salida2: string
}

const emptyForm = (): FormState => ({
  codigo: "",
  nombre: "",
  tipo: "GENERAL",
  activo: true,
  entrada1: "",
  salida1: "",
  entrada2: "",
  salida2: "",
})

const asArray = (x: unknown) =>
  Array.isArray(x) ? x : x && typeof x === "object" && Array.isArray((x as { results?: unknown[] }).results) ? (x as { results: unknown[] }).results : []

const tipoLabel: Record<Turno["tipo"], string> = {
  GENERAL: "General",
  GENERAL_PERSONALIZADO: "General Personalizado",
  DESCANSO: "Descanso",
}

export default function Page() {
  const token = useUserStore((s) => s.accessToken)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [bloques, setBloques] = useState<Bloque[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)

  const loadData = async () => {
    if (!token) return
    const [t, b] = await Promise.all([
      authRequest(apiEndpoints.turnos, { token }),
      authRequest(apiEndpoints.turnoBloquesHorario, { token }),
    ])
    setTurnos(asArray(t) as Turno[])
    setBloques(asArray(b) as Bloque[])
  }

  useEffect(() => {
    const load = async () => {
      if (!token) return setLoading(false)
      try {
        await loadData()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo cargar turnos")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const bloquesByTurno = useMemo(() => {
    const m: Record<number, Bloque[]> = {}
    for (const b of bloques) {
      if (!m[b.turno]) m[b.turno] = []
      m[b.turno].push(b)
    }
    Object.values(m).forEach((arr) => arr.sort((a, b) => a.orden - b.orden))
    return m
  }, [bloques])

  const rows = useMemo(() => {
    return turnos.map((t) => {
      const bs = bloquesByTurno[t.id] || []
      return {
        ...t,
        entrada: bs.map((x) => x.hora_entrada.slice(0, 5)).join(" / "),
        salida: bs.map((x) => x.hora_salida.slice(0, 5)).join(" / "),
      }
    })
  }, [turnos, bloquesByTurno])

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((x) => `${x.codigo} ${x.nombre}`.toLowerCase().includes(term))
  }, [rows, search])

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm())
  }

  const validateForm = () => {
    if (!form.codigo.trim() || !form.nombre.trim()) return "Codigo y nombre son obligatorios."
    if (form.tipo === "DESCANSO") return null
    if (!form.entrada1 || !form.salida1) return "El bloque 1 (entrada/salida) es obligatorio."
    if (form.tipo === "GENERAL_PERSONALIZADO") {
      const hasSecond = !!form.entrada2 || !!form.salida2
      if (hasSecond && (!form.entrada2 || !form.salida2)) return "Completa entrada y salida del bloque 2."
    }
    return null
  }

  const buildBloquesPayload = () => {
    if (form.tipo === "DESCANSO") {
      return [{ orden: 1, hora_entrada: "00:00", hora_salida: "00:00" }]
    }
    const result = [{ orden: 1, hora_entrada: form.entrada1, hora_salida: form.salida1 }]
    if (form.tipo === "GENERAL_PERSONALIZADO" && form.entrada2 && form.salida2) {
      result.push({ orden: 2, hora_entrada: form.entrada2, hora_salida: form.salida2 })
    }
    return result
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) return
    const error = validateForm()
    if (error) return toast.error(error)

    const turnoPayload = {
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      activo: form.activo,
    }
    const bloquesPayload = buildBloquesPayload()

    try {
      setSaving(true)
      if (editingId) {
        await authRequest(`${apiEndpoints.turnos}${editingId}/`, {
          method: "PUT",
          body: turnoPayload,
          token,
        })
        const existentes = bloquesByTurno[editingId] || []
        await Promise.all(
          existentes.map((b) =>
            authRequest(`${apiEndpoints.turnoBloquesHorario}${b.id}/`, { method: "DELETE", token })
          )
        )
        await Promise.all(
          bloquesPayload.map((b) =>
            authRequest(apiEndpoints.turnoBloquesHorario, {
              method: "POST",
              body: { ...b, turno: editingId },
              token,
            })
          )
        )
        toast.success("Turno actualizado")
      } else {
        const created = (await authRequest(apiEndpoints.turnos, {
          method: "POST",
          body: turnoPayload,
          token,
        })) as Turno
        await Promise.all(
          bloquesPayload.map((b) =>
            authRequest(apiEndpoints.turnoBloquesHorario, {
              method: "POST",
              body: { ...b, turno: created.id },
              token,
            })
          )
        )
        toast.success("Turno creado")
      }
      await loadData()
      setOpen(false)
      resetForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar turno")
    } finally {
      setSaving(false)
    }
  }

  const onEdit = (row: (Turno & { entrada: string; salida: string })) => {
    const bs = (bloquesByTurno[row.id] || []).sort((a, b) => a.orden - b.orden)
    setEditingId(row.id)
    setForm({
      codigo: row.codigo,
      nombre: row.nombre,
      tipo: row.tipo,
      activo: row.activo,
      entrada1: bs[0]?.hora_entrada?.slice(0, 5) || "",
      salida1: bs[0]?.hora_salida?.slice(0, 5) || "",
      entrada2: bs[1]?.hora_entrada?.slice(0, 5) || "",
      salida2: bs[1]?.hora_salida?.slice(0, 5) || "",
    })
    setOpen(true)
  }

  const onDelete = async (row: Turno) => {
    if (!token || !window.confirm(`Eliminar turno "${row.nombre}"?`)) return
    try {
      await authRequest(`${apiEndpoints.turnos}${row.id}/`, { method: "DELETE", token })
      await loadData()
      toast.success("Turno eliminado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar turno")
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
                <Clock3 size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-800 md:text-3xl">Lista de Turnos</h1>
                <p className="text-sm text-slate-500">Administra y organiza los turnos institucionales.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50">
                <FileUp size={16} />
                Importacion
              </button>
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
                    Nuevo
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>{editingId ? "Editar turno" : "Nuevo turno"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={onSubmit} className="grid gap-3">
                    <Input placeholder="Codigo de turno" required value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} />
                    <Input placeholder="Nombre de turno" required value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} />
                    <select className="h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-slate-700" value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as Turno["tipo"] }))}>
                      <option value="GENERAL">General</option>
                      <option value="GENERAL_PERSONALIZADO">General Personalizado</option>
                      <option value="DESCANSO">Descanso</option>
                    </select>

                    {form.tipo !== "DESCANSO" && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <Input type="time" value={form.entrada1} onChange={(e) => setForm((p) => ({ ...p, entrada1: e.target.value }))} />
                          <Input type="time" value={form.salida1} onChange={(e) => setForm((p) => ({ ...p, salida1: e.target.value }))} />
                        </div>
                        {form.tipo === "GENERAL_PERSONALIZADO" && (
                          <div className="grid grid-cols-2 gap-3">
                            <Input type="time" value={form.entrada2} onChange={(e) => setForm((p) => ({ ...p, entrada2: e.target.value }))} />
                            <Input type="time" value={form.salida2} onChange={(e) => setForm((p) => ({ ...p, salida2: e.target.value }))} />
                          </div>
                        )}
                      </>
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

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-slate-700">Buscar turno</label>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ingrese nombre de Turno" className="md:max-w-md" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full min-w-[1120px]">
              <thead className="sticky top-0 z-10 bg-teal-700 text-white">
                <tr className="text-sm">
                  <th className="w-28 px-4 py-3 text-left font-semibold">Codigo de Turno</th>
                  <th className="w-80 px-4 py-3 text-left font-semibold">Nombre de Turno</th>
                  <th className="w-56 px-4 py-3 text-left font-semibold">Tipo de Turno</th>
                  <th className="w-40 px-4 py-3 text-left font-semibold">Entrada</th>
                  <th className="w-40 px-4 py-3 text-left font-semibold">Salida</th>
                  <th className="w-24 px-4 py-3 text-center font-semibold">Editar</th>
                  <th className="w-24 px-4 py-3 text-center font-semibold">Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="border-t border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                      Cargando turnos...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border-t border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                      No hay registros.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.codigo}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.nombre}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{tipoLabel[item.tipo]}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.entrada || "00:00"}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.salida || "00:00"}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-center">
                        <button onClick={() => onEdit(item)} className="inline-flex rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-600 transition hover:bg-amber-100" aria-label="Editar turno">
                          <Pencil size={16} />
                        </button>
                      </td>
                      <td className="border-t border-slate-200 px-4 py-3 text-center">
                        <button onClick={() => onDelete(item)} className="inline-flex rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100" aria-label="Eliminar turno">
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

        <p className="px-1 text-sm font-semibold text-slate-600">Registros: {filteredRows.length}</p>
      </div>
    </section>
  )
}

