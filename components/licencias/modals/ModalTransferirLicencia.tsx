"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowRightLeft ,Trash2 } from "lucide-react"

interface Usuario {
  codigo: string
  documento: string
  nombres: string
}

interface Props {
  licencias: any[]
}

export function ModalTransferirLicencia({
  licencias,
}: Props) {
  const [observacion, setObservacion] = useState("")
  const [nuevoTitularSeleccionado, setNuevoTitularSeleccionado] = useState<string>("")

  const handleConfirmar = () => {
    console.log("Transferir a:", nuevoTitularSeleccionado)
    console.log("Observación:", observacion)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>


  <Button
          variant="outline"
          size="sm"
          className="gap-1 border-blue-600 text-blue-700"
        >
           <ArrowRightLeft className="h-4 w-4" />
    <span className="hidden sm:inline">Transferir licencia</span>
          
        </Button>
</DialogTrigger>


      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-blue-700">
            <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            Transferir Licencia
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">

          {/* Datos de las licencias */}
          <div>
            <label className="font-semibold block mb-1">Licencia seleccionada:</label>
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-teal-700 text-white">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Número</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Ubicación</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Licencia</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {licencias.map((lic) => (
                    <tr key={lic.numero} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-600">{lic.numero}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{lic.ubicacion}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{lic.licencia}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{lic.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <Button>Nuevo usuario</Button>
          </div>

          {/* Nuevo titular */}
          <div>
            <label className="font-semibold block mb-1">Transferir a usuario:</label>
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-teal-700 text-white">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Código</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Documento</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Nombres</th>
                    <th className="px-4 py-2 text-sm font-medium text-gray-700 text-center">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Placeholder users - in real app, fetch from API */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-600">A002</td>
                    <td className="px-4 py-2 text-sm text-gray-600">87654321</td>
                    <td className="px-4 py-2 text-sm text-gray-600">María García</td>
                    <td className="px-4 py-2 text-sm text-gray-600 text-center">
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => console.log("Eliminar fila")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                 
                </tbody>
              </table>
            </div>
          </div>

          {/* Observación */}
          <div>
            <label className="font-semibold block mb-1">Observación:</label>
            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-500"
              rows={3}
            />
          </div>

        </div>

        {/* Botones */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline">Cancelar</Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleConfirmar}>
            Confirmar transferencia
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


