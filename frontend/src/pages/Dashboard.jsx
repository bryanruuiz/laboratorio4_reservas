import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, CalendarDays, PlusCircle, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { listarReservas } from '../api/reservas'
import { listarEspacios } from '../api/espacios'

const ESTADO_BADGE = {
  esperando: 'bg-amber-100 text-amber-700',
  aprobada: 'bg-emerald-100 text-emerald-700',
  rechazada: 'bg-red-100 text-red-700',
  cancelada: 'bg-slate-200 text-slate-600',
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  const [reservas, setReservas] = useState([])
  const [espacios, setEspacios] = useState([])

  useEffect(() => {
    listarReservas().then(setReservas).catch(() => setReservas([]))
    listarEspacios().then(setEspacios).catch(() => setEspacios([]))
  }, [])

  const pendientes = reservas.filter((r) => r.estado === 'esperando').length

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
          {isAdmin ? <ShieldCheck className="h-7 w-7" /> : <CalendarDays className="h-7 w-7" />}
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Hola, {user?.correo}
          </h1>
          <p className="text-sm text-slate-500">
            {isAdmin ? 'Panel de administración' : 'Panel de usuario'}
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              {isAdmin ? 'Reservas totales' : 'Mis reservas'}
            </p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {reservas.length}
            </p>
          </div>
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <CalendarDays className="h-6 w-6" />
          </span>
        </div>
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Pendientes</p>
            <p className="mt-1 text-3xl font-extrabold text-amber-500">{pendientes}</p>
          </div>
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-amber-500">
            <PlusCircle className="h-6 w-6" />
          </span>
        </div>
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Espacios</p>
            <p className="mt-1 text-3xl font-extrabold text-brand-600">
              {espacios.length}
            </p>
          </div>
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-violet-50 text-violet-600">
            <Building2 className="h-6 w-6" />
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          to="/espacios"
          className="card card-hover flex items-center gap-3"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Building2 className="h-5 w-5" />
          </span>
          <span className="font-semibold text-slate-800">Ver espacios</span>
        </Link>
        <Link
          to="/reservas/nueva"
          className="card card-hover flex items-center gap-3"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <PlusCircle className="h-5 w-5" />
          </span>
          <span className="font-semibold text-slate-800">Nueva reserva</span>
        </Link>
        <Link
          to="/reservas"
          className="card card-hover flex items-center gap-3"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600">
            <CalendarDays className="h-5 w-5" />
          </span>
          <span className="font-semibold text-slate-800">Gestionar reservas</span>
        </Link>
      </div>

      {reservas.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Reservas recientes</h2>
          <div className="space-y-2">
            {reservas.slice(0, 5).map((r) => (
              <div
                key={r.id_reserva}
                className="card flex items-center justify-between py-3"
              >
                <div className="text-sm">
                  <p className="font-medium text-slate-800">
                    {r.fecha} · {r.hora_inicio} - {r.hora_fin}
                  </p>
                  <p className="text-slate-500">
                    {r.espacio?.nombre ?? `Espacio #${r.id_espacio}`}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                    ESTADO_BADGE[r.estado] ?? 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {r.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
