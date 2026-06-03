import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus, Loader2 } from 'lucide-react'
import { listarDisponibles, listarEspacios } from '../api/espacios'
import { crearReserva } from '../api/reservas'
import Alert from '../components/Alert'

const INITIAL = {
  nombre_espacio: '',
  fecha: '',
  hora_inicio: '',
  hora_fin: '',
  cantidad_asistentes: '',
}

// Valida en cliente las reglas críticas antes de enviar al backend.
function validar(form) {
  const errores = []

  if (
    !form.nombre_espacio ||
    !form.fecha ||
    !form.hora_inicio ||
    !form.hora_fin ||
    !form.cantidad_asistentes
  ) {
    errores.push('Todos los campos son obligatorios')
    return errores
  }

  // Domingo (getDay(): 0 = domingo). Se construye en horario local.
  const fechaObj = new Date(`${form.fecha}T00:00:00`)
  if (fechaObj.getDay() === 0) {
    errores.push('No se permiten reservas los domingos')
  } else {
    const esSabado = fechaObj.getDay() === 6
    const apertura = esSabado ? '08:00' : '07:00'
    const cierre = esSabado ? '12:00' : '20:00'

    if (form.hora_inicio < apertura || form.hora_fin > cierre) {
      errores.push(`Horario permitido: ${apertura} - ${cierre}`)
    }
  }

  // hora_inicio debe ser estrictamente menor que hora_fin.
  if (form.hora_inicio >= form.hora_fin) {
    errores.push('La hora de inicio debe ser menor que la hora de fin')
  }

  // Anticipación mínima de 24 horas.
  const inicio = new Date(`${form.fecha}T${form.hora_inicio}`)
  const limite = new Date(Date.now() + 24 * 60 * 60 * 1000)
  if (inicio < limite) {
    errores.push('La reserva debe crearse con mínimo 24 horas de anticipación')
  }

  if (Number(form.cantidad_asistentes) <= 0) {
    errores.push('La cantidad de asistentes debe ser mayor que 0')
  }

  return errores
}

export default function CrearReserva() {
  const navigate = useNavigate()
  const [espacios, setEspacios] = useState([])
  const [form, setForm] = useState(INITIAL)
  const [errores, setErrores] = useState([])
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Intenta cargar disponibles; si falla, usa la lista completa.
    listarDisponibles()
      .then(setEspacios)
      .catch(() => listarEspacios().then(setEspacios).catch(() => setEspacios([])))
  }, [])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Validación reactiva para feedback inmediato.
  const erroresLive = useMemo(() => {
    if (!form.fecha && !form.hora_inicio && !form.hora_fin) return []
    return validar(form).filter(
      (msg) => msg !== 'Todos los campos son obligatorios',
    )
  }, [form])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess('')
    const errs = validar(form)
    if (errs.length > 0) {
      setErrores(errs)
      return
    }
    setErrores([])
    setLoading(true)
    try {
      const res = await crearReserva(form)
      setSuccess(res.message || 'Reserva creada correctamente')
      setForm(INITIAL)
      setTimeout(() => navigate('/reservas'), 1200)
    } catch (err) {
      const detail = err.response?.data?.detail
      setErrores([detail || 'No se pudo crear la reserva'])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-white">
          <CalendarPlus className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nueva reserva</h1>
          <p className="text-sm text-slate-500">
            Completa los datos para solicitar un espacio
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {errores.length > 0 && (
          <Alert type="error" message={errores} onClose={() => setErrores([])} />
        )}
        {success && <Alert type="success" message={success} />}

        <div>
          <label className="label" htmlFor="nombre_espacio">
            Espacio
          </label>
          <select
            id="nombre_espacio"
            name="nombre_espacio"
            required
            value={form.nombre_espacio}
            onChange={handleChange}
            className="input"
          >
            <option value="">Selecciona un espacio…</option>
            {espacios.map((esp) => (
              <option key={esp.id_espacio} value={esp.nombre}>
                {esp.nombre} — {esp.ubicacion} (cap. {esp.capacidad})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="fecha">
            Fecha
          </label>
          <input
            id="fecha"
            name="fecha"
            type="date"
            required
            value={form.fecha}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="hora_inicio">
              Hora de inicio
            </label>
            <input
              id="hora_inicio"
              name="hora_inicio"
              type="time"
              required
              value={form.hora_inicio}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="hora_fin">
              Hora de fin
            </label>
            <input
              id="hora_fin"
              name="hora_fin"
              type="time"
              required
              value={form.hora_fin}
              onChange={handleChange}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="cantidad_asistentes">
            Cantidad de asistentes
          </label>
          <input
            id="cantidad_asistentes"
            name="cantidad_asistentes"
            type="number"
            min={1}
            required
            value={form.cantidad_asistentes}
            onChange={handleChange}
            className="input"
            placeholder="10"
          />
        </div>

        {erroresLive.length > 0 && (
          <Alert type="error" message={erroresLive} duration={0} />
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || erroresLive.length > 0}
            className="btn-primary"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear reserva
          </button>
          <button
            type="button"
            onClick={() => navigate('/reservas')}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
