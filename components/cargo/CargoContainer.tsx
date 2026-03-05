"use client"

import { useState } from "react"
import { CargoCard, Cargo } from "./CargoCard"
import { ModalEditarCargo } from "./modals/ModalEditarCargo"

interface Props {
  data: Cargo[]
}

export default function CargoContainer({ data }: Props) {
  const [cargoList, setCargoList] = useState<Cargo[]>(data) // 🔹 Estado local para modificar la lista
  const [usuarioEditar, setUsuarioEditar] = useState<Cargo | null>(null)

  // 🔹 Función para eliminar un cargo
  const handleDelete = (cargo: Cargo) => {
    const confirmDelete = confirm(`¿Eliminar el cargo "${cargo.descripcion}"?`)
    if (confirmDelete) {
      setCargoList(prev => prev.filter(c => c.codigo !== cargo.codigo))
    }
  }

  return (
    <>
      <CargoCard
        data={cargoList}          // 🔹 Usamos la lista local
        onEdit={(u) => setUsuarioEditar(u)}
        onDelete={handleDelete}   // 🔹 Pasamos el callback
      />

      <ModalEditarCargo
        open={!!usuarioEditar}
        usuario={usuarioEditar}
        onClose={() => setUsuarioEditar(null)}
      />
    </>
  )
}
