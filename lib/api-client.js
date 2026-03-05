const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "")

export function getApiBase() {
  return API_BASE
}

function createApiError(message, status) {
  const error = new Error(message)
  error.status = status
  return error
}

export async function loginRequest(username, password) {
  const response = await fetch(`${API_BASE}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw createApiError(data.detail || "No se pudo iniciar sesion.", response.status)
  }
  return data
}

/**
 * @typedef {Object} AuthRequestOptions
 * @property {string} [method]
 * @property {unknown} [body]
 * @property {string | null} [token]
 */

/**
 * @param {string} path
 * @param {AuthRequestOptions} [options]
 */
export async function authRequest(path, options = {}) {
  const { method = "GET", body, token } = options
  /** @type {Record<string, string>} */
  const headers = { "Content-Type": "application/json" }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw createApiError(data.detail || "Error de API.", response.status)
  }

  return response.json().catch(() => ({}))
}

export const apiEndpoints = {
  usuarios: "/usuarios/",
  empresas: "/empresas/",
  sucursales: "/sucursales/",
  areas: "/areas/",
  cargos: "/cargos/",
  tiposTrabajador: "/tipos-trabajador/",
  categorias: "/categorias/",
  tiposDocumento: "/tipos-documento/",
  tiposSindicato: "/tipos-sindicato/",
  ubicacionesGeograficas: "/ubicaciones-geograficas/",
  personales: "/personales/",
  turnos: "/turnos/",
  turnoBloquesHorario: "/turno-bloques-horario/",
  personalTurnos: "/personal-turnos/",
  dispositivos: "/dispositivos/",
  descargasMarcaciones: "/descargas-marcaciones/",
  notificacionesMarcacionesFaltantes: "/descargas-marcaciones/notificaciones-faltantes/",
  marcaciones: "/marcaciones/",
  justificaciones: "/justificaciones/",
  descansosMedicos: "/descansos-medicos/",
  boletasMensuales: "/boletas-mensuales/",
  boletasConceptos: "/boletas-conceptos/",
  reportesPersonal: "/reportes-personal/",
  reportesAsistenciaDiaria: "/reportes-asistencia-diaria/",
  reportesConceptos: "/reportes-conceptos/",
  reportesIncidencias: "/reportes-incidencias/",
  usuariosAgua: "/usuarios-agua/",
  licenciasAgua: "/licencias-agua/",
}
