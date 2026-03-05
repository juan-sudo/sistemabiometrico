import clsx from 'clsx'

interface LicenciaStatusProps {
  status: 'agua' | 'transferida' | 'eliminado'
}

const statusLabel = {
  agua: 'Activa',
  transferida: 'Transferida',
  eliminado: 'Eliminada',
}

export default function LicenciaStatus({ status }: LicenciaStatusProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        {
          'bg-blue-100 text-blue-800': status === 'agua',
          'bg-green-100 text-green-800': status === 'transferida',
          'bg-red-100 text-red-800': status === 'eliminado',
        }
      )}
    >
      {statusLabel[status]}
    </span>
  )
}
