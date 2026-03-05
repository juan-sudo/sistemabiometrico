"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BadgeCheck } from "lucide-react"

import { LicenciasTable } from "./LicenciasTable"
import { LicenciasActions } from "./LicenciasActions"
import { ModalAgregarLicencia } from "./modals/ModalAgregarLicencia"
import LicenciaStatus from "./licenciaStatus"

/* =========================
   TIPOS
========================= */
export type EstadoLicencia = "agua" | "transferida" | "eliminado"

export interface Licencia {
  numero: string
  ubicacion: string
  licencia: string
  fecha: string
  estado: EstadoLicencia
}

interface Props {
  licencias: Licencia[]
}

/* =========================
   COMPONENTE
========================= */
export function LicenciasCard({ licencias }: Props) {
  const [selectedLicencias, setSelectedLicencias] = useState<string[]>([])
  const [filtro, setFiltro] = useState<EstadoLicencia | "todos">("agua")

  /* =========================
     CONTADORES
  ========================= */
  const counts = {
    agua: licencias.filter((l) => l.estado === "agua").length,
    transferida: licencias.filter((l) => l.estado === "transferida").length,
    eliminado: licencias.filter((l) => l.estado === "eliminado").length,
  }

  /* =========================
     FILTRO
  ========================= */
  const licenciasFiltradas =
    filtro === "todos"
      ? licencias
      : licencias.filter((l) => l.estado === filtro)

  /* =========================
     ESTILOS BADGE FILTRO
  ========================= */
 const getBadgeClasses = (estado: EstadoLicencia | "todos") => {
  const base =
    "cursor-pointer px-3 py-1 rounded-t-md transition-colors duration-150"

  const active =
    "border-b-2 border-blue-600 font-semibold"

  switch (estado) {
    case "agua":
      return filtro === "agua"
        ? `${base} bg-blue-200 text-blue-900 ${active}`
        : `${base} bg-blue-100 text-blue-800 hover:bg-blue-200`

    case "transferida":
      return filtro === "transferida"
        ? `${base} bg-green-200 text-green-900 ${active}`
        : `${base} bg-green-100 text-green-800 hover:bg-green-200`

    case "eliminado":
      return filtro === "eliminado"
        ? `${base} bg-red-200 text-red-900 ${active}`
        : `${base} bg-red-100 text-red-800 hover:bg-red-200`

    case "todos":
      return filtro === "todos"
        ? `${base} bg-gray-200 text-gray-900 ${active}`
        : `${base} bg-teal-700 text-white text-gray-800 hover:bg-gray-200`
  }
}


  /* =========================
     RENDER
  ========================= */
  return (
    <Card className="w-full">
     <CardHeader className="flex flex-row items-center justify-between gap-3">
  <CardTitle className="flex items-center gap-3">
    <BadgeCheck className="h-5 w-5 text-blue-600" />
    Licencias

    {/* 🔹 INDICADOR DE ESTADO ACTIVO */}
    {filtro !== "todos" && <LicenciaStatus status={filtro} />}
  </CardTitle>

  <div className="flex gap-2">
    <ModalAgregarLicencia />
  </div>
</CardHeader>


      <CardContent className="space-y-4">
        {/* 🔹 FILTROS */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 justify-center sm:justify-start">
         <Badge
          className={getBadgeClasses("agua")}
          onClick={() => setFiltro("agua")}
        >
          {/* Mobile */}
          <span className="sm:hidden">A</span>

          {/* Desktop */}
          <span className="hidden sm:inline">
            Licencia de agua: {counts.agua}
          </span>
        </Badge>


          <Badge
          className={getBadgeClasses("transferida")}
          onClick={() => setFiltro("transferida")}
        >
          {/* Mobile */}
          <span className="sm:hidden">T</span>

          {/* Desktop */}
          <span className="hidden sm:inline">
            Licencia transferida: {counts.transferida}
          </span>
        </Badge>


         <Badge
          className={getBadgeClasses("eliminado")}
          onClick={() => setFiltro("eliminado")}
        >
          {/* Mobile */}
          <span className="sm:hidden">E</span>

          {/* Desktop */}
          <span className="hidden sm:inline">
            Licencia eliminada: {counts.eliminado}
          </span>
        </Badge>


          <Badge
            className={getBadgeClasses("todos")}
            onClick={() => setFiltro("todos")}
          >
            Todas: {licencias.length}
          </Badge>
        </div>

        {/* 🔹 TABLA */}
        <LicenciasTable
          licencias={licenciasFiltradas}
          selectedLicencias={selectedLicencias}
          setSelectedLicencias={setSelectedLicencias}
        />

        {/* 🔹 ACCIONES */}
        <LicenciasActions
          selectedLicencias={selectedLicencias}
          allLicencias={licenciasFiltradas}
        />
      </CardContent>
    </Card>
  )
}


