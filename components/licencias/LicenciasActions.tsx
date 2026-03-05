"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { ModalEditarLicencia } from "./modals/ModalEditarLicencia"
import { ModalTransferirLicencia } from "./modals/ModalTransferirLicencia"
import { ModalDeuda } from "./modals/ModalDeuda"
import { ModalPagado } from "./modals/ModalPagado"
import { ModalCalcular } from "./modals/ModalCalcular"  

interface Licencia {
  numero: string
  ubicacion: string
  licencia: string
  fecha: string
  estado: string // "agua", "transferida", "eliminado"
}

interface Props {
  selectedLicencias: string[]
  allLicencias: Licencia[]
}

export function LicenciasActions({ selectedLicencias, allLicencias }: Props) {
  // Filtrar las licencias seleccionadas completas
  const licenciasSeleccionadas = allLicencias.filter(lic => selectedLicencias.includes(lic.numero))

  const count = licenciasSeleccionadas.length

  // Verificar que todas las licencias seleccionadas sean de estado "agua"
  const todasSonAgua = licenciasSeleccionadas.every(lic => lic.estado === 'agua')

  if (count === 0 || !todasSonAgua) return null

  return (
    <div className="mt-4 flex flex-wrap gap-3 justify-center sm:justify-end">
      {/* SOLO cuando hay 1 seleccionada */}
      {count === 1 && (
        <>
          <ModalDeuda />
          <ModalPagado />
          <ModalCalcular />
          <ModalEditarLicencia licencia={licenciasSeleccionadas[0]} />

        

           <Button
          variant="outline"
          size="sm"
          className="gap-1 border-red-600 text-red-700"
        >
           <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Eliminar</span>
          
        </Button>

        </>
      )}

      {/* SIEMPRE cuando hay al menos 1 */}
      <ModalTransferirLicencia licencias={licenciasSeleccionadas} />
    </div>
  )
}