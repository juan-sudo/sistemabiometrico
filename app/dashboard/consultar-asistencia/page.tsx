"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, FileSearch, Search } from "lucide-react"
import { toast } from "sonner"
import { apiEndpoints, authRequest } from "@/lib/api-client"
import useUserStore from "@/stores/useUserStore"

type Personal = {
  id: number
  numero_documento: string
  nombres_completos: string
}

type Reporte = {
  id: number
  personal: number
  anio: number
  mes: number
}

type ReporteDia = {
  id: number
  reporte: number
  fecha: string
  bloque_orden: number
  estado_dia: string
  hora_entrada_programada: string | null
  hora_salida_programada: string | null
  hora_entrada_real: string | null
  hora_salida_real: string | null
  minutos_tardanza: number
  horas_trabajadas: string
  horas_extra: string
}

type PersonalTurno = {
  id: number
  personal: number
  turno: number
  fecha_inicio: string
  fecha_fin: string | null
}

type Turno = {
  id: number
  nombre: string
}

type TurnoBloque = {
  id: number
  turno: number
  orden: number
  hora_entrada: string
  hora_salida: string
}

const asArray = (x: unknown) =>
  Array.isArray(x) ? x : x && typeof x === "object" && Array.isArray((x as { results?: unknown[] }).results) ? (x as { results: unknown[] }).results : []

const dayNames = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"]

function formatInputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseMinutes(value: string | null) {
  if (!value) return null
  const normalized = value.slice(0, 5)
  const [hours, minutes] = normalized.split(":").map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

function formatShortDate(value: string) {
  const [year, month, day] = value.split("-")
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : "-"
}

function diffMinutes(start: string | null, end: string | null) {
  const startMinutes = parseMinutes(start)
  const endMinutes = parseMinutes(end)
  if (startMinutes === null || endMinutes === null) return 0
  let diff = endMinutes - startMinutes
  if (diff < 0) diff += 24 * 60
  return diff
}

function positiveMinutes(current: string | null, reference: string | null) {
  const currentMinutes = parseMinutes(current)
  const referenceMinutes = parseMinutes(reference)
  if (currentMinutes === null || referenceMinutes === null) return 0
  return Math.max(currentMinutes - referenceMinutes, 0)
}

function earlyMinutes(reference: string | null, current: string | null) {
  const currentMinutes = parseMinutes(current)
  const referenceMinutes = parseMinutes(reference)
  if (currentMinutes === null || referenceMinutes === null) return 0
  return Math.max(referenceMinutes - currentMinutes, 0)
}

function minutesToHours(minutes: number) {
  return (minutes / 60).toFixed(2)
}

function timeRangeLabel(start: string | null, end: string | null) {
  if (!start || !end) return "-"
  return `${formatTime(start)}-${formatTime(end)}`
}

export default function ConsultarAsistenciaPage() {
  const token = useUserStore((s) => s.accessToken)
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const [loading, setLoading] = useState(true)
  const [fechaInicio, setFechaInicio] = useState(formatInputDate(firstDayOfMonth))
  const [fechaFin, setFechaFin] = useState(formatInputDate(today))
  const [selectedPersonalId, setSelectedPersonalId] = useState<number | null>(null)
  const [isPersonalModalOpen, setIsPersonalModalOpen] = useState(false)
  const [personalSearch, setPersonalSearch] = useState("")
  const [personales, setPersonales] = useState<Personal[]>([])
  const [reportes, setReportes] = useState<Reporte[]>([])
  const [dias, setDias] = useState<ReporteDia[]>([])
  const [asignaciones, setAsignaciones] = useState<PersonalTurno[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [bloques, setBloques] = useState<TurnoBloque[]>([])

  useEffect(() => {
    const run = async () => {
      if (!token) return setLoading(false)
      try {
        const [p, r, d, a, t, b] = await Promise.all([
          authRequest(apiEndpoints.personales, { token }),
          authRequest(apiEndpoints.reportesPersonal, { token }),
          authRequest(apiEndpoints.reportesAsistenciaDiaria, { token }),
          authRequest(apiEndpoints.personalTurnos, { token }),
          authRequest(apiEndpoints.turnos, { token }),
          authRequest(apiEndpoints.turnoBloquesHorario, { token }),
        ])
        setPersonales(asArray(p) as Personal[])
        setReportes(asArray(r) as Reporte[])
        setDias(asArray(d) as ReporteDia[])
        setAsignaciones(asArray(a) as PersonalTurno[])
        setTurnos(asArray(t) as Turno[])
        setBloques(asArray(b) as TurnoBloque[])
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo cargar la asistencia procesada")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [token])

  const personalMap = useMemo(() => Object.fromEntries(personales.map((item) => [item.id, item])), [personales])
  const reporteMap = useMemo(() => Object.fromEntries(reportes.map((item) => [item.id, item])), [reportes])
  const turnoMap = useMemo(() => Object.fromEntries(turnos.map((item) => [item.id, item])), [turnos])
  const bloquesByTurno = useMemo(() => {
    const out: Record<number, TurnoBloque[]> = {}
    for (const item of bloques) {
      if (!out[item.turno]) out[item.turno] = []
      out[item.turno].push(item)
    }
    Object.values(out).forEach((items) => items.sort((a, b) => a.orden - b.orden))
    return out
  }, [bloques])

  const visibleReportIds = useMemo(() => new Set(reportes.map((item) => item.id)), [reportes])

  const rows = useMemo(() => {
    const visibleDays = dias.filter((item) => visibleReportIds.has(item.reporte))

    const groupedByPersonDate: Record<string, ReporteDia[]> = {}
    for (const item of visibleDays) {
      const reporte = reporteMap[item.reporte]
      if (!reporte) continue
      const key = `${reporte.personal}::${item.fecha}`
      if (!groupedByPersonDate[key]) groupedByPersonDate[key] = []
      groupedByPersonDate[key].push(item)
    }

    const resolvedRows: Array<{
      id: number | string
      personalId: number | null
      bloqueOrden: number
      fechaIso: string
      nombres: string
      turno: string
      horario: string
      dia: string
      fecha: string
      hEnt: string
      hSal: string
      mEnt: string
      mSal: string
      tRefrigerio: number
      salRefrigerio: string
      entRef: string
      refTomado: number
      tardRef: number
      tardanza: string
      eTemprano: number
      conGoce: number
      sinGoce: number
      sTemprano: number
      hDiurnas: string
      hNocturnas: string
      hExtras: string
      hExtrasRedondeo: string
      hECompensar: string
      hEPagar: string
      p25: string
      p35: string
      hed: string
      p25Hed: string
      p35Hed: string
      hen: string
      p25Hen: string
      p35Hen: string
      p100: string
      tLaborables: string
      tTrabajado: string
      hCompensado: string
      falta: number
      just: number
      feriado: number
    }> = []

    for (const [key, dayItems] of Object.entries(groupedByPersonDate)) {
      const [personalKey, fecha] = key.split("::")
      const personalId = Number(personalKey)
      const reporte = reporteMap[dayItems[0].reporte]
      const personal = reporte ? personalMap[reporte.personal] : null

      const activeAssignment =
        asignaciones.find(
          (assignment) =>
            assignment.personal === personalId &&
            assignment.fecha_inicio <= fecha &&
            (!assignment.fecha_fin || assignment.fecha_fin >= fecha)
        ) ||
        asignaciones.find((assignment) => assignment.personal === personalId && assignment.fecha_inicio <= fecha) ||
        asignaciones
          .filter((assignment) => assignment.personal === personalId)
          .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))[0] ||
        null

      const turno = activeAssignment ? turnoMap[activeAssignment.turno] : null
      const turnoBloques = activeAssignment ? bloquesByTurno[activeAssignment.turno] || [] : []
      const sourceItems =
        turnoBloques.length > 0
          ? turnoBloques.map((block) => dayItems.find((item) => item.bloque_orden === block.orden) || dayItems[0])
          : [...dayItems]

      const materializedItems = sourceItems.map((sourceItem, index) => {
        const turnoBloque = turnoBloques[index] || turnoBloques.find((block) => block.orden === sourceItem.bloque_orden) || null
        const blockOrder = turnoBloque?.orden || sourceItem.bloque_orden || index + 1
        return {
          sourceItem,
          blockOrder,
          horaEntradaProgramada: sourceItem.hora_entrada_programada || turnoBloque?.hora_entrada || null,
          horaSalidaProgramada: sourceItem.hora_salida_programada || turnoBloque?.hora_salida || null,
          horaEntradaReal: sourceItem.bloque_orden === blockOrder ? sourceItem.hora_entrada_real : null,
          horaSalidaReal: sourceItem.bloque_orden === blockOrder ? sourceItem.hora_salida_real : null,
        }
      })

      materializedItems.forEach((item, index) => {
        const nextBlock = materializedItems[index + 1] || null
        const scheduledMinutes = diffMinutes(item.horaEntradaProgramada, item.horaSalidaProgramada)
        const workedMinutes = diffMinutes(item.horaEntradaReal, item.horaSalidaReal)
        const refrigerioMinutes = nextBlock ? diffMinutes(item.horaSalidaProgramada, nextBlock.horaEntradaProgramada) : 0
        const refrigerioTomado = nextBlock ? diffMinutes(item.horaSalidaReal, nextBlock.horaEntradaReal) : 0
        const tardanzaRef = nextBlock ? positiveMinutes(nextBlock.horaEntradaReal, nextBlock.horaEntradaProgramada) : 0
        const tardanzaMinutos = positiveMinutes(item.horaEntradaReal, item.horaEntradaProgramada)
        const tardanza = tardanzaMinutos > 5 ? "Si" : "0"
        const entradaTemprano = earlyMinutes(item.horaEntradaProgramada, item.horaEntradaReal)
        const salidaTemprano = earlyMinutes(item.horaSalidaProgramada, item.horaSalidaReal)
        const horasExtrasMinutes = Math.max(workedMinutes - scheduledMinutes, 0)
        const isNightBlock = (() => {
          const start = parseMinutes(item.horaEntradaProgramada)
          const end = parseMinutes(item.horaSalidaProgramada)
          if (start === null || end === null) return false
          return start >= 22 * 60 || end <= 6 * 60 || end < start
        })()
        const dayName = dayNames[new Date(`${fecha}T00:00:00`).getDay()] || "-"

        resolvedRows.push({
          id: item.sourceItem.id === dayItems[0].id && item.sourceItem.bloque_orden !== item.blockOrder ? `${item.sourceItem.id}-${item.blockOrder}` : item.sourceItem.id,
          personalId: reporte?.personal || null,
          bloqueOrden: item.blockOrder,
          fechaIso: fecha,
          nombres: personal?.nombres_completos || "-",
          turno: turno?.nombre || "-",
          horario: timeRangeLabel(item.horaEntradaProgramada, item.horaSalidaProgramada),
          dia: dayName,
          fecha: formatShortDate(fecha),
          hEnt: formatTime(item.horaEntradaProgramada),
          hSal: formatTime(item.horaSalidaProgramada),
          mEnt: formatTime(item.horaEntradaReal),
          mSal: formatTime(item.horaSalidaReal),
          tRefrigerio: refrigerioMinutes,
          salRefrigerio: nextBlock ? formatTime(item.horaSalidaReal) : "-",
          entRef: nextBlock ? formatTime(nextBlock.horaEntradaReal) : "-",
          refTomado: refrigerioTomado,
          tardRef: tardanzaRef,
          tardanza,
          eTemprano: entradaTemprano,
          conGoce: item.sourceItem.estado_dia === "JUSTIFICADO" ? 1 : 0,
          sinGoce: item.sourceItem.estado_dia === "FALTA" ? 1 : 0,
          sTemprano: salidaTemprano,
          hDiurnas: isNightBlock ? "0.00" : minutesToHours(Math.min(workedMinutes, scheduledMinutes)),
          hNocturnas: isNightBlock ? minutesToHours(Math.min(workedMinutes, scheduledMinutes)) : "0.00",
          hExtras: minutesToHours(horasExtrasMinutes),
          hExtrasRedondeo: minutesToHours(horasExtrasMinutes),
          hECompensar: "0.00",
          hEPagar: minutesToHours(horasExtrasMinutes),
          p25: "0.00",
          p35: "0.00",
          hed: isNightBlock ? "0.00" : minutesToHours(horasExtrasMinutes),
          p25Hed: "0.00",
          p35Hed: "0.00",
          hen: isNightBlock ? minutesToHours(horasExtrasMinutes) : "0.00",
          p25Hen: "0.00",
          p35Hen: "0.00",
          p100: "0.00",
          tLaborables: minutesToHours(scheduledMinutes),
          tTrabajado: minutesToHours(workedMinutes),
          hCompensado: "0.00",
          falta: item.sourceItem.estado_dia === "FALTA" ? 1 : 0,
          just: item.sourceItem.estado_dia === "JUSTIFICADO" ? 1 : 0,
          feriado: item.sourceItem.estado_dia === "FERIADO" ? 1 : 0,
        })
      })
    }

    return resolvedRows.sort((a, b) => {
      if (a.fechaIso !== b.fechaIso) return a.fechaIso.localeCompare(b.fechaIso)
      if (a.personalId !== b.personalId) return (a.personalId || 0) - (b.personalId || 0)
      return a.bloqueOrden - b.bloqueOrden
    })
  }, [dias, visibleReportIds, reporteMap, personalMap, asignaciones, turnoMap, bloquesByTurno])

  const filteredRows = useMemo(() => {
    return rows
      .filter((item) => {
        if (selectedPersonalId && item.personalId !== selectedPersonalId) return false
        if (fechaInicio && item.fechaIso < fechaInicio) return false
        if (fechaFin && item.fechaIso > fechaFin) return false
        return true
      })
      .sort((a, b) => {
        if (a.nombres !== b.nombres) return a.nombres.localeCompare(b.nombres)
        if (a.fechaIso !== b.fechaIso) return a.fechaIso.localeCompare(b.fechaIso)
        return a.bloqueOrden - b.bloqueOrden
      })
  }, [rows, selectedPersonalId, fechaInicio, fechaFin])

  const selectedPersonal = useMemo(
    () => (selectedPersonalId ? personales.find((item) => item.id === selectedPersonalId) || null : null),
    [personales, selectedPersonalId]
  )

  const selectedLabel = selectedPersonal
    ? `${selectedPersonal.numero_documento} - ${selectedPersonal.nombres_completos}`
    : "Todos los trabajadores"

  const emptyMessage = selectedPersonalId
    ? "No hay asistencia procesada para ese trabajador en ese rango de fechas."
    : "No hay asistencia procesada para ese rango de fechas."

  const modalPersonales = useMemo(() => {
    const term = personalSearch.trim().toLowerCase()
    if (!term) return personales
    return personales.filter((item) => `${item.numero_documento} ${item.nombres_completos}`.toLowerCase().includes(term))
  }, [personales, personalSearch])

  const exportHeaders = [
    "Nombres Completos",
    "Turno",
    "Horario",
    "Dia",
    "Fecha",
    "H.Ent.",
    "H.Sal.",
    "M.Ent.",
    "M.Sal.",
    "E.Temprano",
    "Tardanza",
    "T.Refrigerio",
    "Sal.Refrigerio",
    "Ent.Ref.",
    "Ref.Tomado",
    "Tard. Ref.",
    "Con Goce",
    "Sin Goce",
    "S. Temprano",
    "H.Diurnas",
    "H.Nocturnas",
    "H.Extras",
    "H.Extras Redondeo",
    "H.E.Compensar",
    "H.E.Pagar",
    "25%",
    "35%",
    "HED",
    "25%HED",
    "35%HED",
    "HEN",
    "25%HEN",
    "35%HEN",
    "100%",
    "T.Laborables",
    "T.Trabajado",
    "H.Compensado",
    "Falta",
    "Just.",
    "Feriado",
  ]

  const exportRows = filteredRows.map((item) => [
    item.nombres,
    item.turno,
    item.horario,
    item.dia,
    item.fecha,
    item.hEnt,
    item.hSal,
    item.mEnt,
    item.mSal,
    String(item.eTemprano),
    item.tardanza,
    String(item.tRefrigerio),
    item.salRefrigerio,
    item.entRef,
    String(item.refTomado),
    String(item.tardRef),
    String(item.conGoce),
    String(item.sinGoce),
    String(item.sTemprano),
    item.hDiurnas,
    item.hNocturnas,
    item.hExtras,
    item.hExtrasRedondeo,
    item.hECompensar,
    item.hEPagar,
    item.p25,
    item.p35,
    item.hed,
    item.p25Hed,
    item.p35Hed,
    item.hen,
    item.p25Hen,
    item.p35Hen,
    item.p100,
    item.tLaborables,
    item.tTrabajado,
    item.hCompensado,
    String(item.falta),
    String(item.just),
    String(item.feriado),
  ])

  const handleExportExcel = () => {
    const lines = [
      exportHeaders.map((item) => `"${item}"`).join(","),
      ...exportRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ]
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `consultar-asistencia-${fechaInicio}-${fechaFin}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPdf = () => {
    const htmlRows = exportRows
      .map(
        (row) => `
          <tr>${row.map((cell) => `<td>${String(cell)}</td>`).join("")}</tr>
        `
      )
      .join("")

    const win = window.open("", "_blank", "width=1400,height=900")
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>Consultar asistencia ${fechaInicio} a ${fechaFin}</title>
          <style>
            @page { size: A4 landscape; margin: 8mm; }
            body { font-family: "Segoe UI", Tahoma, sans-serif; padding: 12px; color: #0f172a; }
            h1 { margin: 0 0 6px; font-size: 22px; }
            p { margin: 0 0 12px; color: #475569; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #cbd5e1; padding: 4px 6px; font-size: 9px; white-space: nowrap; }
            th { background: #0f766e; color: white; text-align: left; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>Consultar asistencia</h1>
          <p>Periodo: ${fechaInicio} a ${fechaFin} | Registros: ${exportRows.length}</p>
          <table>
            <thead>
              <tr>${exportHeaders.map((item) => `<th>${item}</th>`).join("")}</tr>
            </thead>
            <tbody>${htmlRows}</tbody>
          </table>
          <script>window.onload = function () { window.print(); };</script>
        </body>
      </html>
    `)
    win.document.close()
  }

  if (!token) return <section className="p-6 text-sm text-slate-600">Inicia sesion para continuar.</section>

  return (
    <section className="min-h-[calc(100vh-7rem)] bg-[radial-gradient(circle_at_top_right,#dcfce7_0%,#f8fafc_45%,#eef2ff_100%)] p-3 md:p-6">
      <div className="mx-auto w-full max-w-[1800px] space-y-5">
        <header className="rounded-2xl border border-white/50 bg-white p-5 shadow-lg md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                <FileSearch size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-800 md:text-3xl">Consultar asistencia</h1>
                <p className="text-sm text-slate-500">Revisa la asistencia procesada de cada trabajador por rango de fechas.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
              >
                <Download size={16} />
                Exportar PDF
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-emerald-700"
              >
                <Download size={16} />
                Exportar Excel
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Fecha inicio</label>
            <input
              type="date"
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Fecha fin</label>
            <input
              type="date"
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Trabajador</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPersonalModalOpen(true)}
                className="flex h-10 flex-1 items-center justify-between rounded-md border border-input bg-transparent px-3 text-sm text-left text-slate-700"
              >
                <span className="truncate">{selectedLabel}</span>
                <Search size={16} className="shrink-0 text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedPersonalId(null)}
                className="h-10 rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Todos
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Mostrando {filteredRows.length} registro{filteredRows.length === 1 ? "" : "s"} entre {formatShortDate(fechaInicio)} y {formatShortDate(fechaFin)}.
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="max-h-[620px] overflow-auto">
            <table className="w-full min-w-[3200px]">
              <thead className="sticky top-0 z-10 bg-teal-700 text-white">
                <tr className="text-xs">
                  <th className="px-3 py-3 text-left font-semibold">Nombres Completos</th>
                  <th className="px-3 py-3 text-left font-semibold">Turno</th>
                  <th className="px-3 py-3 text-left font-semibold">Horario</th>
                  <th className="px-3 py-3 text-left font-semibold">Dia</th>
                  <th className="px-3 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-3 py-3 text-center font-semibold">H.Ent.</th>
                  <th className="px-3 py-3 text-center font-semibold">H.Sal.</th>
                  <th className="px-3 py-3 text-center font-semibold">M.Ent.</th>
                  <th className="px-3 py-3 text-center font-semibold">M.Sal.</th>
                  <th className="px-3 py-3 text-center font-semibold">E.Temprano</th>
                  <th className="px-3 py-3 text-center font-semibold">Tardanza</th>
                  <th className="px-3 py-3 text-center font-semibold">T.Refrigerio</th>
                  <th className="px-3 py-3 text-center font-semibold">Sal.Refrigerio</th>
                  <th className="px-3 py-3 text-center font-semibold">Ent.Ref.</th>
                  <th className="px-3 py-3 text-center font-semibold">Ref.Tomado</th>
                  <th className="px-3 py-3 text-center font-semibold">Tard. Ref.</th>
                  <th className="px-3 py-3 text-center font-semibold">Con Goce</th>
                  <th className="px-3 py-3 text-center font-semibold">Sin Goce</th>
                  <th className="px-3 py-3 text-center font-semibold">S. Temprano</th>
                  <th className="px-3 py-3 text-center font-semibold">H.Diurnas</th>
                  <th className="px-3 py-3 text-center font-semibold">H.Nocturnas</th>
                  <th className="px-3 py-3 text-center font-semibold">H.Extras</th>
                  <th className="px-3 py-3 text-center font-semibold">H.Extras Redondeo</th>
                  <th className="px-3 py-3 text-center font-semibold">H.E.Compensar</th>
                  <th className="px-3 py-3 text-center font-semibold">H.E.Pagar</th>
                  <th className="px-3 py-3 text-center font-semibold">25%</th>
                  <th className="px-3 py-3 text-center font-semibold">35%</th>
                  <th className="px-3 py-3 text-center font-semibold">HED</th>
                  <th className="px-3 py-3 text-center font-semibold">25%HED</th>
                  <th className="px-3 py-3 text-center font-semibold">35%HED</th>
                  <th className="px-3 py-3 text-center font-semibold">HEN</th>
                  <th className="px-3 py-3 text-center font-semibold">25%HEN</th>
                  <th className="px-3 py-3 text-center font-semibold">35%HEN</th>
                  <th className="px-3 py-3 text-center font-semibold">100%</th>
                  <th className="px-3 py-3 text-center font-semibold">T.Laborables</th>
                  <th className="px-3 py-3 text-center font-semibold">T.Trabajado</th>
                  <th className="px-3 py-3 text-center font-semibold">H.Compensado</th>
                  <th className="px-3 py-3 text-center font-semibold">Falta</th>
                  <th className="px-3 py-3 text-center font-semibold">Just.</th>
                  <th className="px-3 py-3 text-center font-semibold">Feriado</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={40} className="border-t border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                      Cargando asistencia...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={40} className="border-t border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="border-t border-slate-200 px-3 py-3 text-slate-700">{item.nombres}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-slate-700">{item.turno}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-slate-700">{item.horario}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-slate-700">{item.dia}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-slate-700">{item.fecha}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-blue-700">{item.hEnt}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-blue-700">{item.hSal}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.mEnt}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.mSal}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.eTemprano}</td>
                      <td className={`border-t border-slate-200 px-3 py-3 text-center ${item.tardanza === "Si" ? "font-semibold text-rose-700" : "text-slate-700"}`}>{item.tardanza}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.tRefrigerio}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.salRefrigerio}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.entRef}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.refTomado}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-amber-700">{item.tardRef}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.conGoce}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.sinGoce}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.sTemprano}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.hDiurnas}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.hNocturnas}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.hExtras}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.hExtrasRedondeo}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.hECompensar}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.hEPagar}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.p25}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.p35}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.hed}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.p25Hed}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.p35Hed}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.hen}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.p25Hen}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.p35Hen}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.p100}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.tLaborables}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.tTrabajado}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.hCompensado}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center font-semibold text-rose-700">{item.falta}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.just}</td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-slate-700">{item.feriado}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isPersonalModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Seleccionar trabajador</h2>
                <p className="text-sm text-slate-500">Busca por DNI o nombre y selecciona un trabajador.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPersonalModalOpen(false)}
                className="rounded-md px-2 py-1 text-slate-500 transition hover:bg-slate-100"
              >
                X
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  className="h-10 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm"
                  value={personalSearch}
                  onChange={(e) => setPersonalSearch(e.target.value)}
                  placeholder="Buscar por DNI o nombre"
                />
              </div>
              <div className="max-h-[420px] overflow-auto rounded-xl border border-slate-200">
                <table className="w-full">
                  <thead className="sticky top-0 bg-teal-700 text-white">
                    <tr className="text-xs">
                      <th className="px-3 py-3 text-left font-semibold">Documento</th>
                      <th className="px-3 py-3 text-left font-semibold">Nombres completos</th>
                      <th className="px-3 py-3 text-center font-semibold">Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalPersonales.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                          No se encontraron trabajadores.
                        </td>
                      </tr>
                    ) : (
                      modalPersonales.map((item, index) => (
                        <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="border-t border-slate-200 px-3 py-3 text-slate-700">{item.numero_documento}</td>
                          <td className="border-t border-slate-200 px-3 py-3 text-slate-700">{item.nombres_completos}</td>
                          <td className="border-t border-slate-200 px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPersonalId(item.id)
                                setIsPersonalModalOpen(false)
                              }}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700"
                            >
                              Seleccionar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPersonalId(null)
                    setIsPersonalModalOpen(false)
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={() => setIsPersonalModalOpen(false)}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

