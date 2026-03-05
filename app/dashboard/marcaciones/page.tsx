"use client"

import { FormEvent, useState } from "react"
import { Download, PlusCircle, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Marcacion = {
  id: number
  empresa: string
  sucursal: string
  area: string
  codigoEmpleado: string
  numeroDocumento: string
  codigoEquipo: string
  nombres: string
  situacion: "Activo" | "Inactivo"
}

const initialMarcaciones: Marcacion[] = [
  {
    id: 1,
    empresa: "Municipalidad Provincial Lucanas - Puquio",
    sucursal: "MPLP",
    area: "Alcaldia",
    codigoEmpleado: "2",
    numeroDocumento: "2",
    codigoEquipo: "2",
    nombres: "",
    situacion: "Activo",
  },
  {
    id: 2,
    empresa: "Municipalidad Provincial Lucanas - Puquio",
    sucursal: "MPLP",
    area: "Alcaldia",
    codigoEmpleado: "70145786",
    numeroDocumento: "70145786",
    codigoEquipo: "70145786",
    nombres: "ALARCON LAZARTE, SUSAN MILAGRITOS",
    situacion: "Activo",
  },
]

const createDefaultForm = () => ({
  empresa: "Municipalidad Provincial Lucanas - Puquio",
  sucursal: "MPLP",
  area: "Alcaldia",
  tipoDocumento: "Todos",
  tipoTrabajador: "Todos",
  categoria: "Todos",
  tipoSindicato: "Todos",
  filtrarPor: "",
  situacion: "Activo" as Marcacion["situacion"],
  codigoEmpleado: "",
  numeroDocumento: "",
  codigoEquipo: "",
  nombres: "",
})

export default function Page() {
  const [open, setOpen] = useState(false)
  const [detailMarcacion, setDetailMarcacion] = useState<Marcacion | null>(null)
  const [marcaciones, setMarcaciones] = useState<Marcacion[]>(initialMarcaciones)
  const [form, setForm] = useState(createDefaultForm)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.codigoEmpleado.trim() || !form.numeroDocumento.trim()) return

    const nuevo: Marcacion = {
      id: Date.now(),
      empresa: form.empresa,
      sucursal: form.sucursal,
      area: form.area,
      codigoEmpleado: form.codigoEmpleado.trim(),
      numeroDocumento: form.numeroDocumento.trim(),
      codigoEquipo: form.codigoEquipo.trim(),
      nombres: form.nombres.trim(),
      situacion: form.situacion,
    }

    setMarcaciones((prev) => [nuevo, ...prev])
    setForm(createDefaultForm())
    setOpen(false)
  }

  return (
    <section className="min-h-[calc(100vh-7rem)] bg-[radial-gradient(circle_at_top_right,#dcfce7_0%,#f8fafc_45%,#eef2ff_100%)] p-3 md:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <header className="rounded-2xl border border-white/50 bg-white/80 p-5 shadow-lg backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-800 md:text-3xl">Marcaciones</h1>
              <p className="text-sm text-slate-500">Administra y organiza las marcaciones del personal.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50">
                <Download size={16} />
                Importacion
              </button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-emerald-700">
                    <PlusCircle size={16} />
                    Nuevo
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Registrar marcacion</DialogTitle>
                  </DialogHeader>

                  <form className="space-y-4" onSubmit={onSubmit}>
                    <div className="grid gap-3 md:grid-cols-3">
                      <FilterSelect
                        label="Empresa"
                        value={form.empresa}
                        onChange={(v) => setForm((prev) => ({ ...prev, empresa: v }))}
                        options={["Municipalidad Provincial Lucanas - Puquio"]}
                      />
                      <FilterSelect
                        label="Sucursal"
                        value={form.sucursal}
                        onChange={(v) => setForm((prev) => ({ ...prev, sucursal: v }))}
                        options={["MPLP"]}
                      />
                      <FilterSelect
                        label="Area"
                        value={form.area}
                        onChange={(v) => setForm((prev) => ({ ...prev, area: v }))}
                        options={["Alcaldia", "Secretaria General", "Recursos Humanos"]}
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-4">
                      <FilterSelect
                        label="Tipo Documento"
                        value={form.tipoDocumento}
                        onChange={(v) => setForm((prev) => ({ ...prev, tipoDocumento: v }))}
                        options={["Todos", "DNI", "CE"]}
                      />
                      <FilterSelect
                        label="Tipo Trabajador"
                        value={form.tipoTrabajador}
                        onChange={(v) => setForm((prev) => ({ ...prev, tipoTrabajador: v }))}
                        options={["Todos", "Empleado", "Obrero"]}
                      />
                      <FilterSelect
                        label="Categoria"
                        value={form.categoria}
                        onChange={(v) => setForm((prev) => ({ ...prev, categoria: v }))}
                        options={["Todos", "Planilla", "Honorarios"]}
                      />
                      <FilterSelect
                        label="Tipo Sindicato"
                        value={form.tipoSindicato}
                        onChange={(v) => setForm((prev) => ({ ...prev, tipoSindicato: v }))}
                        options={["Todos", "Ninguno"]}
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Filtrar por</label>
                        <Input
                          value={form.filtrarPor}
                          onChange={(e) => setForm((prev) => ({ ...prev, filtrarPor: e.target.value }))}
                          placeholder="Buscar por nombres completos, numero de documento o codigo"
                        />
                      </div>
                      <FilterSelect
                        label="Situacion"
                        value={form.situacion}
                        onChange={(v) => setForm((prev) => ({ ...prev, situacion: v as Marcacion["situacion"] }))}
                        options={["Activo", "Inactivo"]}
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Codigo de Empleado</label>
                        <Input
                          value={form.codigoEmpleado}
                          onChange={(e) => setForm((prev) => ({ ...prev, codigoEmpleado: e.target.value }))}
                          placeholder="70145786"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Numero de Documento</label>
                        <Input
                          value={form.numeroDocumento}
                          onChange={(e) => setForm((prev) => ({ ...prev, numeroDocumento: e.target.value }))}
                          placeholder="70145786"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Codigo de Equipo</label>
                        <Input
                          value={form.codigoEquipo}
                          onChange={(e) => setForm((prev) => ({ ...prev, codigoEquipo: e.target.value }))}
                          placeholder="70145786"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Nombres Completos</label>
                        <Input
                          value={form.nombres}
                          onChange={(e) => setForm((prev) => ({ ...prev, nombres: e.target.value }))}
                          placeholder="APELLIDOS, NOMBRES"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Guardar</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <button className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-red-700">
                <Trash2 size={16} />
                Eliminar Masivo
              </button>
            </div>
          </div>
        </header>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full min-w-[1300px]">
              <thead className="sticky top-0 z-10 bg-teal-700 text-white">
                <tr className="text-sm">
                  <th className="w-10 px-3 py-3 text-center font-semibold">#</th>
                  <th className="w-52 px-3 py-3 text-left font-semibold">Empresa</th>
                  <th className="w-24 px-3 py-3 text-left font-semibold">Sucursal</th>
                  <th className="w-24 px-3 py-3 text-left font-semibold">Area</th>
                  <th className="w-36 px-3 py-3 text-left font-semibold">Codigo de Empleado</th>
                  <th className="w-36 px-3 py-3 text-left font-semibold">Numero de Documento</th>
                  <th className="w-28 px-3 py-3 text-left font-semibold">Codigo de Equipo</th>
                  <th className="px-3 py-3 text-left font-semibold">Nombres Completos</th>
                  <th className="w-24 px-3 py-3 text-center font-semibold">Consultar</th>
                  <th className="w-24 px-3 py-3 text-center font-semibold">Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {marcaciones.map((row, index) => (
                  <tr key={row.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">
                      <input type="checkbox" />
                    </td>
                    <td className="border-t border-slate-200 px-3 py-3 text-slate-700">{row.empresa}</td>
                    <td className="border-t border-slate-200 px-3 py-3 text-slate-700">{row.sucursal}</td>
                    <td className="border-t border-slate-200 px-3 py-3 text-slate-700">{row.area}</td>
                    <td className="border-t border-slate-200 px-3 py-3 text-slate-700">{row.codigoEmpleado}</td>
                    <td className="border-t border-slate-200 px-3 py-3 text-slate-700">{row.numeroDocumento}</td>
                    <td className="border-t border-slate-200 px-3 py-3 text-slate-700">{row.codigoEquipo}</td>
                    <td className="border-t border-slate-200 px-3 py-3 text-slate-700">{row.nombres}</td>
                    <td className="border-t border-slate-200 px-3 py-3 text-center">
                      <button
                        onClick={() => setDetailMarcacion(row)}
                        className="inline-flex rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                        aria-label="Consultar marcacion"
                      >
                        <Search size={16} />
                      </button>
                    </td>
                    <td className="border-t border-slate-200 px-3 py-3 text-center">
                      <button className="inline-flex rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Dialog open={!!detailMarcacion} onOpenChange={(next) => !next && setDetailMarcacion(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalle de marcacion</DialogTitle>
            </DialogHeader>
            {detailMarcacion && (
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <DetailItem label="Empresa" value={detailMarcacion.empresa} />
                <DetailItem label="Sucursal" value={detailMarcacion.sucursal} />
                <DetailItem label="Area" value={detailMarcacion.area} />
                <DetailItem label="Codigo de Empleado" value={detailMarcacion.codigoEmpleado} />
                <DetailItem label="Numero de Documento" value={detailMarcacion.numeroDocumento} />
                <DetailItem label="Codigo de Equipo" value={detailMarcacion.codigoEquipo} />
                <DetailItem label="Situacion" value={detailMarcacion.situacion} />
                <DetailItem label="Nombres Completos" value={detailMarcacion.nombres || "-"} />
              </div>
            )}
            <DialogFooter>
              <Button type="button" onClick={() => setDetailMarcacion(null)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <p className="px-1 text-sm font-semibold text-slate-600">Registros: {marcaciones.length}</p>
      </div>
    </section>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <select
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-700">{value || "-"}</p>
    </div>
  )
}


