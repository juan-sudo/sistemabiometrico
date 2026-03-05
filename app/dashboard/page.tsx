"use client"

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { useEffect, useMemo, useState } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { apiEndpoints, authRequest } from "@/lib/api-client"
import useUserStore from "@/stores/useUserStore"

type Personal = { id: number; nombres_completos: string; estado?: string }
type Marcacion = { id: number; personal: number; fecha_hora: string; tipo_evento: string }
type Justificacion = { id: number; personal: number; motivo: string; estado: string; fecha_inicio: string; fecha_fin: string }
type Descanso = { id: number; personal: number; fecha_inicio: string; fecha_fin?: string }
type Boleta = { id: number; anio: number; mes: number; neto_pagar?: string | number }
type Dispositivo = { id: number; nombre: string; activo: boolean }
type Area = { id: number }
type Sucursal = { id: number }
type Empresa = { id: number }

const asArray = (x: unknown) =>
  Array.isArray(x) ? x : x && typeof x === "object" && Array.isArray((x as { results?: unknown[] }).results) ? (x as { results: unknown[] }).results : []

export default function Page() {
  const token = useUserStore((s) => s.accessToken)
  const now = new Date()
  const [loading, setLoading] = useState(true)
  const [personales, setPersonales] = useState<Personal[]>([])
  const [marcaciones, setMarcaciones] = useState<Marcacion[]>([])
  const [justificaciones, setJustificaciones] = useState<Justificacion[]>([])
  const [descansos, setDescansos] = useState<Descanso[]>([])
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [timeRange, setTimeRange] = useState("15")

  useEffect(() => {
    const run = async () => {
      if (!token) return setLoading(false)
      try {
        setLoading(true)
        const [p, m, j, d, b, di, a, s, e] = await Promise.all([
          authRequest(apiEndpoints.personales, { token }),
          authRequest(apiEndpoints.marcaciones, { token }),
          authRequest(apiEndpoints.justificaciones, { token }),
          authRequest(apiEndpoints.descansosMedicos, { token }),
          authRequest(apiEndpoints.boletasMensuales, { token }),
          authRequest(apiEndpoints.dispositivos, { token }),
          authRequest(apiEndpoints.areas, { token }),
          authRequest(apiEndpoints.sucursales, { token }),
          authRequest(apiEndpoints.empresas, { token }),
        ])
        setPersonales(asArray(p) as Personal[])
        setMarcaciones(asArray(m) as Marcacion[])
        setJustificaciones(asArray(j) as Justificacion[])
        setDescansos(asArray(d) as Descanso[])
        setBoletas(asArray(b) as Boleta[])
        setDispositivos(asArray(di) as Dispositivo[])
        setAreas(asArray(a) as Area[])
        setSucursales(asArray(s) as Sucursal[])
        setEmpresas(asArray(e) as Empresa[])
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo cargar el dashboard")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [token])

  const personalMap = useMemo(
    () => Object.fromEntries(personales.map((item) => [item.id, item.nombres_completos])),
    [personales]
  )

  const activePersonal = useMemo(
    () => personales.filter((item) => (item.estado || "ACTIVO") === "ACTIVO").length,
    [personales]
  )

  const monthMarcaciones = useMemo(
    () =>
      marcaciones.filter((item) => {
        const dt = new Date(item.fecha_hora)
        return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear()
      }),
    [marcaciones, now]
  )

  const pendingJustificaciones = useMemo(
    () => justificaciones.filter((item) => item.estado === "PENDIENTE").length,
    [justificaciones]
  )

  const asistenciaDiaria = useMemo(() => {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const autorizadas = justificaciones.filter((item) => item.estado === "AUTORIZADO")
    const rows = []

    for (let day = 1; day <= daysInMonth; day += 1) {
      const current = new Date(now.getFullYear(), now.getMonth(), day)
      const currentKey = current.toISOString().slice(0, 10)

      const asistentes = new Set(
        marcaciones
          .filter((item) => item.fecha_hora.slice(0, 10) === currentKey)
          .map((item) => item.personal)
      )

      const cubiertos = new Set<number>()

      autorizadas.forEach((item) => {
        const start = new Date(item.fecha_inicio || "")
        const end = new Date(item.fecha_fin || "")
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && current >= start && current <= end) {
          cubiertos.add(item.personal)
        }
      })

      descansos.forEach((item) => {
        const start = new Date(item.fecha_inicio || "")
        const end = new Date(item.fecha_fin || item.fecha_inicio || "")
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && current >= start && current <= end) {
          cubiertos.add(item.personal)
        }
      })

      const attended = asistentes.size
      const justifiedOrMedical = cubiertos.size
      const faltas = Math.max(activePersonal - attended - justifiedOrMedical, 0)

      rows.push({
        fecha: currentKey,
        attended,
        faltas,
        covered: justifiedOrMedical,
      })
    }

    return rows
  }, [activePersonal, descansos, justificaciones, marcaciones, now])

  const filteredAsistenciaDiaria = useMemo(() => {
    const days = Number(timeRange)
    return asistenciaDiaria.slice(Math.max(asistenciaDiaria.length - days, 0))
  }, [asistenciaDiaria, timeRange])

  const faltasMayoresDias = useMemo(
    () => filteredAsistenciaDiaria.filter((item) => item.faltas > item.attended).length,
    [filteredAsistenciaDiaria]
  )

  const monthBoletas = useMemo(
    () => boletas.filter((item) => item.anio === now.getFullYear() && item.mes === now.getMonth() + 1),
    [boletas, now]
  )

  const totalPlanilla = useMemo(
    () => monthBoletas.reduce((acc, item) => acc + Number(item.neto_pagar || 0), 0),
    [monthBoletas]
  )

  const activeDevices = useMemo(
    () => dispositivos.filter((item) => item.activo).length,
    [dispositivos]
  )

  const recentMarcaciones = useMemo(
    () =>
      [...marcaciones]
        .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())
        .slice(0, 6),
    [marcaciones]
  )

  const recentJustificaciones = useMemo(() => justificaciones.slice(0, 6), [justificaciones])

  if (!token) return <section className="p-6 text-sm text-slate-600">Inicia sesion para continuar.</section>

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:px-6">
        <SummaryCard
          title="Personal Activo"
          value={loading ? "..." : String(activePersonal)}
          badge={`${personales.length} total`}
          up
          footer1="Trabajadores registrados"
          footer2="Incluye personal activo e inactivo"
        />
        <SummaryCard
          title="Marcaciones Del Mes"
          value={loading ? "..." : String(monthMarcaciones.length)}
          badge={`${activeDevices} disp.`}
          up
          footer1="Marcaciones descargadas"
          footer2="Periodo actual"
        />
        <SummaryCard
          title="Justificaciones Pendientes"
          value={loading ? "..." : String(pendingJustificaciones)}
          badge={`${justificaciones.length} total`}
          up={pendingJustificaciones === 0}
          footer1="Requieren revision"
          footer2="Autorizacion institucional"
        />
        <SummaryCard
          title="Planilla Del Mes"
          value={loading ? "..." : `S/ ${totalPlanilla.toFixed(2)}`}
          badge={`${monthBoletas.length} boletas`}
          up
          footer1="Neto acumulado"
          footer2="Boletas generadas del mes"
        />
      </div>

      <div className="px-4 lg:px-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">Tendencia De Asistencia</h2>
              <p className="mt-1 text-sm text-slate-500">Asistencias y faltas del periodo actual en el tiempo</p>
            </div>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setTimeRange("30")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  timeRange === "30" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Ultimos 30 dias
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("15")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  timeRange === "15" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Ultimos 15 dias
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("7")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  timeRange === "7" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Ultimos 7 dias
              </button>
            </div>
          </div>

          <div className="px-6 py-5">
            {loading ? (
              <p className="text-sm text-slate-400">Cargando tendencia diaria...</p>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">Dias con faltas altas: {faltasMayoresDias}</Badge>
                  <Badge variant="outline" className="border-slate-200 bg-white text-emerald-700">Promedio asistencia: {formatAverage(filteredAsistenciaDiaria, "attended")}</Badge>
                  <Badge variant="outline" className="border-slate-200 bg-white text-rose-700">Promedio faltas: {formatAverage(filteredAsistenciaDiaria, "faltas")}</Badge>
                  <Badge variant="outline" className="border-slate-200 bg-white text-amber-700">Promedio cubiertos: {formatAverage(filteredAsistenciaDiaria, "covered")}</Badge>
                </div>

                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredAsistenciaDiaria}>
                      <defs>
                        <linearGradient id="fillAttendDark" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0f172a" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="#0f172a" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="fillMissingDark" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="fecha"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        stroke="#64748b"
                        tickFormatter={(value) => {
                          const [, month, day] = String(value).split("-")
                          return `${day}/${month}`
                        }}
                      />
                      <YAxis tickLine={false} axisLine={false} width={36} stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 14,
                          borderColor: "#cbd5e1",
                          backgroundColor: "#ffffff",
                          color: "#0f172a",
                        }}
                        formatter={(value: number, name: string) => [
                          value,
                          name === "attended" ? "Asistencias" : "Faltas",
                        ]}
                        labelFormatter={(label) => `Fecha: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="faltas"
                        stroke="#94a3b8"
                        fill="url(#fillMissingDark)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="attended"
                        stroke="#0f172a"
                        fill="url(#fillAttendDark)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">Linea oscura: asistencias</Badge>
                  <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">Linea gris: faltas</Badge>
                  <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">Si la linea gris supera la oscura, faltas mayores</Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-4 lg:grid-cols-2 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Ultimas Marcaciones</CardTitle>
            <CardDescription>Ultimos registros biometricos descargados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : recentMarcaciones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay marcaciones registradas.</p>
            ) : recentMarcaciones.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{personalMap[item.personal] || `#${item.personal}`}</p>
                  <Badge variant="outline">{item.tipo_evento}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(item.fecha_hora).toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ultimas Justificaciones</CardTitle>
            <CardDescription>Resumen de solicitudes recientes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : recentJustificaciones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay justificaciones registradas.</p>
            ) : recentJustificaciones.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{personalMap[item.personal] || `#${item.personal}`}</p>
                  <Badge variant="outline">{item.estado}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.motivo}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  badge,
  up,
  footer1,
  footer2,
}: {
  title: string
  value: string
  badge: string
  up: boolean
  footer1: string
  footer2: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-2xl font-semibold">{value}</CardTitle>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          {up ? <IconTrendingUp size={16} /> : <IconTrendingDown size={16} />}
          {badge}
        </Badge>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="flex items-center gap-2 font-medium">
          {footer1}
          {up ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
        </div>
        <div className="text-muted-foreground">{footer2}</div>
      </CardFooter>
    </Card>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function formatAverage(
  rows: { attended: number; faltas: number; covered: number }[],
  key: "attended" | "faltas" | "covered"
) {
  if (rows.length === 0) return "0"
  const total = rows.reduce((acc, item) => acc + item[key], 0)
  return (total / rows.length).toFixed(1)
}
