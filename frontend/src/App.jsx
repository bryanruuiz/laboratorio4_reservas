import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Espacios from './pages/Espacios'
import Reservas from './pages/Reservas'
import CrearReserva from './pages/CrearReserva'
import Usuarios from './pages/Usuarios'

// Layout con Navbar para las rutas autenticadas.
function AppLayout() {
  return (
    <div className="min-h-screen bg-mesh">
      <Navbar />
      <main className="animate-fade-in-up">
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  const { isAuthenticated, isAdmin } = useAuth()

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
      />

      {/* Rutas protegidas */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/espacios" element={<Espacios />} />
        <Route path="/reservas" element={<Reservas />} />
        <Route path="/reservas/nueva" element={<CrearReserva />} />
        <Route
          path="/usuarios"
          element={isAdmin ? <Usuarios /> : <Navigate to="/dashboard" replace />}
        />
      </Route>

      {/* Redirecciones por defecto */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
