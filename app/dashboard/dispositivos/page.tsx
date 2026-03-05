"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Cable, PlusCircle, Radio, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { apiEndpoints, authRequest } from "@/lib/api-client"
import useUserStore from "@/stores/useUserStore"
import { toast } from "sonner"

type Dispositivo = {
  id: number
  nombre: string
  direccion_tipo: "IP" | "DOMINIO"
  direccion: string
  comunicacion: string
  puerto: number
  uso: "ASISTENCIA" | "ACCESO"
  activo: boolean
}

type FormDispositivo = {
  nombre: string
  direccionTipo: "ip" | "dominio"
  direccion: string
  comunicacion: string
  puerto: string
  uso: "" | "ASISTENCIA" | "ACCESO"
}

const formInicial: FormDispositivo = {
  nombre: "",
  direccionTipo: "ip",
  direccion: "",
  comunicacion: "TCP/IP",
  puerto: "4370",
  uso: "",
}

const asArray = (x: unknown) =>
  Array.isArray(x) ? x : x && typeof x === "object" && Array.isArray((x as { results?: unknown[] }).results) ? (x as { results: unknown[] }).results : []

export default function Page() {
  const token = useUserStore((s) => s.accessToken)
  const [busqueda, setBusqueda] = useState("")
  const [listaDispositivos, setListaDispositivos] = useState<Dispositivo[]>([])
  const [loading, setLoading] = useState(true)
  const [openNuevo, setOpenNuevo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testingId, setTestingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormDispositivo>(formInicial)

  const loadDevices = async () => {
    if (!token) return
    const data = await authRequest(apiEndpoints.dispositivos, { token })
    setListaDispositivos(asArray(data) as Dispositivo[])
  }

  useEffect(() => {
    const run = async () => {
      if (!token) return setLoading(false)
      try {
        setLoading(true)
        await loadDevices()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo cargar dispositivos")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [token])

  const dispositivos = useMemo(() => {
    const term = busqueda.trim().toLowerCase()
    if (!term) return listaDispositivos
    return listaDispositivos.filter((item) =>
      `${item.nombre} ${item.comunicacion} ${item.direccion} ${item.uso}`
        .toLowerCase()
        .includes(term)
    )
  }, [busqueda, listaDispositivos])

  const probarConexion = async (payload: { dispositivo_id?: number; nombre?: string; direccion?: string; puerto?: string | number }) => {
    if (!token) return false
    try {
      const data = await authRequest(`${apiEndpoints.dispositivos}probar-conexion/`, {
        method: "POST",
        body: {
          ...payload,
          clave_comunicacion: 0,
        },
        token,
      })
      const ok = Boolean((data as { ok?: boolean }).ok)
      const detalle = (data as { detalle?: string }).detalle || (ok ? "Conexion correcta." : "No se pudo conectar.")
      if (ok) {
        toast.success(detalle)
      } else {
        toast.error(detalle)
      }
      return ok
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo probar la conexion")
      return false
    }
  }

  const handleGuardar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!token) return
    if (!form.nombre.trim() || !form.direccion.trim() || !form.uso) return
    try {
      setSaving(true)
      await authRequest(apiEndpoints.dispositivos, {
        method: "POST",
        body: {
          nombre: form.nombre.trim(),
          direccion_tipo: form.direccionTipo === "ip" ? "IP" : "DOMINIO",
          direccion: form.direccion.trim(),
          comunicacion: form.comunicacion.trim() || "TCP/IP",
          puerto: Number(form.puerto || "4370"),
          uso: form.uso,
          activo: true,
        },
        token,
      })
      await loadDevices()
      setOpenNuevo(false)
      setForm(formInicial)
      toast.success("Dispositivo guardado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar dispositivo")
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = async (id: number) => {
    if (!token) return
    try {
      await authRequest(`${apiEndpoints.dispositivos}${id}/`, {
        method: "DELETE",
        token,
      })
      setListaDispositivos((prev) => prev.filter((item) => item.id !== id))
      toast.success("Dispositivo eliminado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar dispositivo")
    }
  }

  const handleProbarTodos = async () => {
    if (!token || dispositivos.length === 0) return
    setTesting(true)
    let okCount = 0
    for (const item of dispositivos) {
      const ok = await probarConexion({ dispositivo_id: item.id })
      if (ok) okCount += 1
    }
    setTesting(false)
    toast.success(`Pruebas finalizadas. Conectados: ${okCount}/${dispositivos.length}`)
  }

  if (!token) return <section className="p-6 text-sm text-slate-600">Inicia sesion para continuar.</section>

  return (
    <section className="min-h-[calc(100vh-7rem)] bg-[radial-gradient(circle_at_top_right,#dcfce7_0%,#f8fafc_45%,#eef2ff_100%)] p-3 md:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <header className="rounded-2xl border border-white/50 bg-white/80 p-5 shadow-lg backdrop-blur md:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
              <Cable size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-800 md:text-3xl">
                Lista de Dispositivos
              </h1>
              <p className="text-sm text-slate-500">
                Administra los equipos de marcacion y prueba su conectividad.
              </p>
            </div>
          </div>
        </header>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ingrese nombre de dispositivo"
              className="md:max-w-md"
            />

            <div className="flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50">
                <Radio size={16} />
                Reporte
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleProbarTodos}
                disabled={testing || dispositivos.length === 0}
              >
                <Radio size={16} />
                {testing ? "Probando..." : "Probar Conexion"}
              </button>

              <Dialog
                open={openNuevo}
                onOpenChange={(nextOpen) => {
                  setOpenNuevo(nextOpen)
                  if (!nextOpen) setForm(formInicial)
                }}
              >
                <DialogTrigger asChild>
                  <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-emerald-700">
                    <PlusCircle size={16} />
                    Nuevo
                  </button>
                </DialogTrigger>

                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Nuevo Dispositivo</DialogTitle>
                  </DialogHeader>

                  <form className="space-y-4" onSubmit={handleGuardar}>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">Nombre de Dispositivo:</label>
                      <Input
                        value={form.nombre}
                        onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm text-slate-700">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            name="direccionTipo"
                            checked={form.direccionTipo === "ip"}
                            onChange={() => setForm((prev) => ({ ...prev, direccionTipo: "ip" }))}
                          />
                          Direccion IP
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            name="direccionTipo"
                            checked={form.direccionTipo === "dominio"}
                            onChange={() => setForm((prev) => ({ ...prev, direccionTipo: "dominio" }))}
                          />
                          Dominio
                        </label>
                      </div>
                      <Input
                        value={form.direccion}
                        onChange={(e) => setForm((prev) => ({ ...prev, direccion: e.target.value }))}
                        placeholder={form.direccionTipo === "ip" ? "172.16.0.202" : "equipo.midominio.pe"}
                        required
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700">Comunicacion:</label>
                        <Input
                          value={form.comunicacion}
                          onChange={(e) => setForm((prev) => ({ ...prev, comunicacion: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700">Puerto:</label>
                        <Input
                          value={form.puerto}
                          onChange={(e) => setForm((prev) => ({ ...prev, puerto: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700">Uso de Dispositivo:</label>
                        <select
                          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                          value={form.uso}
                          onChange={(e) => setForm((prev) => ({ ...prev, uso: e.target.value as FormDispositivo["uso"] }))}
                          required
                        >
                          <option value="">Seleccionar</option>
                          <option value="ASISTENCIA">Control de Asistencia</option>
                          <option value="ACCESO">Control de Acceso</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">Conectividad:</label>
                      <Button
                        type="button"
                        className="bg-lime-600 hover:bg-lime-700"
                        onClick={() =>
                          probarConexion({
                            nombre: form.nombre.trim(),
                            direccion: form.direccion.trim(),
                            puerto: form.puerto.trim() || "4370",
                          })
                        }
                        disabled={!form.direccion.trim() || testing}
                      >
                        Comprobar
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button
                        type="submit"
                        className="bg-lime-600 hover:bg-lime-700"
                        disabled={saving}
                      >
                        {saving ? "Guardando..." : "Guardar"}
                      </Button>
                      <Button
                        type="button"
                        className="bg-slate-500 text-white hover:bg-slate-600"
                        onClick={() => {
                          setOpenNuevo(false)
                          setForm(formInicial)
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full min-w-[1080px]">
              <thead className="sticky top-0 z-10 bg-teal-700 text-white">
                <tr className="text-sm">
                  <th className="px-4 py-3 text-left font-semibold">Dispositivo</th>
                  <th className="w-40 px-4 py-3 text-left font-semibold">Comunicacion</th>
                  <th className="w-52 px-4 py-3 text-left font-semibold">Nro IP | Dominio</th>
                  <th className="w-24 px-4 py-3 text-left font-semibold">Puerto</th>
                  <th className="w-56 px-4 py-3 text-left font-semibold">Uso de Dispositivo</th>
                  <th className="w-24 px-4 py-3 text-center font-semibold">Probar</th>
                  <th className="w-24 px-4 py-3 text-center font-semibold">Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="border-t border-slate-200 px-4 py-4 text-center text-sm text-slate-500">
                      Cargando dispositivos...
                    </td>
                  </tr>
                ) : dispositivos.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.nombre}</td>
                    <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.comunicacion}</td>
                    <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.direccion}</td>
                    <td className="border-t border-slate-200 px-4 py-3 text-slate-700">{item.puerto}</td>
                    <td className="border-t border-slate-200 px-4 py-3 text-slate-700">
                      {item.uso === "ASISTENCIA" ? "Control de Asistencia" : "Control de Acceso"}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-3 text-center">
                      <button
                        className="inline-flex rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Probar conexion"
                        onClick={async () => {
                          setTestingId(item.id)
                          await probarConexion({ dispositivo_id: item.id })
                          setTestingId(null)
                        }}
                        disabled={testingId === item.id}
                      >
                        <Radio size={16} className={testingId === item.id ? "animate-pulse" : ""} />
                      </button>
                    </td>
                    <td className="border-t border-slate-200 px-4 py-3 text-center">
                      <button
                        className="inline-flex rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100"
                        aria-label="Eliminar dispositivo"
                        onClick={() => handleEliminar(item.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && dispositivos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border-t border-slate-200 px-4 py-4 text-center text-sm text-slate-500">
                      No se encontraron dispositivos.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <p className="px-1 text-sm font-semibold text-slate-600">Registros: {dispositivos.length}</p>
      </div>
    </section>
  )
}

