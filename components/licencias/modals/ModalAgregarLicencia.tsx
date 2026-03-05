"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Plus, X } from "lucide-react"

export function ModalAgregarLicencia() {
  const [form, setForm] = useState({
    servicio: "Agua",
    nroLicencia: "",
    nroExpediente: "",
    fechaExp: "",
    nroLote: "",
    nroLuz: "",
    ubicacion: "",
    tipo: "",
    tuberia: "",
    categoria: "",
    extSuministro: "",
    pruebaInsp: "SI",
    roturaVereda: "NO",
    fechaLicencia: "",
    observaciones: "",
  })

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleGuardar = () => {
    console.log("Guardar licencia:", form)
  }

  const inputClass =
    "w-full rounded border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-400"

  return (
    <Dialog>
      {/* BOTÓN ABRIR */}
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Agregar licencia</span>
        </Button>
      </DialogTrigger>

      {/* MODAL */}
      <DialogContent
        className="
          w-full h-[100dvh] sm:h-auto
          max-w-full sm:max-w-6xl
          rounded-none sm:rounded-lg
          overflow-y-auto
          p-4 sm:p-6
          [&>button]:hidden
        "
      >
        {/* HEADER */}
        <DialogHeader className="relative pb-2">
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <Plus className="h-5 w-5" />
            Registro de Nueva Licencia
          </DialogTitle>

          {/* X PERSONALIZADA */}
          <DialogClose className="absolute right-2 top-2">
            <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
          </DialogClose>
        </DialogHeader>

        {/* CONTENIDO */}
        <div className="space-y-4 text-sm">
          {/* DATOS GENERALES */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="font-semibold">Licencia de:</label>
              <input
                readOnly
                value={form.servicio}
                className={`${inputClass} bg-teal-700 text-white`}
              />
            </div>

            <div>
              <label className="font-semibold">N° Licencia:</label>
              <input
                name="nroLicencia"
                value={form.nroLicencia}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="font-semibold">N° Expediente:</label>
              <input
                name="nroExpediente"
                value={form.nroExpediente}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="font-semibold">Fecha Exp.:</label>
              <input
                type="date"
                name="fechaExp"
                value={form.fechaExp}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          {/* BOTÓN AGREGAR DIRECCIÓN */}
          <Button
            size="sm"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            onClick={() => console.log("Agregar Dirección")}
          >
            Agregar Dirección
          </Button>

          {/* TABLA + INPUTS */}
          <div className="grid grid-cols-1 sm:grid-cols-[7fr_3fr] gap-4">
            {/* TABLA */}
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-[700px] w-full divide-y">
                <thead className="bg-teal-700 text-white">
                  <tr>
                    {["Vía", "Mz", "Cuadra", "Zona", "Hab.", "Arancel", "Cod"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left text-xs font-semibold"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="px-3 py-2">Av. Principal</td>
                    <td className="px-3 py-2">001</td>
                    <td className="px-3 py-2">A</td>
                    <td className="px-3 py-2">Norte</td>
                    <td className="px-3 py-2">Sí</td>
                    <td className="px-3 py-2">S/100</td>
                    <td className="px-3 py-2">V001</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* INPUTS */}
            <div className="space-y-3">
              <div>
                <label className="font-semibold">N° Lote:</label>
                <input
                  name="nroLote"
                  value={form.nroLote}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="font-semibold">N° Luz:</label>
                <input
                  name="nroLuz"
                  value={form.nroLuz}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="font-semibold">Ubicación:</label>
                <input
                  name="ubicacion"
                  value={form.ubicacion}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* DETALLE */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { label: "Tipo", name: "tipo" },
              { label: "Tubería", name: "tuberia" },
              { label: "Categoría", name: "categoria" },
              { label: "Ext. Suministro", name: "extSuministro" },
            ].map((f) => (
              <div key={f.name}>
                <label className="font-semibold">{f.label}:</label>
                <select
                  name={f.name}
                  value={(form as any)[f.name]}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Seleccione</option>
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                </select>
              </div>
            ))}
          </div>

          {/* OBSERVACIONES */}
          <div>
            <label className="font-semibold">Observaciones:</label>
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              rows={3}
              className={inputClass}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 pt-4">
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Cancelar
            </Button>
          </DialogClose>

          <Button size="sm" onClick={handleGuardar}>
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


