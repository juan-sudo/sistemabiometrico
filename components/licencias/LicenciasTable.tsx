"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Dispatch, SetStateAction } from "react"

interface Licencia {
  numero: string
  ubicacion: string
  licencia: string
  fecha: string
  estado: string
}

interface Props {
  licencias: Licencia[]
  selectedLicencias: string[]
  setSelectedLicencias: Dispatch<SetStateAction<string[]>>
}

export function LicenciasTable({
  licencias,
  selectedLicencias,
  setSelectedLicencias,
}: Props) {
  const toggle = (id: string, checked: boolean) => {
    setSelectedLicencias((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    )
  }

  
  const badge = (estado: string) => {
    switch (estado) {
      case "agua":
        return <Badge className="bg-blue-100 text-blue-800">Activa</Badge>
      case "transferida":
        return <Badge className="bg-green-100 text-green-800">Transferida</Badge>
      case "eliminado":
        return <Badge className="bg-red-100 text-red-800">Eliminada</Badge>
      default:
        return <Badge variant="secondary">Pendiente</Badge>
    }
  }

 return (
  <div className="relative w-full overflow-x-auto">
    <Table className="min-w-[700px]">
      <TableHeader>
        <TableRow>
          <TableHead className="w-10" />
          <TableHead>N°</TableHead>
          <TableHead>Ubicación</TableHead>
          <TableHead>Licencia</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {licencias.map((l) => {
          const checked = selectedLicencias.includes(l.numero)

          return (
            <TableRow
              key={l.numero}
              className={checked ? "bg-blue-50" : ""}
            >
              <TableCell>
                <Checkbox
                  checked={checked}
                  onCheckedChange={(c) =>
                    toggle(l.numero, Boolean(c))
                  }
                />
              </TableCell>

              <TableCell>{l.numero}</TableCell>
              <TableCell className="whitespace-nowrap">
                {l.ubicacion}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {l.licencia}
              </TableCell>
              <TableCell>{l.fecha}</TableCell>
              <TableCell>{badge(l.estado)}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  </div>
)

}
