"use client"

import { KeyRound, Pencil, PlusCircle, Power, ShieldCheck, Trash2 } from "lucide-react"
import { type ReactNode, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { apiEndpoints, authRequest } from "@/lib/api-client"
import useUserStore from "@/stores/useUserStore"

type ModulePermission = {
  modulo: string
  puede_ver: boolean
  puede_crear: boolean
  puede_editar: boolean
  puede_eliminar: boolean
}

type UserRow = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  is_active: boolean
  is_superuser: boolean
  module_permissions: ModulePermission[]
}

type UserForm = {
  username: string
  email: string
  first_name: string
  last_name: string
  password: string
  rol: "ADMINISTRADOR" | "USUARIO"
  is_staff: boolean
  is_active: boolean
  is_superuser: boolean
  module_permissions_input: ModulePermission[]
}

const MODULES = [
  { modulo: "ESCRITORIO", label: "Escritorio" },
  { modulo: "EMPRESAS", label: "Empresas" },
  { modulo: "USUARIOS", label: "Usuarios" },
  { modulo: "SUCURSALES", label: "Sucursales" },
  { modulo: "AREAS", label: "Areas" },
  { modulo: "CARGOS", label: "Cargos" },
  { modulo: "TIPO_TRABAJADOR", label: "Tipo trabajador" },
  { modulo: "CATEGORIAS", label: "Categorias" },
  { modulo: "TURNOS", label: "Turnos" },
  { modulo: "DISPOSITIVOS", label: "Dispositivos" },
  { modulo: "DESCARGAR_MARCAS", label: "Descargar marcas" },
  { modulo: "PERSONAL", label: "Personal" },
  { modulo: "BOLETA_MENSUAL", label: "Boleta mensual" },
  { modulo: "RESUMEN_PLANILLA", label: "Resumen planilla" },
  { modulo: "MARCACIONES", label: "Marcaciones" },
  { modulo: "PROCESAR_ASISTENCIA", label: "Procesar asistencia" },
  { modulo: "CONSULTAR_ASISTENCIA", label: "Consultar asistencia" },
  { modulo: "JUSTIFICACIONES", label: "Registrar justificacion" },
  { modulo: "AUTORIZAR_JUSTIFICACION", label: "Autorizar justificacion" },
  { modulo: "DESCANSO_MEDICO", label: "Descanso medico" },
]

const buildDefaultPermissions = (): ModulePermission[] =>
  MODULES.map((item) => ({
    modulo: item.modulo,
    puede_ver: false,
    puede_crear: false,
    puede_editar: false,
    puede_eliminar: false,
  }))

const createDefaultForm = (): UserForm => ({
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  rol: "USUARIO",
  is_staff: false,
  is_active: true,
  is_superuser: false,
  module_permissions_input: buildDefaultPermissions(),
})

const asArray = (x: unknown) =>
  Array.isArray(x) ? x : x && typeof x === "object" && Array.isArray((x as { results?: unknown[] }).results) ? (x as { results: unknown[] }).results : []

export default function Page() {
  const token = useUserStore((s) => s.accessToken)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [users, setUsers] = useState<UserRow[]>([])
  const [openModal, setOpenModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<UserForm>(createDefaultForm())

  const loadUsers = async () => {
    if (!token) return
    const data = await authRequest(apiEndpoints.usuarios, { token })
    setUsers(asArray(data) as UserRow[])
  }

  useEffect(() => {
    const run = async () => {
      if (!token) return setLoading(false)
      try {
        setLoading(true)
        await loadUsers()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo cargar usuarios")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [token])

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return users
    return users.filter((item) =>
      `${item.username} ${item.email} ${item.first_name} ${item.last_name}`.toLowerCase().includes(term)
    )
  }, [users, search])

  const resetModal = () => {
    setEditingId(null)
    setForm(createDefaultForm())
    setOpenModal(false)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(createDefaultForm())
    setOpenModal(true)
  }

  const openEdit = (user: UserRow) => {
    const permissionMap = Object.fromEntries(user.module_permissions.map((item) => [item.modulo, item]))
    setEditingId(user.id)
    setForm({
      username: user.username,
      email: user.email || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      password: "",
      rol: user.is_staff || user.is_superuser ? "ADMINISTRADOR" : "USUARIO",
      is_staff: user.is_staff,
      is_active: user.is_active,
      is_superuser: user.is_superuser,
      module_permissions_input: MODULES.map((item) => ({
        modulo: item.modulo,
        puede_ver: permissionMap[item.modulo]?.puede_ver || false,
        puede_crear: permissionMap[item.modulo]?.puede_crear || false,
        puede_editar: permissionMap[item.modulo]?.puede_editar || false,
        puede_eliminar: permissionMap[item.modulo]?.puede_eliminar || false,
      })),
    })
    setOpenModal(true)
  }

  const updatePermission = (modulo: string, key: keyof ModulePermission, value: boolean) => {
    setForm((prev) => ({
      ...prev,
        module_permissions_input: prev.module_permissions_input.map((item) =>
          item.modulo === modulo ? { ...item, [key]: value } : item
        ),
      }))
  }

  const syncRole = (rol: "ADMINISTRADOR" | "USUARIO") => {
    setForm((prev) => ({
      ...prev,
      rol,
      is_staff: rol === "ADMINISTRADOR",
      is_superuser: rol === "ADMINISTRADOR" ? prev.is_superuser : false,
    }))
  }

  const handleSave = async () => {
    if (!token || !form.username.trim()) return
    try {
      setSaving(true)
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        is_staff: form.is_staff,
        is_active: form.is_active,
        is_superuser: form.is_superuser,
        ...(form.password.trim() ? { password: form.password.trim() } : {}),
        module_permissions_input: form.module_permissions_input,
      }
      if (editingId) {
        await authRequest(`${apiEndpoints.usuarios}${editingId}/`, {
          method: "PATCH",
          body: payload,
          token,
        })
        toast.success("Usuario actualizado")
      } else {
        if (!form.password.trim()) {
          toast.error("La contraseña es obligatoria para crear un usuario")
          return
        }
        await authRequest(apiEndpoints.usuarios, {
          method: "POST",
          body: payload,
          token,
        })
        toast.success("Usuario creado")
      }
      await loadUsers()
      resetModal()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar usuario")
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (user: UserRow) => {
    if (!token) return
    try {
      await authRequest(`${apiEndpoints.usuarios}${user.id}/`, {
        method: "PATCH",
        body: { is_active: !user.is_active },
        token,
      })
      await loadUsers()
      toast.success(user.is_active ? "Usuario desactivado" : "Usuario activado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar estado")
    }
  }

  const handleDelete = async (user: UserRow) => {
    if (!token) return
    try {
      await authRequest(`${apiEndpoints.usuarios}${user.id}/`, {
        method: "DELETE",
        token,
      })
      await loadUsers()
      toast.success("Usuario eliminado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar usuario")
    }
  }

  if (!token) return <section className="p-6 text-sm text-slate-600">Inicia sesion para continuar.</section>

  return (
    <section className="min-h-[calc(100vh-7rem)] bg-[radial-gradient(circle_at_top_right,#dcfce7_0%,#f8fafc_45%,#eef2ff_100%)] p-3 md:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <header className="rounded-2xl border border-white/50 bg-white/80 p-5 shadow-lg backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-800 md:text-3xl">Usuarios y permisos</h1>
                <p className="text-sm text-slate-500">Administra accesos, activacion y permisos por modulo para cada usuario.</p>
              </div>
            </div>
            <Dialog open={openModal} onOpenChange={(next) => { if (!next) resetModal(); else setOpenModal(true) }}>
              <DialogTrigger asChild>
                <Button type="button" className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
                  <PlusCircle size={16} className="mr-2" />
                  Nuevo usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100vw-1.5rem)] max-w-6xl">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Field label="Usuario">
                      <Input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
                    </Field>
                    <Field label="Correo">
                      <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                    </Field>
                    <Field label="Nombres">
                      <Input value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} />
                    </Field>
                    <Field label="Apellidos">
                      <Input value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} />
                    </Field>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Field label={editingId ? "Nueva contraseña (opcional)" : "Contraseña"}>
                      <Input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
                    </Field>
                    <Field label="Rol">
                      <select
                        className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
                        value={form.rol}
                        onChange={(e) => syncRole(e.target.value as "ADMINISTRADOR" | "USUARIO")}
                      >
                        <option value="ADMINISTRADOR">Administrador</option>
                        <option value="USUARIO">Usuario</option>
                      </select>
                    </Field>
                    <ToggleField label="Activo" checked={form.is_active} onChange={(checked) => setForm((p) => ({ ...p, is_active: checked }))} />
                    <ToggleField label="Superusuario" checked={form.is_superuser} onChange={(checked) => setForm((p) => ({ ...p, is_superuser: checked, rol: checked ? "ADMINISTRADOR" : p.rol, is_staff: checked ? true : p.is_staff }))} />
                  </div>

                  <div className="rounded-xl border border-slate-200">
                    <div className="border-b border-slate-200 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-700">Permisos por modulo</p>
                    </div>
                    <div className="max-h-[420px] overflow-auto">
                      <table className="w-full min-w-[760px]">
                        <thead className="sticky top-0 z-10 bg-teal-700 text-white">
                          <tr className="text-xs">
                            <th className="px-3 py-2 text-left font-semibold">Modulo</th>
                            <th className="w-24 px-3 py-2 text-center font-semibold">Ver</th>
                            <th className="w-24 px-3 py-2 text-center font-semibold">Crear</th>
                            <th className="w-24 px-3 py-2 text-center font-semibold">Editar</th>
                            <th className="w-24 px-3 py-2 text-center font-semibold">Eliminar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {MODULES.map((module, index) => {
                            const current = form.module_permissions_input.find((item) => item.modulo === module.modulo)
                            if (!current) return null
                            return (
                              <tr key={module.modulo} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                <td className="border-t border-slate-200 px-3 py-2 text-sm text-slate-700">{module.label}</td>
                                <PermissionCell checked={current.puede_ver} onChange={(checked) => updatePermission(module.modulo, "puede_ver", checked)} />
                                <PermissionCell checked={current.puede_crear} onChange={(checked) => updatePermission(module.modulo, "puede_crear", checked)} />
                                <PermissionCell checked={current.puede_editar} onChange={(checked) => updatePermission(module.modulo, "puede_editar", checked)} />
                                <PermissionCell checked={current.puede_eliminar} onChange={(checked) => updatePermission(module.modulo, "puede_eliminar", checked)} />
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={resetModal}>Cancelar</Button>
                    <Button type="button" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={saving}>
                      <KeyRound size={16} className="mr-2" />
                      {saving ? "Guardando..." : "Guardar usuario"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por usuario, correo o nombre"
              className="md:max-w-md"
            />
            <p className="text-sm text-slate-500">Usuarios registrados: {filteredUsers.length}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="max-h-[620px] overflow-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="sticky top-0 z-10 bg-teal-700 text-white">
                <tr className="text-sm">
                  <th className="px-4 py-3 text-left font-semibold">Usuario</th>
                  <th className="px-4 py-3 text-left font-semibold">Correo</th>
                  <th className="px-4 py-3 text-left font-semibold">Nombre completo</th>
                  <th className="w-28 px-4 py-3 text-center font-semibold">Activo</th>
                  <th className="w-28 px-4 py-3 text-center font-semibold">Staff</th>
                  <th className="w-32 px-4 py-3 text-center font-semibold">Superusuario</th>
                  <th className="w-36 px-4 py-3 text-center font-semibold">Modulos</th>
                  <th className="w-28 px-4 py-3 text-center font-semibold">Rol</th>
                  <th className="w-24 px-4 py-3 text-center font-semibold">Editar</th>
                  <th className="w-24 px-4 py-3 text-center font-semibold">Estado</th>
                  <th className="w-24 px-4 py-3 text-center font-semibold">Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="border-t border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="border-t border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                ) : filteredUsers.map((user, index) => (
                  <tr key={user.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="border-t border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">{user.username}</td>
                    <td className="border-t border-slate-200 px-4 py-3 text-sm text-slate-700">{user.email || "-"}</td>
                    <td className="border-t border-slate-200 px-4 py-3 text-sm text-slate-700">{`${user.first_name || ""} ${user.last_name || ""}`.trim() || "-"}</td>
                    <td className="border-t border-slate-200 px-4 py-3 text-center text-sm">{user.is_active ? "Si" : "No"}</td>
                    <td className="border-t border-slate-200 px-4 py-3 text-center text-sm">{user.is_staff ? "Si" : "No"}</td>
                    <td className="border-t border-slate-200 px-4 py-3 text-center text-sm">{user.is_superuser ? "Si" : "No"}</td>
                    <td className="border-t border-slate-200 px-4 py-3 text-center text-sm">{user.module_permissions.filter((item) => item.puede_ver).length}</td>
                    <td className="border-t border-slate-200 px-4 py-3 text-center text-sm">{user.is_staff || user.is_superuser ? "Administrador" : "Usuario"}</td>
                    <td className="border-t border-slate-200 px-4 py-3 text-center">
                      <button
                        type="button"
                        className="inline-flex rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-600 transition hover:bg-amber-100"
                        onClick={() => openEdit(user)}
                      >
                        <Pencil size={16} />
                      </button>
                    </td>
                    <td className="border-t border-slate-200 px-4 py-3 text-center">
                      <button
                        type="button"
                        className={`inline-flex rounded-lg border p-2 transition ${
                          user.is_active
                            ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        }`}
                        onClick={() => toggleActive(user)}
                      >
                        <Power size={16} />
                      </button>
                    </td>
                    <td className="border-t border-slate-200 px-4 py-3 text-center">
                      <button
                        type="button"
                        className="inline-flex rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100"
                        onClick={() => handleDelete(user)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  )
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`flex h-10 w-full items-center rounded-md border px-3 text-sm ${
          checked ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"
        }`}
      >
        {checked ? "Si" : "No"}
      </button>
    </div>
  )
}

function PermissionCell({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <td className="border-t border-slate-200 px-3 py-2 text-center">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </td>
  )
}

