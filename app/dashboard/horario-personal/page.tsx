"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { CalendarClock, Pencil, PlusCircle, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { apiEndpoints, authRequest } from "@/lib/api-client"
import useUserStore from "@/stores/useUserStore"

type Personal = {
  id: number
  numero_documento: string
  nombres_completos: string
  area: number
  sucursal: number
}

type Turno = {
  id: number
  codigo: string
  nombre: string
  tipo: "GENERAL" | "GENERAL_PERSONALIZADO" | "DESCANSO"
}

type Bloque = {
  id: number
  turno: number
  orden: number
  hora_entrada: string
  hora_salida: string
}

type Area = {
  id: number
  nombre: string
}

type Sucursal = {
  id: number
  nombre: string
}

type PersonalTurno = {
  id: number
  personal: number
  turno: number
  fecha_inicio: string
  fecha_fin: string | null
  observacion: string
}

type FormState = {
  personal: string
  turno: string
  fechaInicio: string
  fechaFin: string
  observacion: string
}

const emptyForm = (): FormState => ({
  personal: "",
  turno: "",
  fechaInicio: "",
  fechaFin: "",
  observacion: "",
})

const asArray = (x: unknown) =>
  Array.isArray(x) ? x : x && typeof x === "object" && Array.isArray((x as { results?: unknown[] }).results) ? (x as { results: unknown[] }).results : []

function formatTimeRange(blocks: Bloque[], key: "hora_entrada" | "hora_salida") {
  return blocks.map((item) => item[key].slice(0, 5)).join(" / ")
}

export default function HorarioPersonalPage() {
  const token = useUserStore((s) => s.accessToken)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [personales, setPersonales] = useState<Personal[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [bloques, setBloques] = useState<Bloque[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [asignaciones, setAsignaciones] = useState<PersonalTurno[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)

  const loadData = async () => {
    if (!token) return
    const [p, t, b, a, s, pt] = await Promise.all([
      authRequest(apiEndpoints.personales, { token }),
      authRequest(apiEndpoints.turnos, { token }),
      authRequest(apiEndpoints.turnoBloquesHorario, { token }),
      authRequest(apiEndpoints.areas, { token }),
      authRequest(apiEndpoints.sucursales, { token }),
      authRequest(apiEndpoints.personalTurnos, { token }),
    ])
    setPersonales(asArray(p) as Personal[])
    setTurnos(asArray(t) as Turno[])
    setBloques(asArray(b) as Bloque[])
    setAreas(asArray(a) as Area[])
    setSucursales(asArray(s) as Sucursal[])
    setAsignaciones(asArray(pt) as PersonalTurno[])
  }

  useEffect(() => {
    const run = async () => {
      if (!token) return setLoading(false)
      try {
        await loadData()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo cargar horarios por personal")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [token])

  const personalMap = useMemo(() => Object.fromEntries(personales.map((item) => [item.id, item])), [personales])
  const turnoMap = useMemo(() => Object.fromEntries(turnos.map((item) => [item.id, item])), [turnos])
  const areaMap = useMemo(() => Object.fromEntries(areas.map((item) => [item.id, item.nombre])), [areas])
  const sucursalMap = useMemo(() => Object.fromEntries(sucursales.map((item) => [item.id, item.nombre])), [sucursales])

  const bloquesByTurno = useMemo(() => {
    const out: Record<number, Bloque[]> = {}
    for (const item of bloques) {
      if (!out[item.turno]) out[item.turno] = []
      out[item.turno].push(item)
    }
    Object.values(out).forEach((items) => items.sort((a, b) => a.orden - b.orden))
    return out
  }, [bloques])

  const rows = useMemo(() => {
    return asignaciones.map((item) => {
      const personal = personalMap[item.personal]
      const turno = turnoMap[item.turno]
      const turnBlocks = turno ? bloquesByTurno[turno.id] || [] : []
      return {
        ...item,
        personalDoc: personal?.numero_documento || "-",
        personalNombre: personal?.nombres_completos || "-",
        areaNombre: personal ? areaMap[personal.area] || "-" : "-",
        sucursalNombre: personal ? sucursalMap[personal.sucursal] || "-" : "-",
        turnoNombre: turno ? `${turno.nombre}` : "-",
        horario: turnBlocks.length
          ? turnBlocks.map((block) => `${block.hora_entrada.slice(0, 5)}-${block.hora_salida.slice(0, 5)}`).join(" / ")
          : "-",
        horaEntrada: formatTimeRange(turnBlocks, "hora_entrada") || "-",
        horaSalida: formatTimeRange(turnBlocks, "hora_salida") || "-",
      }
    })
  }, [asignaciones, personalMap, turnoMap, areaMap, sucursalMap, bloquesByTurno])

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((item) =>
      `${item.personalDoc} ${item.personalNombre} ${item.areaNombre} ${item.turnoNombre}`.toLowerCase().includes(term)
    )
  }, [rows, search])

  const selectedTurnoBlocks = useMemo(() => {
    const turnoId = Number(form.turno)
    if (!turnoId) return []
    return bloquesByTurno[turnoId] || []
  }, [form.turno, bloquesByTurno])

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm())
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) return
    if (!form.personal || !form.turno || !form.fechaInicio) {
      toast.error("Personal, turno y fecha inicio son obligatorios.")
      return
    }

    const payload = {
      personal: Number(form.personal),
      turno: Number(form.turno),
      fecha_inicio: form.fechaInicio,
      fecha_fin: form.fechaFin || null,
      observacion: form.observacion.trim(),
    }

    try {
      setSaving(true)
      if (editingId) {
        await authRequest(`${apiEndpoints.personalTurnos}${editingId}/`, {
          method: "PUT",
          body: payload,
          token,
        })
        toast.success("Horario por personal actualizado")
      } else {
        await authRequest(apiEndpoints.personalTurnos, {
          method: "POST",
          body: payload,
          token,
        })
        toast.success("Horario por personal registrado")
      }
      await loadData()
      setOpen(false)
      resetForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la asignacion")
    } finally {
      setSaving(false)
    }
  }

  const onEdit = (row: PersonalTurno) => {
    setEditingId(row.id)
    setForm({
      personal: String(row.personal),
      turno: String(row.turno),
      fechaInicio: row.fecha_inicio,
      fechaFin: row.fecha_fin || "",
      observacion: row.observacion || "",
    })
    setOpen(true)
  }

  const onDelete = async (row: PersonalTurno) => {
    if (!token || !window.confirm("Eliminar este horario por personal?")) return
    try {
      await authRequest(`${apiEndpoints.personalTurnos}${row.id}/`, { method: "DELETE", token })
      await loadData()
      toast.success("Horario eliminado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar")
    }
  }

  if (!token) return <section className="p-6 text-sm text-slate-600">Inicia sesion para continuar.</section>

  return (
    <section className="min-h-[calc(100vh-7rem)] bg-[radial-gradient(circle_at_top_right,#dcfce7_0%,#f8fafc_45%,#eef2ff_100%)] p-3 md:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <header className="rounded-2xl border border-white/50 bg-white/80 p-5 shadow-lg backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                <CalendarClock size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-800 md:text-3xl">Horario por personal</h1>
                <p className="text-sm text-slate-500">Asigna a cada trabajador un turno con su hora de entrada y salida.</p>
              </div>
            </div>

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
                  Nuevo horario
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar horario" : "Nuevo horario por personal"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="grid gap-3">
                  <select
                    className="h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-slate-700"
                    value={form.personal}
                    onChange={(e) => setForm((prev) => ({ ...prev, personal: e.target.value }))}
                    required
                  >
                    <option value="">Selecciona personal</option>
                    {personales.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.numero_documento} - {item.nombres_completos}
                      </option>
                    ))}
                  </select>

                  <select
                    className="h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-slate-700"
                    value={form.turno}
                    onChange={(e) => setForm((prev) => ({ ...prev, turno: e.target.value }))}
                    required
                  >
                    <option value="">Selecciona turno</option>
                    {turnos.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.codigo} - {item.nombre}
                      </option>
                    ))}
                  </select>

                  <Input
                    type="date"
                    value={form.fechaInicio}
                    onChange={(e) => setForm((prev) => ({ ...prev, fechaInicio: e.target.value }))}
                    required
                  />

                  {editingId && (
                    <Input
                      type="date"
                      value={form.fechaFin}
                      onChange={(e) => setForm((prev) => ({ ...prev, fechaFin: e.target.value }))}
                    />
                  )}

                  <Input placeholder="Observacion" value={form.observacion} onChange={(e) => setForm((prev) => ({ ...prev, observacion: e.target.value }))} />

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Horario del turno seleccionado</p>
                    {selectedTurnoBlocks.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-600">Selecciona un turno para ver sus horas de entrada y salida.</p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {selectedTurnoBlocks.map((block) => (
                          <div key={block.id} className="flex items-center justify-between rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-700">
                            <span>Bloque {block.orden}</span>
                            <span className="font-semibold">
                              {block.hora_entrada.slice(0, 5)} - {block.hora_salida.slice(0, 5)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-slate-700">Buscar asignacion</label>
          <div className="relative md:max-w-lg">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por documento, nombre, area o turno" className="pl-9" />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full min-w-[1280px]">
              <thead className="sticky top-0 z-10 bg-teal-700 text-white">
                <tr className="text-sm">
                  <th className="px-4 py-3 text-left font-semibold">Sucursal</th>
                  <th className="px-4 py-3 text-left font-semibold">Area</th>
                  <th className="px-4 py-3 text-left font-semibold">Numero de documento</th>
                  <th className="px-4 py-3 text-left font-semibold">Nombres completos</th>
                  <th className="px-4 py-3 text-left font-semibold">Turno</th>
                  <th className="px-4 py-3 text-left font-semibold">Horario</th>
                  <th className="px-4 py-3 text-left font-semibold">Fecha inicio</th>
                  <th className="px-4 py-3 text-left font-semibold">Fecha fin</th>
                  <th className="px-4 py-3 text-left font-semibold">Horario entrada</th>
                  <th className="px-4 py-3 text-left font-semibold">Horario salida</th>
                  <th className="px-4 py-3 text-center font-semibold">Editar</th>
                  <th className="px-4 py-3 text-center font-semibold">Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={12} className="border-t border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                      Cargando horarios por personal...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="border-t border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                      No hay horarios registrados.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.sucursalNombre}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.areaNombre}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.personalDoc}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.personalNombre}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.turnoNombre}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.horario}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.fecha_inicio}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.fecha_fin || "-"}</td>
                      <td className="border-t border-slate-200 px-4 py-3 font-medium text-blue-700">{item.horaEntrada}</td>
                      <td className="border-t border-slate-200 px-4 py-3 font-medium text-blue-700">{item.horaSalida}</td>
                      <td className="border-t border-slate-200 px-4 py-3 text-center">
                        <button onClick={() => onEdit(item)} className="inline-flex rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-600 transition hover:bg-amber-100" aria-label="Editar horario">
                          <Pencil size={16} />
                        </button>
                      </td>
                      <td className="border-t border-slate-200 px-4 py-3 text-center">
                        <button onClick={() => onDelete(item)} className="inline-flex rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100" aria-label="Eliminar horario">
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

