import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Building2, CalendarDays, LogOut, ShieldCheck, User, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const linkBase =
  'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition'

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const navClass = ({ isActive }) =>
    `${linkBase} ${
      isActive
        ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-100'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/70 shadow-soft backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow">
            <CalendarDays className="h-5 w-5" />
          </span>
          <span className="bg-gradient-to-r from-brand-700 to-violet-600 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
            ReservaInst
          </span>
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          <NavLink to="/espacios" className={navClass}>
            <Building2 className="h-4 w-4" />
            Espacios
          </NavLink>
          <NavLink to="/reservas" className={navClass}>
            <CalendarDays className="h-4 w-4" />
            Reservas
          </NavLink>
          {isAdmin && (
            <NavLink to="/usuarios" className={navClass}>
              <Users className="h-4 w-4" />
              Usuarios
            </NavLink>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden flex-col items-end leading-tight sm:flex">
            <span className="flex items-center gap-1 text-sm font-medium text-slate-700">
              <User className="h-4 w-4 text-slate-400" />
              {user?.correo}
            </span>
            {isAdmin ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                <ShieldCheck className="h-3 w-3" />
                Administrador
              </span>
            ) : (
              <span className="text-xs text-slate-400">Usuario</span>
            )}
          </div>

          <button type="button" onClick={handleLogout} className="btn-danger">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </nav>
    </header>
  )
}
