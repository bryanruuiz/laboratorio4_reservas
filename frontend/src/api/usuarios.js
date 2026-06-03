import api from './axios'

// Lista todos los usuarios (solo admin).
export async function listarUsuarios() {
  const { data } = await api.get('/usuarios/')
  return data
}

// Edita los datos de un usuario (solo admin).
export async function editarUsuario(idUsuario, cambios) {
  const { data } = await api.put(`/usuarios/${idUsuario}`, cambios)
  return data
}

// Activa o inactiva un usuario (solo admin).
export async function cambiarEstadoUsuario(idUsuario, estado) {
  const { data } = await api.patch(`/usuarios/${idUsuario}/estado`, { estado })
  return data
}
