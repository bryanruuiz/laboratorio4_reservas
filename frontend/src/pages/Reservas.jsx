import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Loader2,
  PlusCircle,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  actualizarEstadoReserva,
  cancelarReserva,
  listarReservas,
} from '../api/reservas'
import Alert from '../components/Alert'

const ESTADO_BADGE = {
  esperando: 'bg-amber-100 text-amber-700',
  aprobada: 'bg-emerald-100 text-emerald-700',
  rechazada: 'bg-red-100 text-red-700',
  cancelada: 'bg-slate-200 text-slate-600',
}

export default function Reservas() {
  const { isAdmin } = useAuth()
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionId, setActionId] = useState(null)

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listarReservas()
      setReservas(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudieron cargar las reservas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar()
  }, [])

  const handleEstado = async (id, estado) => {
    setActionId(id)
    setError('')
    setSuccess('')
    try {
      const res = await actualizarEstadoReserva(id, estado)
      setSuccess(res.message || 'Reserva actualizada')
      cargar()
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo actualizar la reserva')
    } finally {
      setActionId(null)
    }
  }

  const handleCancelar = async (id) => {
    setActionId(id)
    setError('')
    setSuccess('')
    try {
      const res = await cancelarReserva(id)
      setSuccess(res.message || 'Reserva cancelada')
      cargar()
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo cancelar la reserva')
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reservas</h1>
          <p className="text-sm text-slate-500">
            {isAdmin
              ? 'Gestiona todas las reservas del sistema'
              : 'Tus reservas registradas'}
          </p>
        </div>
        <Link to="/reservas/nueva" className="btn-primary">
          <PlusCircle className="h-4 w-4" />
          Nueva reserva
        </Link>
      </div>

      <div className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && (
          <Alert type="success" message={success} onClose={() => setSuccess('')} />
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : reservas.length === 0 ? (
        <div className="card mt-4 text-center text-slate-500">
          No tienes reservas registradas.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl ring-1 ring-slate-200">
          <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Espacio</th>
                <th className="px-4 py-3">Solicitante</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Horario</th>
                <th className="px-4 py-3">Asistentes</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservas.map((r) => {
                const puedeCancelar = r.estado === 'esperando' || r.estado === 'aprobada'
                const tieneAccionesAdmin = isAdmin && r.estado === 'esperando'

                return (
                  <tr key={r.id_reserva} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {r.id_reserva}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.espacio?.nombre ?? `#${r.id_espacio}`}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="min-w-44 leading-tight">
                        <p className="font-medium text-slate-800">
                          {r.usuario?.nombre ?? `Usuario #${r.id_usuario}`}
                        </p>
                        {r.usuario?.correo && (
                          <p className="text-xs text-slate-500">{r.usuario.correo}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.fecha}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.hora_inicio} - {r.hora_fin}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.cantidad_asistentes}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          ESTADO_BADGE[r.estado] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {r.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && r.estado === 'esperando' && (
                          <>
                            <button
                              type="button"
                              disabled={actionId === r.id_reserva}
                              onClick={() => handleEstado(r.id_reserva, 'aprobada')}
                              className="btn-success px-3 py-1.5"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Aprobar
                            </button>
                            <button
                              type="button"
                              disabled={actionId === r.id_reserva}
                              onClick={() => handleEstado(r.id_reserva, 'rechazada')}
                              className="btn-danger px-3 py-1.5"
                            >
                              <XCircle className="h-4 w-4" />
                              Rechazar
                            </button>
                          </>
                        )}
                        {puedeCancelar && (
                          <button
                            type="button"
                            disabled={actionId === r.id_reserva}
                            onClick={() => handleCancelar(r.id_reserva)}
                            className="btn-danger px-3 py-1.5"
                          >
                            <Trash2 className="h-4 w-4" />
                            Cancelar
                          </button>
                        )}
                        {!tieneAccionesAdmin && !puedeCancelar && (
                          <span className="text-xs text-slate-400">Sin acciones</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
