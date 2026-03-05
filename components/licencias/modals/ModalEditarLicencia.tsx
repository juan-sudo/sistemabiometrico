"use client"

import { useState } from "react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Pencil  } from "lucide-react"

export function ModalEditarLicencia({ licencia }: { licencia: any }) {
  const [form, setForm] = useState({
    servicio: "Agua",
    nroLicencia: licencia.numero,
    codigoSIAT: "",
    propietario: "",
    nroExpediente: "",
    fechaExp: "",
    nroRecibo: "",
    nroProvedio: "",
    ubicacion: licencia.ubicacion,
    nroLote: "",
    nroLuz: "",
    referencia: "",
    tipo: "",
    tuberia: "",
    categoria: "",
    extSuministro: "",
    pruebaInsp: "SI",
    roturaVereda: "NO",
    fechaLicencia: licencia.fecha,
    observaciones: "",
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleGuardar = () => {
    console.log("Guardar licencia:", form)
  }

  // Clase base para todos los inputs, selects y textarea
  const inputClass =
    "border border-gray-300 rounded px-2 py-2 text-sm w-full focus:ring-1 focus:ring-blue-400 focus:border-blue-500"

  return (
    <Dialog>
     <DialogTrigger asChild>
      <Button size="sm" className="gap-2 px-2 sm:px-3">
        <Pencil className="h-4 w-4" />
        <span className="hidden sm:inline">Editar licencia</span>
      </Button>
    </DialogTrigger>


      <DialogContent className="w-full max-w-5xl p-5 bg-white rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-700 text-lg font-semibold">
            <Pencil  className="h-5 w-5 text-blue-600" />
            Registro de Nueva Licencia
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4 text-sm">
          {/* Sección General */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-gray-700">Licencia de:</label>
              <input type="text" name="servicio" value={form.servicio} readOnly className={inputClass + " bg-teal-700 text-white"} />
            </div>
            <div>
              <label className="block font-semibold text-gray-700">N° Licencia:</label>
              <input type="text" name="nroLicencia" value={form.nroLicencia} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block font-semibold text-gray-700">N° Expediente:</label>
              <input type="text" name="nroExpediente" value={form.nroExpediente} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block font-semibold text-gray-700">Fecha Exp.:</label>
              <input type="date" name="fechaExp" value={form.fechaExp} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {/* Botón arriba de la tabla */}
          <div className="flex justify-start">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
              onClick={() => console.log("Agregar Dirección")}
            >
              Agregar Dirección
            </button>
          </div>

          {/* Grid Tabla + Inputs */}
          <div className="grid grid-cols-[8fr_2fr] gap-4">
            {/* Tabla */}
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-teal-700 text-white">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Nombre Vía</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Manzana</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Cuadra</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Zona</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Habilitación</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Arancel</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Cod Vía</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-600">Av. Principal</td>
                    <td className="px-4 py-2 text-sm text-gray-600">001</td>
                    <td className="px-4 py-2 text-sm text-gray-600">A</td>
                    <td className="px-4 py-2 text-sm text-gray-600">Norte</td>
                    <td className="px-4 py-2 text-sm text-gray-600">Sí</td>
                    <td className="px-4 py-2 text-sm text-gray-600">S/ 100</td>
                    <td className="px-4 py-2 text-sm text-gray-600">V001</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-gray-700">N° Lote:</label>
                <input type="text" name="nroLote" className={inputClass} />
              </div>
              <div>
                <label className="block font-semibold text-gray-700">N° Luz:</label>
                <input type="text" name="nroLuz" className={inputClass} />
              </div>
              <div>
                <label className="block font-semibold text-gray-700">N° Ubicación:</label>
                <input type="text" name="ubicacion" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Detalle Licencia */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-gray-700">Tipo:</label>
              <select name="tipo" value={form.tipo} onChange={handleChange} className={inputClass}>
                <option value="">Seleccione</option>
                <option value="PERMANENTE">PERMANENTE</option>
                <option value="TEMPORAL">TEMPORAL</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-700">Tubería (m):</label>
              <select name="tuberia" value={form.tuberia} onChange={handleChange} className={inputClass}>
                <option value="">Seleccione</option>
                <option value="10">10</option>
                <option value="20">20</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-700">Categoría:</label>
              <select name="categoria" value={form.categoria} onChange={handleChange} className={inputClass}>
                <option value="">Seleccione</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-700">Ext. Suministro:</label>
              <select name="extSuministro" value={form.extSuministro} onChange={handleChange} className={inputClass}>
                <option value="">Seleccione</option>
                <option value="SI">SI</option>
                <option value="NO">NO</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div>
              <label className="block font-semibold text-gray-700">Prueba Insp.:</label>
              <select name="pruebaInsp" value={form.pruebaInsp} onChange={handleChange} className={inputClass}>
                <option value="SI">SI</option>
                <option value="NO">NO</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-700">Rotura Vereda:</label>
              <select name="roturaVereda" value={form.roturaVereda} onChange={handleChange} className={inputClass}>
                <option value="SI">SI</option>
                <option value="NO">NO</option>
              </select>
            </div>
             <div>
              <label className="block font-semibold text-gray-700">Fecha Licencia:</label>
              <input type="date" name="fechaLicencia" value={form.fechaLicencia} onChange={handleChange} className={inputClass} />
            </div>
          </div>

        

          {/* Observaciones */}
          <div>
            <label className="block font-semibold text-gray-700">Observaciones:</label>
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              className={inputClass}
              rows={3}
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" size="sm">
            Cancelar
          </Button>
          <Button size="sm" onClick={handleGuardar}>
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


