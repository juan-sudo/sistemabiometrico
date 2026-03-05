"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Usuario } from "./UsuarioCard"

interface Props {
  open: boolean
  onClose: () => void
  usuario: Usuario | null
}

export function ModalEditarUsuario({ open, onClose, usuario }: Props) {
  if (!usuario) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input defaultValue={usuario.codigo} disabled />
          <Input defaultValue={usuario.dni} />
          <Input defaultValue={usuario.nombres} />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
