"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckCircle, Printer, MessageCircle, Bell } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface FilaDatos {
  codigo: string
  servicio: string
  anio: number
  periodo: number
  importe: number
  gastos: number
  subtotal: number
  descuento: number
  total: number
  seleccionado: boolean
}

export function ModalDeuda() {
  const servicios = [
    { codigo: "001", servicio: "Agua", importe: 120, gastos: 10, descuento: 5 },
  ]
  const años = [2024, 2025]

  // Generar datos con 12 periodos por año
  const datosIniciales: FilaDatos[] = años.flatMap((anio) =>
    servicios.flatMap((s) =>
      Array.from({ length: 12 }, (_, i) => {
        const periodo = i + 1
        const subtotal = s.importe + s.gastos
        const total = subtotal - s.descuento
        return {
          codigo: s.codigo,
          servicio: s.servicio,
          anio,
          periodo,
          importe: s.importe,
          gastos: s.gastos,
          subtotal,
          descuento: s.descuento,
          total,
          seleccionado: false,
        }
      })
    )
  )

  const [datos, setDatos] = useState(datosIniciales)
  const [seleccionarTodo, setSeleccionarTodo] = useState(false)

  const toggleSeleccionTodo = () => {
    const nuevoValor = !seleccionarTodo
    setSeleccionarTodo(nuevoValor)
    setDatos(datos.map((d) => ({ ...d, seleccionado: nuevoValor })))
  }

  const toggleSeleccionFila = (index: number) => {
    const nuevoDatos = [...datos]
    nuevoDatos[index].seleccionado = !nuevoDatos[index].seleccionado
    setDatos(nuevoDatos)
    setSeleccionarTodo(nuevoDatos.every((d) => d.seleccionado))
  }

  // Totales de filas seleccionadas
  const totales = useMemo(() => {
    return datos
      .filter((d) => d.seleccionado)
      .reduce(
        (acc, item) => {
          acc.importe += item.importe
          acc.gastos += item.gastos
          acc.subtotal += item.subtotal
          acc.descuento += item.descuento
          acc.total += item.total
          return acc
        },
        { importe: 0, gastos: 0, subtotal: 0, descuento: 0, total: 0 }
      )
  }, [datos])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 border-red-600 text-red-700"
        >
          <CheckCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Deuda</span>
          
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <CheckCircle className="h-5 w-5" />
            Estado de cuenta - deuda
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 border rounded-lg relative">
          {/* Cabecera de la tabla */}
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-blue-300 sticky top-0 z-10">
                <TableHead className="w-[40px] text-center">
                  <Checkbox
                    checked={seleccionarTodo}
                    onCheckedChange={toggleSeleccionTodo}
                  />
                </TableHead>
                <TableHead className="text-center">Código</TableHead>
                <TableHead className="text-center">Servicio</TableHead>
                <TableHead className="text-center">Año</TableHead>
                <TableHead className="text-center">Periodo</TableHead>
                <TableHead className="text-center">Importe</TableHead>
                <TableHead className="text-center">Gastos</TableHead>
                <TableHead className="text-center">Subtotal</TableHead>
                <TableHead className="text-center">Descuento</TableHead>
                <TableHead className="text-center">Total</TableHead>
              </TableRow>
            </TableHeader>
          </Table>

          {/* Scrollable tbody */}
          <div className="max-h-[500px] overflow-y-auto relative">
            <Table className="w-full table-fixed">
              <TableBody>
                {datos.map((item, index) => (
                  <TableRow
                    key={index}
                    className={`${
                      item.seleccionado
                        ? "bg-green-100"
                        : index % 2 === 0
                        ? "bg-gray-50"
                        : ""
                    }`}
                  >
                    <TableCell className="w-[40px] text-center">
                      <Checkbox
                        checked={item.seleccionado}
                        onCheckedChange={() => toggleSeleccionFila(index)}
                      />
                    </TableCell>
                    <TableCell className="text-center">{item.codigo}</TableCell>
                    <TableCell className="text-center">{item.servicio}</TableCell>
                    <TableCell className="text-center">{item.anio}</TableCell>
                    <TableCell className="text-center">{item.periodo}</TableCell>
                    <TableCell className="text-center">{item.importe}</TableCell>
                    <TableCell className="text-center">{item.gastos}</TableCell>
                    <TableCell className="text-center">{item.subtotal}</TableCell>
                    <TableCell className="text-center">{item.descuento}</TableCell>
                    <TableCell className="text-center">{item.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Footer sticky */}
            <div className="sticky bottom-0 bg-gray-200 z-20 border-t">
              <Table className="w-full table-fixed">
                <TableBody>
                  <TableRow className="font-bold">
                    <TableCell colSpan={5} className="text-center">
                      Totales seleccionados
                    </TableCell>
                    <TableCell className="text-center">{totales.importe}</TableCell>
                    <TableCell className="text-center">{totales.gastos}</TableCell>
                    <TableCell className="text-center">{totales.subtotal}</TableCell>
                    <TableCell className="text-center">{totales.descuento}</TableCell>
                    <TableCell className="text-center">{totales.total}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="flex items-center gap-1"
        >
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>

        <Button
          variant="secondary"
          onClick={() =>
            alert("Enviar al WhatsApp / generar notificación")
          }
          className="flex items-center gap-1"
        >
          <MessageCircle className="h-4 w-4" />
          Enviar
        </Button>

        <Button
          variant="secondary"
          onClick={() =>
            alert("Generar notificación")
          }
          className="flex items-center gap-1"
        >
          <Bell className="h-4 w-4" />
          Notificar
        </Button>
      </div>
      </DialogContent>
    </Dialog>
  )
}
