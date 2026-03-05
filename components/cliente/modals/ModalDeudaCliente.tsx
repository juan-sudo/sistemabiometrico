"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Printer, MessageCircle, Bell, Droplet } from "lucide-react"

interface ModalDeudaClienteProps {
  open: boolean
  onClose: () => void
  value: string
}

interface FilaDatos {
  anio: number
  periodo: number
  importe: number
  gastos: number
  descuento: number
  total: number
  seleccionado: boolean
}

export function ModalDeudaCliente({
  open,
  onClose,
  value,
}: ModalDeudaClienteProps) {
  const datosIniciales: FilaDatos[] = Array.from({ length: 12 }, (_, i) => {
    const importe = 120
    const gastos = 10
    const descuento = 5
    return {
      anio: 2025,
      periodo: i + 1,
      importe,
      gastos,
      descuento,
      total: importe + gastos - descuento,
      seleccionado: false,
    }
  })

  const [datos, setDatos] = useState(datosIniciales)
  const [seleccionarTodo, setSeleccionarTodo] = useState(false)

  const toggleSeleccionTodo = () => {
    const nuevo = !seleccionarTodo
    setSeleccionarTodo(nuevo)
    setDatos(datos.map((d) => ({ ...d, seleccionado: nuevo })))
  }

  const toggleFila = (index: number) => {
    const copia = [...datos]
    copia[index].seleccionado = !copia[index].seleccionado
    setDatos(copia)
    setSeleccionarTodo(copia.every((d) => d.seleccionado))
  }

  const totales = useMemo(() => {
    return datos
      .filter((d) => d.seleccionado)
      .reduce(
        (acc, d) => {
          acc.importe += d.importe
          acc.gastos += d.gastos
          acc.descuento += d.descuento
          acc.total += d.total
          return acc
        },
        { importe: 0, gastos: 0, descuento: 0, total: 0 }
      )
  }, [datos])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="
          w-[95vw] max-w-6xl
          max-h-[90vh]
          overflow-hidden
          rounded-xl
        "
      >
        {/* HEADER */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <Droplet className="h-5 w-5" />
            Estado de cuenta – Agua potable
          </DialogTitle>
          <p className="text-sm text-gray-500">
            Código consultado:
            <span className="ml-1 font-medium text-blue-600">{value}</span>
          </p>
        </DialogHeader>

        {/* TABLA CON SCROLL */}
        <div className="mt-4 rounded-lg border overflow-x-auto">
          <div className="min-w-[720px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-100">
                  <TableHead className="w-[40px] text-center">
                    <Checkbox
                      checked={seleccionarTodo}
                      onCheckedChange={toggleSeleccionTodo}
                    />
                  </TableHead>
                  <TableHead className="text-center">Año</TableHead>
                  <TableHead className="text-center">Periodo</TableHead>
                  <TableHead className="text-center">Importe</TableHead>

                  {/* Ocultos en móvil */}
                  <TableHead className="hidden sm:table-cell text-center">
                    Gastos
                  </TableHead>
                  <TableHead className="hidden sm:table-cell text-center">
                    Descuento
                  </TableHead>

                  <TableHead className="text-center">Total</TableHead>
                </TableRow>
              </TableHeader>
            </Table>

            <div className="max-h-[45vh] overflow-y-auto">
              <Table>
                <TableBody>
                  {datos.map((d, i) => (
                    <TableRow
                      key={i}
                      className={d.seleccionado ? "bg-green-100" : ""}
                    >
                      <TableCell className="text-center">
                        <Checkbox
                          checked={d.seleccionado}
                          onCheckedChange={() => toggleFila(i)}
                        />
                      </TableCell>
                      <TableCell className="text-center">{d.anio}</TableCell>
                      <TableCell className="text-center">{d.periodo}</TableCell>
                      <TableCell className="text-center">{d.importe}</TableCell>

                      <TableCell className="hidden sm:table-cell text-center">
                        {d.gastos}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center">
                        {d.descuento}
                      </TableCell>

                      <TableCell className="text-center font-semibold">
                        {d.total}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* TOTALES */}
            <div className="bg-teal-700 text-white border-t">
              <Table>
                <TableBody>
                  <TableRow className="font-bold">
                    <TableCell colSpan={3} className="text-center">
                      Totales
                    </TableCell>
                    <TableCell className="text-center">
                      {totales.importe}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-center">
                      {totales.gastos}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-center">
                      {totales.descuento}
                    </TableCell>
                    <TableCell className="text-center text-blue-700">
                      {totales.total}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" />
            Imprimir
          </Button>

         

        
        </div>
      </DialogContent>
    </Dialog>
  )
}


