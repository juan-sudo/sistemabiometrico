"use client"

import { useState } from "react"
import { UsuarioCard, Usuario } from "./UsuarioCard"
import { ModalEditarUsuario } from "./modals/ModalEditarUsuario"

interface Props {
  data: Usuario[]
}

export function UsuarioContainer({ data }: Props) {
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null)

  return (
    <>
      <UsuarioCard
        data={data}
        onEdit={(u) => setUsuarioEditar(u)}
      />

      <ModalEditarUsuario
        open={!!usuarioEditar}
        usuario={usuarioEditar}
        onClose={() => setUsuarioEditar(null)}
      />
    </>
  )
}
