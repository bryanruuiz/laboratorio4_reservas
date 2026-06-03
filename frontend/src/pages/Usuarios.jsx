import { useEffect, useState } from 'react'
import {
  Loader2,
  Pencil,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  User,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  cambiarEstadoUsuario,
  editarUsuario,
  listarUsuarios,
} from '../api/usuarios'
import Alert from '../components/Alert'

const ESTADO_BADGE = {
  activo: 'bg-emerald-100 text-emerald-700',
  inactivo: 'bg-slate-200 text-slate-600',
}

const ROL_BADGE = {
  admin: 'bg-amber-100 text-amber-700',
  usuario: 'bg-brand-50 text-brand-700',
}

function EditarUsuarioModal({ usuario, esUsuarioActual, onClose, onGuardado }) {
  const [form, setForm] = useState({
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    estado: usuario.estado,
    contrasena: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (esUsuarioActual && form.estado === 'inactivo') {
      setError('No puedes inactivar tu propia cuenta')
      return
    }
    if (esUsuarioActual && form.rol !== 'admin') {
      setError('No puedes quitarte el rol de administrador desde tu propia cuenta')
      return
    }

    setSaving(true)

    // Solo se envían los campos con valor; la contraseña se omite si está vacía.
    const cambios = {
      nombre: form.nombre,
      correo: form.correo,
      rol: form.rol,
      estado: form.estado,
    }
    if (form.contrasena.trim()) {
      cambios.contrasena = form.contrasena
    }

    try {
      const actualizado = await editarUsuario(usuario.id_usuario, cambios)
      onGuardado(actualizado)
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo actualizar el usuario')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Pencil className="h-5 w-5 text-brand-600" />
            Editar usuario
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}

          <div>
            <label className="label" htmlFor="nombre">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              required
              value={form.nombre}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="correo">
              Correo
            </label>
            <input
              id="correo"
              name="correo"
              type="email"
              required
              value={form.correo}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="rol">
                Rol
              </label>
              <select
                id="rol"
                name="rol"
                value={form.rol}
                onChange={handleChange}
                disabled={esUsuarioActual}
                className="input capitalize"
              >
                <option value="usuario">usuario</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="estado">
                Estado
              </label>
              <select
                id="estado"
                name="estado"
                value={form.estado}
                onChange={handleChange}
                disabled={esUsuarioActual}
                className="input capitalize"
              >
                <option value="activo">activo</option>
                <option value="inactivo">inactivo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="contrasena">
              Nueva contraseña{' '}
              <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              id="contrasena"
              name="contrasena"
              type="password"
              minLength={6}
              value={form.contrasena}
              onChange={handleChange}
              className="input"
              placeholder="Dejar en blanco para no cambiar"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Usuarios() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editando, setEditando] = useState(null)
  const [cambiandoId, setCambiandoId] = useState(null)

  const cargarUsuarios = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listarUsuarios()
      setUsuarios(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudieron cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarUsuarios()
  }, [])

  const reemplazarUsuario = (actualizado) => {
    setUsuarios((prev) =>
      prev.map((u) => (u.id_usuario === actualizado.id_usuario ? actualizado : u)),
    )
  }

  const handleToggleEstado = async (usuario) => {
    setError('')
    setSuccess('')
    const nuevoEstado = usuario.estado === 'activo' ? 'inactivo' : 'activo'
    setCambiandoId(usuario.id_usuario)
    try {
      const actualizado = await cambiarEstadoUsuario(usuario.id_usuario, nuevoEstado)
      reemplazarUsuario(actualizado)
      setSuccess(`Usuario ${nuevoEstado === 'activo' ? 'activado' : 'inactivado'} correctamente`)
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo cambiar el estado')
    } finally {
      setCambiandoId(null)
    }
  }

  const handleGuardado = (actualizado) => {
    reemplazarUsuario(actualizado)
    setEditando(null)
    setSuccess('Usuario actualizado correctamente')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Users className="h-6 w-6 text-brand-600" />
          Usuarios
        </h1>
        <p className="text-sm text-slate-500">
          Administra los usuarios y su estado (activo / inactivo)
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} onClose={() => setError('')} />
        </div>
      )}
      {success && (
        <div className="mb-4">
          <Alert type="success" message={success} onClose={() => setSuccess('')} />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : usuarios.length === 0 ? (
        <div className="card text-center text-slate-500">
          No hay usuarios para mostrar.
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => {
                const esActual = u.id_usuario === user?.id_usuario
                return (
                  <tr key={u.id_usuario} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <span className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500">
                          {u.rol === 'admin' ? (
                            <ShieldCheck className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </span>
                        {u.nombre}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.correo}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          ROL_BADGE[u.rol] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          ESTADO_BADGE[u.estado] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {u.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditando(u)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleEstado(u)}
                          disabled={
                            cambiandoId === u.id_usuario ||
                            (esActual && u.estado === 'activo')
                          }
                          title={
                            esActual && u.estado === 'activo'
                              ? 'No puedes inactivar tu propia cuenta'
                              : ''
                          }
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                            u.estado === 'activo'
                              ? 'text-slate-600 hover:bg-slate-100'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {cambiandoId === u.id_usuario ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : u.estado === 'activo' ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                          {u.estado === 'activo' ? 'Inactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <EditarUsuarioModal
          usuario={editando}
          esUsuarioActual={editando.id_usuario === user?.id_usuario}
          onClose={() => setEditando(null)}
          onGuardado={handleGuardado}
        />
      )}
    </div>
  )
}
