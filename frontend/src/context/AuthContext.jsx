import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import { login as loginRequest, register as registerRequest } from '../api/auth'

const AuthContext = createContext(null)

function parseToken(token) {
  if (!token) return null
  try {
    const payload = jwtDecode(token)
    // El backend incluye: sub (correo), id_usuario, rol, scopes, exp.
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null
    }
    return {
      correo: payload.sub,
      id_usuario: payload.id_usuario,
      rol: payload.rol,
    }
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem('token')
    return parseToken(storedToken) ? storedToken : null
  })

  // El usuario se deriva directamente del token (fuente única de verdad).
  const user = useMemo(() => parseToken(token), [token])

  // El efecto solo sincroniza el token con localStorage (sistema externo).
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }, [token])

  useEffect(() => {
    const handleUnauthorized = () => setToken(null)
    window.addEventListener('auth:logout', handleUnauthorized)
    return () => window.removeEventListener('auth:logout', handleUnauthorized)
  }, [])

  const login = async (correo, contrasena) => {
    const data = await loginRequest(correo, contrasena)
    setToken(data.access_token)
    return parseToken(data.access_token)
  }

  const register = async (datos) => {
    return registerRequest(datos)
  }

  const logout = () => {
    setToken(null)
  }

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.rol === 'admin',
      login,
      register,
      logout,
    }),
    [token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return ctx
}
