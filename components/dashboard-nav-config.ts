import {
  Bot,
  Command,
  FileText,
  SquareTerminal,
  Wrench,
  UsersRound,
  type LucideIcon,
} from "lucide-react"

export type DashboardNavSubItem = {
  title: string
  url: string
  moduleCode?: string
}

export type DashboardNavItem = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: DashboardNavSubItem[]
}

export const dashboardNavItems: DashboardNavItem[] = [
  {
    title: "Escritorio",
    url: "#",
    icon: SquareTerminal,
    isActive: true,
    items: [
      {
        title: "Inicio",
        url: "#",
        moduleCode: "ESCRITORIO",
      },
    ],
  },
  {
    title: "Mantenimiento",
    url: "#",
    icon: Wrench,
    items: [
      { title: "Empresas", url: "/dashboard/empresa", moduleCode: "EMPRESAS" },
      { title: "Sucursales", url: "/dashboard/sucursal", moduleCode: "SUCURSALES" },
      { title: "Areas", url: "/dashboard/area", moduleCode: "AREAS" },
      { title: "Cargos", url: "/dashboard/cargo", moduleCode: "CARGOS" },
      { title: "Tipo trabajador", url: "/dashboard/tipotrabajador", moduleCode: "TIPO_TRABAJADOR" },
      { title: "Categoria", url: "/dashboard/categoria", moduleCode: "CATEGORIAS" },
      { title: "Turnos", url: "/dashboard/turno", moduleCode: "TURNOS" },
      { title: "Horario personal", url: "/dashboard/horario-personal", moduleCode: "TURNOS" },
    ],
  },
  {
    title: "Dispositivos",
    url: "#",
    icon: Bot,
    items: [
      { title: "Listar dispositivos", url: "/dashboard/dispositivos", moduleCode: "DISPOSITIVOS" },
      { title: "Administracion", url: "#", moduleCode: "DISPOSITIVOS" },
      { title: "Descargar marcas", url: "/dashboard/descargar-marcas", moduleCode: "DESCARGAR_MARCAS" },
    ],
  },
  {
    title: "Personal",
    url: "#",
    icon: UsersRound,
    items: [
      { title: "Listar personal", url: "/dashboard/personal", moduleCode: "PERSONAL" },
      { title: "Boleta mensual", url: "/dashboard/boleta-mensual", moduleCode: "BOLETA_MENSUAL" },
      { title: "Resumen", url: "/dashboard/resumen-planilla", moduleCode: "RESUMEN_PLANILLA" },
    ],
  },
  {
    title: "Reporte",
    url: "#",
    icon: FileText,
    items: [
      { title: "Procesar asistencia", url: "/dashboard/procesar-asistencia", moduleCode: "PROCESAR_ASISTENCIA" },
      { title: "Consultar asistencia", url: "/dashboard/consultar-asistencia", moduleCode: "CONSULTAR_ASISTENCIA" },
    ],
  },
  {
    title: "Justificacion",
    url: "#",
    icon: Command,
    items: [
      { title: "Registrar Justificacion", url: "/dashboard/marcaciones/justificacion", moduleCode: "JUSTIFICACIONES" },
      { title: "Autorizar Justificacion", url: "/dashboard/marcaciones/autorizar-justificacion", moduleCode: "AUTORIZAR_JUSTIFICACION" },
      { title: "Descanso Medico", url: "/dashboard/marcaciones/justificacion/descanso-medico", moduleCode: "DESCANSO_MEDICO" },
    ],
  },
]

export function getDashboardSearchEntries() {
  return dashboardNavItems.flatMap((group) =>
    (group.items ?? [])
      .filter((item) => item.url && item.url !== "#")
      .map((item) => ({
        title: item.title,
        group: group.title,
        url: item.url,
        moduleCode: item.moduleCode,
      }))
  )
}
