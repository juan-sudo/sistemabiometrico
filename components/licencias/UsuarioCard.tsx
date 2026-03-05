"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"

export interface Usuario {
  codigo: string
  dni: string
  nombres: string
}

interface Props {
  data: Usuario[]
  onEdit: (usuario: Usuario) => void
}

export function UsuarioCard({ data, onEdit }: Props) {
  return (
    <Card className="shadow-sm border-muted w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">
          Usuarios
        </CardTitle>
      </CardHeader>

    <CardContent>
  <div className="relative w-full overflow-x-auto">
    <div className="min-w-[600px]">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="w-[120px]">Código</TableHead>
            <TableHead>DNI</TableHead>
            <TableHead>Nombres</TableHead>
            <TableHead className="text-center w-[100px]">
              Acción
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((u) => (
            <TableRow
              key={u.codigo}
              className="hover:bg-muted/30 transition-colors"
            >
              <TableCell className="font-medium">
                {u.codigo}
              </TableCell>
              <TableCell>{u.dni}</TableCell>
              <TableCell>{u.nombres}</TableCell>
              
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(u)}
                  className="hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
</CardContent>

    </Card>
  )
}
