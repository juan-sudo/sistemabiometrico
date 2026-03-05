export type PayrollSlipLine = {
  codigo: string
  concepto: string
  monto: string
}

export type PayrollSlipPayload = {
  personal: {
    id: number
    codigo_empleado: string
    numero_documento: string
    nombres_completos: string
    empresa?: {
      id?: number
      razon_social?: string
      ruc?: string
    }
    sucursal_nombre?: string
    area_nombre?: string
    tipo_documento?: string
    tipo_trabajador_codigo?: string
    tipo_trabajador?: string
    categoria_codigo?: string
    categoria?: string
    cargo?: string
    fecha_ingreso?: string
  }
  periodo: {
    anio: number
    mes: number
    etiqueta?: string
    etiqueta_corta?: string
  }
  boleta: {
    sueldo_base: string
    total_ingresos: string
    total_descuentos: string
    neto_pagar: string
    estado: string
  }
  boleta_detalle: {
    periodo_texto: string
    periodo_corto: string
    numero_orden: string
    documento_identidad: {
      tipo: string
      numero: string
    }
    laboral: {
      fecha_ingreso: string
      tipo_trabajador: string
      regimen_pensionario: string
      cuspp: string
      situacion: string
    }
    asistencia: {
      dias_laborados: number
      dias_no_laborados: number
      dias_subsidiados: number
      condicion: string
      total_horas: number
      total_minutos: number
      sobretiempo_horas: number
      sobretiempo_minutos: number
    }
    suspension_laboral: {
      tipo: string
      motivo: string
      dias: number
    }
    otros_empleadores: string
    conceptos: {
      ingresos: PayrollSlipLine[]
      descuentos: PayrollSlipLine[]
      aportes_trabajador: PayrollSlipLine[]
      aportes_empleador: PayrollSlipLine[]
    }
  }
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

function asText(value: unknown, fallback = "") {
  if (value === null || value === undefined) return fallback
  const text = String(value).trim()
  return text || fallback
}

function asMoney(value: unknown) {
  const amount = Number(value || 0)
  const safe = Number.isFinite(amount) ? amount : 0
  return moneyFormatter.format(safe)
}

function asDate(value: string) {
  if (!value) return "-"
  const [year, month, day] = value.split("-")
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function renderConceptRows(items: PayrollSlipLine[], emptyLabel: string) {
  if (!items.length) {
    return `
      <tr>
        <td class="code">-</td>
        <td class="label">${escapeHtml(emptyLabel)}</td>
        <td class="amount">0.00</td>
      </tr>
    `
  }

  return items
    .map(
      (item) => `
        <tr>
          <td class="code">${escapeHtml(asText(item.codigo, "-"))}</td>
          <td class="label">${escapeHtml(asText(item.concepto, "-"))}</td>
          <td class="amount">${escapeHtml(asMoney(item.monto))}</td>
        </tr>
      `
    )
    .join("")
}

function renderConceptBlock(title: string, items: PayrollSlipLine[], emptyLabel: string) {
  return `
    <tr class="group-row">
      <td colspan="3">${escapeHtml(title)}</td>
    </tr>
    ${renderConceptRows(items, emptyLabel)}
  `
}

export function buildPayrollSlipHtml(payload: PayrollSlipPayload, options?: { autoPrint?: boolean }) {
  const autoPrint = Boolean(options?.autoPrint)
  const detail = payload.boleta_detalle
  const empresa = payload.personal.empresa || {}

  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Boleta ${escapeHtml(asText(payload.personal.numero_documento))}</title>
        <style>
          :root {
            color-scheme: light;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 18px;
            background: #f3f4f6;
            color: #111827;
            font-family: "Segoe UI", Tahoma, sans-serif;
          }

          .sheet {
            max-width: 860px;
            margin: 0 auto;
            border: 1px solid #4b5563;
            background: #ffffff;
            padding: 14px;
          }

          .header-box,
          .section {
            width: 100%;
            border: 1px solid #4b5563;
            border-collapse: collapse;
            margin-bottom: 12px;
          }

          .header-box td,
          .section td,
          .section th {
            border: 1px solid #4b5563;
            padding: 3px 6px;
            font-size: 12px;
            line-height: 1.2;
            vertical-align: middle;
          }

          .header-box td {
            border: 0;
            padding: 2px 4px;
          }

          .header-box {
            background: #d1d5db;
          }

          .section .head,
          .section th {
            background: #d1d5db;
            font-weight: 700;
          }

          .label-center {
            text-align: center;
          }

          .label-right {
            text-align: right;
          }

          .strong {
            font-weight: 700;
          }

          .concept-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
          }

          .concept-table td,
          .concept-table th {
            border: 1px solid #4b5563;
            padding: 3px 6px;
            font-size: 12px;
          }

          .concept-table thead th {
            background: #d1d5db;
            font-weight: 700;
            text-align: left;
          }

          .group-row td {
            background: #e5e7eb;
            font-weight: 700;
          }

          .code {
            width: 90px;
            white-space: nowrap;
          }

          .label {
            width: auto;
          }

          .amount {
            width: 120px;
            text-align: right;
            white-space: nowrap;
          }

          .totals td {
            background: #e5e7eb;
            font-weight: 700;
          }

          .footer-note {
            font-size: 11px;
            color: #374151;
          }

          @media print {
            body {
              background: #ffffff;
              padding: 0;
            }

            .sheet {
              border: 0;
              max-width: none;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <table class="header-box">
            <tr><td><span class="strong">RUC :</span> ${escapeHtml(asText(empresa.ruc, "-"))}</td></tr>
            <tr><td><span class="strong">Empleador :</span> ${escapeHtml(asText(empresa.razon_social, "-"))}</td></tr>
            <tr><td><span class="strong">Periodo :</span> ${escapeHtml(asText(detail.periodo_corto, `${payload.periodo.mes}/${payload.periodo.anio}`))}</td></tr>
            <tr><td><span class="strong">PDT Planilla Electronica - PLAME</span><span style="display:inline-block; margin-left: 36px;"><span class="strong">Numero de Orden :</span> ${escapeHtml(asText(detail.numero_orden, "-"))}</span></td></tr>
          </table>

          <table class="section">
            <tr>
              <td class="head" colspan="2">Documento de Identidad</td>
              <td class="head label-center">Nombre y Apellidos</td>
              <td class="head label-center">Situacion</td>
            </tr>
            <tr>
              <td class="label-center">Tipo</td>
              <td class="label-center">Numero</td>
              <td rowspan="2" class="label-center">${escapeHtml(asText(payload.personal.nombres_completos, "-"))}</td>
              <td rowspan="2" class="label-center">${escapeHtml(asText(detail.laboral.situacion, "-"))}</td>
            </tr>
            <tr>
              <td class="label-center">${escapeHtml(asText(detail.documento_identidad.tipo, "-"))}</td>
              <td class="label-center">${escapeHtml(asText(detail.documento_identidad.numero, "-"))}</td>
            </tr>
          </table>

          <table class="section">
            <tr>
              <td class="head label-center">Fecha de Ingreso</td>
              <td class="head label-center">Tipo de Trabajador</td>
              <td class="head label-center">Regimen Pensionario</td>
              <td class="head label-center">CUSPP</td>
            </tr>
            <tr>
              <td class="label-center">${escapeHtml(asDate(asText(detail.laboral.fecha_ingreso)))}</td>
              <td class="label-center">${escapeHtml(asText(detail.laboral.tipo_trabajador, "-"))}</td>
              <td class="label-center">${escapeHtml(asText(detail.laboral.regimen_pensionario, "-"))}</td>
              <td class="label-center">${escapeHtml(asText(detail.laboral.cuspp, "-"))}</td>
            </tr>
          </table>

          <table class="section">
            <tr>
              <td class="head label-center">Dias Laborados</td>
              <td class="head label-center">Dias No Laborados</td>
              <td class="head label-center">Dias subsidiados</td>
              <td class="head label-center">Condicion</td>
              <td class="head label-center">Total Horas</td>
              <td class="head label-center">Minutos</td>
              <td class="head label-center">Sobretiempo Horas</td>
              <td class="head label-center">Minutos</td>
            </tr>
            <tr>
              <td class="label-center">${detail.asistencia.dias_laborados}</td>
              <td class="label-center">${detail.asistencia.dias_no_laborados}</td>
              <td class="label-center">${detail.asistencia.dias_subsidiados}</td>
              <td class="label-center">${escapeHtml(asText(detail.asistencia.condicion, "-"))}</td>
              <td class="label-center">${detail.asistencia.total_horas}</td>
              <td class="label-center">${detail.asistencia.total_minutos}</td>
              <td class="label-center">${detail.asistencia.sobretiempo_horas}</td>
              <td class="label-center">${detail.asistencia.sobretiempo_minutos}</td>
            </tr>
          </table>

          <table class="section">
            <tr>
              <td class="head label-center" colspan="3">Motivo de Suspension de Labores</td>
              <td class="head label-center">Otros empleadores por Rentas de 5ta categoria</td>
            </tr>
            <tr>
              <td class="label-center" style="width: 120px;">Tipo</td>
              <td class="label-center">Motivo</td>
              <td class="label-center" style="width: 90px;">N. Dias</td>
              <td class="label-center" rowspan="2">${escapeHtml(asText(detail.otros_empleadores, "No tiene"))}</td>
            </tr>
            <tr>
              <td class="label-center">${escapeHtml(asText(detail.suspension_laboral.tipo, "-"))}</td>
              <td class="label-center">${escapeHtml(asText(detail.suspension_laboral.motivo, "-"))}</td>
              <td class="label-center">${detail.suspension_laboral.dias}</td>
            </tr>
          </table>

          <table class="concept-table">
            <thead>
              <tr>
                <th class="code">Codigo</th>
                <th class="label">Conceptos</th>
                <th class="amount">Monto S/.</th>
              </tr>
            </thead>
            <tbody>
              ${renderConceptBlock("Ingresos", detail.conceptos.ingresos, "Sin ingresos")}
              ${renderConceptBlock("Descuentos", detail.conceptos.descuentos, "Sin descuentos")}
              ${renderConceptBlock("Aportes del trabajador", detail.conceptos.aportes_trabajador, "Sin aportes")}
              <tr class="totals">
                <td colspan="2">Neto a Pagar</td>
                <td class="amount">${escapeHtml(asMoney(payload.boleta.neto_pagar))}</td>
              </tr>
            </tbody>
          </table>

          <table class="concept-table">
            <thead>
              <tr>
                <th class="code">Codigo</th>
                <th class="label">Aportes de Empleador</th>
                <th class="amount">Monto S/.</th>
              </tr>
            </thead>
            <tbody>
              ${renderConceptRows(detail.conceptos.aportes_empleador, "Sin aportes")}
            </tbody>
          </table>

          <div class="footer-note">
            <strong>Area:</strong> ${escapeHtml(asText(payload.personal.area_nombre, "-"))}
            <span style="display:inline-block; margin-left: 18px;"><strong>Tipo:</strong> ${escapeHtml(asText(payload.personal.tipo_trabajador_codigo || payload.personal.tipo_trabajador, "-"))}</span>
            <span style="display:inline-block; margin-left: 18px;"><strong>Cargo:</strong> ${escapeHtml(asText(payload.personal.cargo, "-"))}</span>
            <span style="display:inline-block; margin-left: 18px;"><strong>Estado:</strong> ${escapeHtml(asText(payload.boleta.estado, "-"))}</span>
          </div>
        </div>
        ${autoPrint ? '<script>window.onload = function () { window.print(); };</script>' : ""}
      </body>
    </html>
  `
}

export function openPayrollSlipPrint(payload: PayrollSlipPayload) {
  const win = window.open("", "_blank", "width=980,height=860")
  if (!win) return false
  win.document.write(buildPayrollSlipHtml(payload, { autoPrint: true }))
  win.document.close()
  return true
}
