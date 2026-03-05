"use client"

import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,

} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, IdCard, User,BadgeCheck } from "lucide-react"

export default function Page() {
  const [codigo, setCodigo] = useState("")
  const [dni, setDni] = useState("")
  const [nombres, setNombres] = useState("")

  const [data] = useState([
    { codigo: "A001", dni: "12345678", nombres: "Juan Pérez" },
    { codigo: "A002", dni: "87654321", nombres: "María López" },
  ])

  const handleBuscar = () => {
    console.log({ codigo, dni, nombres })
  }

  return (
    <div className="p-6 max-w-7xl space-y-6">
      {/* Card búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Búsqueda de usuarios</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Inputs */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Código"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="relative">
              <IdCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="DNI"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nombres completos"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

        
        </CardContent>
      </Card>

      {/* Card tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Nombres completos</TableHead>
                    <TableHead>Accion</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.length > 0 ? (
                  data.map((item, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>{item.codigo}</TableCell>
                      <TableCell>{item.dni}</TableCell>
                      <TableCell>{item.nombres}</TableCell>
                     <TableCell>
                       <Link href={`/dashboard/gestionaragua?codigo=${item.codigo}&dni=${item.dni}&nombres=${encodeURIComponent(item.nombres)}`}>
                         <Button variant="outline" size="icon">
                           <BadgeCheck className="h-4 w-4 text-blue-600" />
                         </Button>
                       </Link>
                    </TableCell>

                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-6"
                    >
                      No hay resultados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
