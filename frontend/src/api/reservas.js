import api from './axios'

// Lista de reservas (el backend filtra según el rol del usuario).
export async function listarReservas() {
  const { data } = await api.get('/reservas/')
  return data
}

// Crea una nueva reserva. El backend espera el nombre del espacio.
export async function crearReserva({
  nombre_espacio,
  fecha,
  hora_inicio,
  hora_fin,
  cantidad_asistentes,
}) {
  const { data } = await api.post('/reservas/', {
    nombre_espacio,
    fecha,
    hora_inicio,
    hora_fin,
    cantidad_asistentes: Number(cantidad_asistentes),
  })
  return data
}

// Cambia el estado de una reserva (solo admin): 'aprobada' | 'rechazada'.
export async function actualizarEstadoReserva(idReserva, estado) {
  const { data } = await api.put(`/reservas/${idReserva}/estado`, { estado })
  return data
}

// Cancela una reserva.
export async function cancelarReserva(idReserva) {
  const { data } = await api.delete(`/reservas/${idReserva}`)
  return data
}
