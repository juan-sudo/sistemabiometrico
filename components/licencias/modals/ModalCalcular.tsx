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
import { Calculator, User, MapPin, Calendar, Tag, DollarSign, Percent } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function ModalCalcular() {
  const licencia = {
    servicio: "Agua",
    nroLicencia: 15,
    anio: 2023,
    otorgadoA: "ACCO GARRIAZO GREGORIO",
    nroDNI: "08397614",
    ubicacion:
      "JR. MANUEL ESCAJADILLO SN Mz. 26 Lt. 19 Luz 16691 Cdr 3 BARRIO-CHAUPI",
    tipo: "PERMANENTE",
    categoria: "C",
    monto: 4.0,
    fechaExp: "2023-10-01",
    descuentoSindicato: 0,
    descuentoServicio: 0,
  }

  const anioActual = new Date().getFullYear()
  const aniosDisponibles = Array.from(
    { length: anioActual - 2003 },
    (_, i) => 2004 + i
  )

  const [anioSeleccionado, setAnioSeleccionado] = useState(anioActual)
  const [resultados, setResultados] = useState<any[]>([])

  const calcularMontos = () => {
    const subtotal = licencia.monto
    const total =
      subtotal - licencia.descuentoSindicato - licencia.descuentoServicio

    setResultados([
      {
        anio: anioSeleccionado,
        subtotal,
        descuentoSindicato: licencia.descuentoSindicato,
        descuentoServicio: licencia.descuentoServicio,
        total,
      },
    ])
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 border-blue-600 text-blue-700">
          <Calculator className="h-4 w-4" />
          
           <span className="hidden sm:inline">Calcular</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <Calculator className="h-5 w-5 text-blue-600" />
            Calcular Estado de Cuenta - {licencia.servicio}
          </DialogTitle>
        </DialogHeader>

        {/* Tarjetas de información */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Usuario */}
          <div className="flex items-start gap-2 p-4 bg-blue-50 rounded shadow-sm">
            <User className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <p className="text-sm font-medium">Otorgado a</p>
              <p className="text-sm">{licencia.otorgadoA}</p>
              <p className="text-xs text-gray-500">DNI: {licencia.nroDNI}</p>
            </div>
          </div>

          {/* Ubicación */}
          <div className="flex items-start gap-2 p-4 bg-green-50 rounded shadow-sm">
            <MapPin className="h-6 w-6 text-green-600 mt-1" />
            <div>
              <p className="text-sm font-medium">Ubicación Predio</p>
              <p className="text-sm">{licencia.ubicacion}</p>
            </div>
          </div>

          {/* Detalle Licencia */}
          <div className="flex flex-col gap-2 p-4 bg-yellow-50 rounded shadow-sm">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-yellow-600" />
              <p className="text-sm font-medium">Licencia Nro: {licencia.nroLicencia}</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <p className="text-sm">Tipo: {licencia.tipo}</p>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-yellow-600" />
              <p className="text-sm">Categoría: {licencia.categoria}</p>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <p className="text-sm">Monto: {licencia.monto.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <p className="text-sm">Fecha Exp: {licencia.fechaExp}</p>
            </div>
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-yellow-600" />
              <p className="text-sm">Descuento Sindicato: {licencia.descuentoSindicato}</p>
            </div>
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-yellow-600" />
              <p className="text-sm">Descuento Servicio: {licencia.descuentoServicio}</p>
            </div>
          </div>
        </div>

        {/* Selección de año */}
        <div className="mt-4 flex items-center gap-2">
          <label htmlFor="anioSelect" className="text-sm font-medium">
            Seleccionar Año:
          </label>
          <select
            id="anioSelect"
            className="border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={anioSeleccionado}
            onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
          >
            {aniosDisponibles.map((anio) => (
              <option key={anio} value={anio}>
                {anio}
              </option>
            ))}
          </select>
        </div>

        {/* Botón Calcular */}
        <div className="flex justify-end mt-4">
          <Button
            onClick={calcularMontos}
            className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
          >
            <Calculator className="h-4 w-4" />
            Calcular
          </Button>
        </div>

        {/* Resultados */}
        {resultados.length > 0 && (
          <div className="mt-6 overflow-x-auto border rounded shadow-sm bg-white">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow className="bg-blue-50 text-blue-700 font-medium">
                  <TableHead className="text-center">Año</TableHead>
                  <TableHead className="text-center">Subtotal</TableHead>
                  <TableHead className="text-center">Descuento Sindicato</TableHead>
                  <TableHead className="text-center">Descuento Servicio</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultados.map((r) => (
                  <TableRow key={r.anio} className="even:bg-gray-50 hover:bg-teal-700 text-white">
                    <TableCell className="text-center font-medium">{r.anio}</TableCell>
                    <TableCell className="text-center">{r.subtotal.toFixed(2)}</TableCell>
                    <TableCell className="text-center">{r.descuentoSindicato.toFixed(2)}</TableCell>
                    <TableCell className="text-center">{r.descuentoServicio.toFixed(2)}</TableCell>
                    <TableCell className="text-center font-semibold">{r.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}


