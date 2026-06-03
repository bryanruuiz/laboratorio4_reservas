import api from './axios'

// El backend usa OAuth2PasswordRequestForm -> requiere x-www-form-urlencoded.
export async function login(correo, contrasena) {
  const body = new URLSearchParams()
  body.append('username', correo)
  body.append('password', contrasena)

  const { data } = await api.post('/auth/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data // { access_token, token_type }
}

// Registro de un usuario estándar.
export async function register({ nombre, correo, contrasena }) {
  const { data } = await api.post('/usuarios/', {
    nombre,
    correo,
    contrasena,
    rol: 'usuario',
  })
  return data
}

// Datos del usuario autenticado.
export async function getMe() {
  const { data } = await api.get('/auth/me')
  return data // { id_usuario, nombre, correo, rol }
}
