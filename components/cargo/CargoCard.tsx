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
import { Pencil, Trash } from "lucide-react" // 🔹 Importamos Trash

export interface Cargo {
  codigo: string
  descripcion: string
}

interface Props {
  data: Cargo[]
  onEdit: (usuario: Cargo) => void
  onDelete: (usuario: Cargo) => void // 🔹 Nuevo callback para eliminar
}

export function CargoCard({ data, onEdit, onDelete }: Props) {
  return (
    <Card className="shadow-sm border-muted w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Usuarios</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="relative w-full overflow-x-auto">
          <div className="min-w-[600px]">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[120px]">Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center w-[120px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.map((u) => (
                  <TableRow
                    key={u.codigo}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-medium">{u.codigo}</TableCell>
                    <TableCell>{u.descripcion}</TableCell>

                    <TableCell className="text-center flex justify-center gap-2">
                      {/* Editar */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(u)}
                        className="hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      {/* Eliminar */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(u)}
                        className="hover:text-red-500"
                      >
                        <Trash className="h-4 w-4" />
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
