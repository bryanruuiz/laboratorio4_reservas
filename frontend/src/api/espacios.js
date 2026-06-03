import api from './axios'

// Lista todos los espacios (cualquier usuario autenticado).
export async function listarEspacios() {
  const { data } = await api.get('/espacios/')
  return data
}

// Lista únicamente los espacios disponibles.
export async function listarDisponibles(filtros = {}) {
  const { data } = await api.get('/espacios/disponibles', { params: filtros })
  return data
}

// Crea un nuevo espacio (solo admin).
export async function crearEspacio({ nombre, ubicacion, capacidad, estado }) {
  const { data } = await api.post('/espacios/', {
    nombre,
    ubicacion,
    capacidad: Number(capacidad),
    estado,
  })
  return data
}

// Edita un espacio existente (solo admin).
export async function editarEspacio(idEspacio, { nombre, ubicacion, capacidad, estado }) {
  const { data } = await api.put(`/espacios/${idEspacio}`, {
    nombre,
    ubicacion,
    capacidad: Number(capacidad),
    estado,
  })
  return data
}
