import { useEffect, useState } from 'react'
import { Building2, Loader2, MapPin, Pencil, PlusCircle, Users, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  crearEspacio,
  editarEspacio,
  listarDisponibles,
  listarEspacios,
} from '../api/espacios'
import Alert from '../components/Alert'

const ESTADOS = ['activo', 'inactivo', 'en mantenimiento', 'no disponible']

const ESTADO_BADGE = {
  activo: 'bg-emerald-100 text-emerald-700',
  inactivo: 'bg-slate-200 text-slate-600',
  'en mantenimiento': 'bg-amber-100 text-amber-700',
  'no disponible': 'bg-red-100 text-red-700',
}

function EspacioCard({ espacio, isAdmin, onEdit }) {
  return (
    <div className="card card-hover flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <Building2 className="h-5 w-5" />
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
            ESTADO_BADGE[espacio.estado] ?? 'bg-slate-100 text-slate-600'
          }`}
        >
          {espacio.estado}
        </span>
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-900">{espacio.nombre}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="h-4 w-4" />
          {espacio.ubicacion}
        </p>
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
          <Users className="h-4 w-4" />
          Capacidad: {espacio.capacidad}
        </p>
      </div>
      {isAdmin && (
        <button
          type="button"
          onClick={() => onEdit(espacio)}
          className="mt-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
        >
          <Pencil className="h-4 w-4" />
          Editar
        </button>
      )}
    </div>
  )
}

function EditarEspacioModal({ espacio, onClose, onGuardado }) {
  const [form, setForm] = useState({
    nombre: espacio.nombre,
    ubicacion: espacio.ubicacion,
    capacidad: String(espacio.capacidad),
    estado: espacio.estado,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (Number(form.capacidad) <= 0) {
      setError('La capacidad debe ser mayor que 0')
      return
    }

    setSaving(true)
    try {
      const actualizado = await editarEspacio(espacio.id_espacio, form)
      onGuardado(actualizado)
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo actualizar el espacio')
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
            Editar espacio
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
            <label className="label" htmlFor="edit-nombre">
              Nombre
            </label>
            <input
              id="edit-nombre"
              name="nombre"
              required
              value={form.nombre}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="edit-ubicacion">
              Ubicación
            </label>
            <input
              id="edit-ubicacion"
              name="ubicacion"
              required
              value={form.ubicacion}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="edit-capacidad">
                Capacidad
              </label>
              <input
                id="edit-capacidad"
                name="capacidad"
                type="number"
                min={1}
                required
                value={form.capacidad}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="edit-estado">
                Estado
              </label>
              <select
                id="edit-estado"
                name="estado"
                value={form.estado}
                onChange={handleChange}
                className="input capitalize"
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
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

export default function Espacios() {
  const { isAdmin } = useAuth()
  const [espacios, setEspacios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editando, setEditando] = useState(null)

  // Formulario admin
  const [form, setForm] = useState({
    nombre: '',
    ubicacion: '',
    capacidad: '',
    estado: 'activo',
  })
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const cargarEspacios = async () => {
    setLoading(true)
    setError('')
    try {
      const data = isAdmin ? await listarEspacios() : await listarDisponibles()
      setEspacios(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudieron cargar los espacios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarEspacios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')

    if (Number(form.capacidad) <= 0) {
      setFormError('La capacidad debe ser mayor que 0')
      return
    }

    setSaving(true)
    try {
      const res = await crearEspacio(form)
      setFormSuccess(res.message || 'Espacio creado correctamente')
      setForm({ nombre: '', ubicacion: '', capacidad: '', estado: 'activo' })
      cargarEspacios()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'No se pudo crear el espacio')
    } finally {
      setSaving(false)
    }
  }

  const handleGuardado = (actualizado) => {
    setEspacios((prev) =>
      prev.map((e) => (e.id_espacio === actualizado.id_espacio ? actualizado : e)),
    )
    setEditando(null)
    setFormSuccess('Espacio actualizado correctamente')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Espacios</h1>
        <p className="text-sm text-slate-500">
          {isAdmin
            ? 'Administra y registra los espacios institucionales'
            : 'Espacios disponibles para reservar'}
        </p>
      </div>

      {isAdmin && (
        <form onSubmit={handleSubmit} className="card mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <PlusCircle className="h-5 w-5 text-brand-600" />
            Registrar nuevo espacio
          </h2>

          <div className="space-y-4">
            {formError && (
              <Alert type="error" message={formError} onClose={() => setFormError('')} />
            )}
            {formSuccess && (
              <Alert
                type="success"
                message={formSuccess}
                onClose={() => setFormSuccess('')}
              />
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  placeholder="Auditorio A"
                />
              </div>
              <div>
                <label className="label" htmlFor="ubicacion">
                  Ubicación
                </label>
                <input
                  id="ubicacion"
                  name="ubicacion"
                  required
                  value={form.ubicacion}
                  onChange={handleChange}
                  className="input"
                  placeholder="Edificio 3, piso 2"
                />
              </div>
              <div>
                <label className="label" htmlFor="capacidad">
                  Capacidad
                </label>
                <input
                  id="capacidad"
                  name="capacidad"
                  type="number"
                  min={1}
                  required
                  value={form.capacidad}
                  onChange={handleChange}
                  className="input"
                  placeholder="50"
                />
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
                  className="input capitalize"
                >
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" disabled={saving} className="btn-primary">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrar espacio
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="mb-6">
          <Alert type="error" message={error} onClose={() => setError('')} />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : espacios.length === 0 ? (
        <div className="card text-center text-slate-500">
          No hay espacios para mostrar.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {espacios.map((espacio) => (
            <EspacioCard
              key={espacio.id_espacio}
              espacio={espacio}
              isAdmin={isAdmin}
              onEdit={setEditando}
            />
          ))}
        </div>
      )}

      {editando && (
        <EditarEspacioModal
          espacio={editando}
          onClose={() => setEditando(null)}
          onGuardado={handleGuardado}
        />
      )}
    </div>
  )
}
