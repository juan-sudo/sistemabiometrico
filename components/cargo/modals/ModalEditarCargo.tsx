"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Cargo } from "../CargoCard"

interface Props {
  open: boolean
  usuario: Cargo | null
  onClose: () => void
}

export function ModalEditarCargo({
  open,
  usuario,
  onClose,
}: Props) {
  if (!usuario) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p><b>Código:</b> {usuario.codigo}</p>
          <p><b>Descripcion:</b> {usuario.descripcion}</p>
          
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button>
            Guardar cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
