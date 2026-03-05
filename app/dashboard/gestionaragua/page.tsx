"use client"

import { BackButton } from "@/components/ui/BackButton"
import { UsuarioContainer } from "@/components/licencias/UsuarioContainer"
import { LicenciasCard, Licencia } from "@/components/licencias/LicenciasCard"
import Link from "next/link"

export default function Page() {
  const usuarios = [
    { codigo: "A001", dni: "12345678", nombres: "Juan Pérez" },
  ]

const licencias: Licencia[] = [
  {
    numero: "004",
    ubicacion: "Calle Los Pinos 567, San Isidro, Lima",
    licencia: "Licencia de Servicios - 157",
    fecha: "2024-02-10",
    estado: "transferida",
  },
  {
    numero: "005",
    ubicacion: "Av. Ejército 890, Cusco",
    licencia: "Licencia Industrial - 158",
    fecha: "2023-11-20",
    estado: "eliminado",
  },
  {
    numero: "006",
    ubicacion: "Jr. Unión 345, Centro de Lima",
    licencia: "Licencia Comercial - 159",
    fecha: "2024-03-05",
    estado: "agua",
  },
]


  return (
   <div className="w-full space-y-6 p-1 md:px-4 md:py-6">

      <Link href={`/dashboard/buscarusuarioagua`}>
            
      <BackButton className="px-3 py-1.5 text-sm" />
    </Link>

  

    <UsuarioContainer data={usuarios}  />
    <LicenciasCard licencias={licencias}  />
  </div>
)

}
