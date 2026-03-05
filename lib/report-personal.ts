export type ReporteGeneralPayload = {
  personal: {
    id: number
    codigo_empleado: string
    numero_documento: string
    nombres_completos: string
    empresa?: {
      razon_social?: string
      ruc?: string
    }
    sucursal_nombre?: string
    area_nombre?: string
    tipo_trabajador_codigo?: string
    tipo_trabajador?: string
    categoria?: string
    cargo?: string
  }
  periodo: {
    anio: number
    mes: number
    fecha_inicio: string
    fecha_fin: string
    etiqueta: string
    etiqueta_corta: string
  }
  reporte: {
    id: number
    sueldo_base: string
    total_ingresos: string
    total_descuentos: string
    neto_pagar: string
    total_dias_periodo: number
    total_dias_laborados: number
    total_dias_falta: number
    total_dias_justificados: number
    total_dias_descanso_medico: number
    total_minutos_tardanza: number
    total_horas_trabajadas: string
    total_horas_extra: string
    estado: string
  }
  dias: {
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
  }[]
  conceptos: {
    tipo: string
    codigo: string
    concepto: string
    monto: string
    orden: number
  }[]
  incidencias: {
    tipo: string
    fecha_inicio: string
    fecha_fin: string
    cantidad_dias: number
    cantidad_minutos: number
    descripcion: string
    observacion: string
  }[]
}

const moneyFormatter = new Intl.NumberFormat("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function text(value: unknown, fallback = "-") {
  if (value === null || value === undefined) return fallback
  const out = String(value).trim()
  return out || fallback
}

function money(value: unknown) {
  const amount = Number(value || 0)
  return moneyFormatter.format(Number.isFinite(amount) ? amount : 0)
}

function shortDate(value: string) {
  const [year, month, day] = value.split("-")
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function shortTime(value: string | null) {
  if (!value) return "-"
  return value.slice(0, 5)
}

function renderRows<T>(items: T[], emptyLabel: string, renderer: (item: T, index: number) => string) {
  if (!items.length) {
    return `<tr><td colspan="99" class="empty">${escapeHtml(emptyLabel)}</td></tr>`
  }
  return items.map(renderer).join("")
}

export function buildPersonalReportHtml(payload: ReporteGeneralPayload, options?: { autoPrint?: boolean }) {
  const autoPrint = Boolean(options?.autoPrint)
  const empresa = payload.personal.empresa || {}

  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Reporte ${escapeHtml(text(payload.personal.numero_documento))}</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 20px; background: #eef2f7; color: #0f172a; font-family: "Segoe UI", Tahoma, sans-serif; }
          .sheet { max-width: 1100px; margin: 0 auto; background: #fff; border: 1px solid #cbd5e1; padding: 20px; }
          .hero { border: 1px solid #0f766e; background: linear-gradient(135deg, #ecfeff, #f0fdf4); padding: 16px; }
          .hero h1 { margin: 0; font-size: 24px; }
          .hero p { margin: 6px 0 0; font-size: 13px; color: #334155; }
          .grid { display: grid; gap: 12px; margin-top: 14px; }
          .grid.cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .grid.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .card { border: 1px solid #cbd5e1; background: #f8fafc; padding: 12px; }
          .card .k { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; }
          .card .v { margin-top: 6px; font-size: 22px; font-weight: 700; }
          .section { margin-top: 16px; }
          .section h2 { margin: 0 0 8px; font-size: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 12px; text-align: left; vertical-align: top; }
          thead th { background: #0f766e; color: #fff; }
          .subhead { background: #d1fae5; font-weight: 700; }
          .empty { text-align: center; color: #64748b; }
          .right { text-align: right; }
          @media print {
            body { background: #fff; padding: 0; }
            .sheet { max-width: none; border: 0; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="hero">
            <h1>Reporte General de Personal</h1>
            <p>${escapeHtml(text(empresa.razon_social))} | RUC: ${escapeHtml(text(empresa.ruc))} | Periodo: ${escapeHtml(text(payload.periodo.etiqueta))}</p>
          </div>

          <div class="grid cols-4">
            <div class="card"><div class="k">Trabajador</div><div class="v" style="font-size:16px;">${escapeHtml(text(payload.personal.nombres_completos))}</div></div>
            <div class="card"><div class="k">Documento</div><div class="v" style="font-size:16px;">${escapeHtml(text(payload.personal.numero_documento))}</div></div>
            <div class="card"><div class="k">Codigo</div><div class="v" style="font-size:16px;">${escapeHtml(text(payload.personal.codigo_empleado))}</div></div>
            <div class="card"><div class="k">Tipo</div><div class="v" style="font-size:16px;">${escapeHtml(text(payload.personal.tipo_trabajador_codigo || payload.personal.tipo_trabajador))}</div></div>
          </div>

          <div class="grid cols-4">
            <div class="card"><div class="k">Dias laborados</div><div class="v">${payload.reporte.total_dias_laborados}</div></div>
            <div class="card"><div class="k">Faltas</div><div class="v">${payload.reporte.total_dias_falta}</div></div>
            <div class="card"><div class="k">Horas trabajadas</div><div class="v">${escapeHtml(text(payload.reporte.total_horas_trabajadas, "0.00"))}</div></div>
            <div class="card"><div class="k">Neto a pagar</div><div class="v">S/ ${escapeHtml(money(payload.reporte.neto_pagar))}</div></div>
          </div>

          <div class="section">
            <h2>Datos laborales</h2>
            <table>
              <tbody>
                <tr>
                  <td class="subhead">Sucursal</td><td>${escapeHtml(text(payload.personal.sucursal_nombre))}</td>
                  <td class="subhead">Area</td><td>${escapeHtml(text(payload.personal.area_nombre))}</td>
                </tr>
                <tr>
                  <td class="subhead">Cargo</td><td>${escapeHtml(text(payload.personal.cargo))}</td>
                  <td class="subhead">Categoria</td><td>${escapeHtml(text(payload.personal.categoria))}</td>
                </tr>
                <tr>
                  <td class="subhead">Estado reporte</td><td>${escapeHtml(text(payload.reporte.estado))}</td>
                  <td class="subhead">Periodo</td><td>${escapeHtml(text(payload.periodo.etiqueta_corta))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Detalle diario</h2>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Bloque</th>
                  <th>Estado</th>
                  <th>Horario Entrada</th>
                  <th>Horario Salida</th>
                  <th>Marca Entrada</th>
                  <th>Marca Salida</th>
                  <th>Tardanza (min)</th>
                  <th>Horas</th>
                  <th>Extra</th>
                </tr>
              </thead>
              <tbody>
                ${renderRows(payload.dias, "Sin detalle diario.", (item) => `
                  <tr>
                    <td>${escapeHtml(shortDate(item.fecha))}</td>
                    <td class="right">${item.bloque_orden}</td>
                    <td>${escapeHtml(text(item.estado_dia))}</td>
                    <td>${escapeHtml(shortTime(item.hora_entrada_programada))}</td>
                    <td>${escapeHtml(shortTime(item.hora_salida_programada))}</td>
                    <td>${escapeHtml(shortTime(item.hora_entrada_real))}</td>
                    <td>${escapeHtml(shortTime(item.hora_salida_real))}</td>
                    <td class="right">${item.minutos_tardanza}</td>
                    <td class="right">${escapeHtml(text(item.horas_trabajadas, "0.00"))}</td>
                    <td class="right">${escapeHtml(text(item.horas_extra, "0.00"))}</td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Conceptos</h2>
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Codigo</th>
                  <th>Concepto</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                ${renderRows(payload.conceptos, "Sin conceptos.", (item) => `
                  <tr>
                    <td>${escapeHtml(text(item.tipo))}</td>
                    <td>${escapeHtml(text(item.codigo))}</td>
                    <td>${escapeHtml(text(item.concepto))}</td>
                    <td class="right">S/ ${escapeHtml(money(item.monto))}</td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Incidencias</h2>
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Dias</th>
                  <th>Minutos</th>
                  <th>Descripcion</th>
                  <th>Observacion</th>
                </tr>
              </thead>
              <tbody>
                ${renderRows(payload.incidencias, "Sin incidencias.", (item) => `
                  <tr>
                    <td>${escapeHtml(text(item.tipo))}</td>
                    <td>${escapeHtml(shortDate(item.fecha_inicio))}</td>
                    <td>${escapeHtml(shortDate(item.fecha_fin))}</td>
                    <td class="right">${item.cantidad_dias}</td>
                    <td class="right">${item.cantidad_minutos}</td>
                    <td>${escapeHtml(text(item.descripcion))}</td>
                    <td>${escapeHtml(text(item.observacion, ""))}</td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        </div>
        ${autoPrint ? '<script>window.onload = function () { window.print(); };</script>' : ""}
      </body>
    </html>
  `
}

export function openPersonalReportPrint(payload: ReporteGeneralPayload) {
  const win = window.open("", "_blank", "width=1200,height=900")
  if (!win) return false
  win.document.write(buildPersonalReportHtml(payload, { autoPrint: true }))
  win.document.close()
  return true
}
