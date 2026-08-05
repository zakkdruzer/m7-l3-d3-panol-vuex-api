import http from './http';

// Lista de préstamos con filtros y paginación.
// Responde un objeto { datos, meta } según la documentación.
export function fetchPrestamos(params = {}) {
  return http.get('/prestamos', { params });
}

// Devuelve opciones de estados y categorías para filtros de la planilla.
export function fetchOpcionesPrestamos() {
  return http.get('/prestamos/opciones');
}

// Devuelve un préstamo individual por id.
export function fetchPrestamoPorId(id) {
  return http.get(`/prestamos/${id}`);
}

// Crea un préstamo nuevo (POST /prestamos).
// Puede responder 201, 422 por campo, o 409 por conflicto de stock.
export function crearPrestamo(payload) {
  return http.post('/prestamos', payload);
}

// Reemplazo total de un préstamo (PUT /prestamos/:id).
export function actualizarPrestamo(id, payload) {
  return http.put(`/prestamos/${id}`, payload);
}

// Entregar o devolver (PATCH /prestamos/:id).
export function patchPrestamo(id, payload) {
  return http.patch(`/prestamos/${id}`, payload);
}

// Eliminar préstamo (DELETE /prestamos/:id).
export function eliminarPrestamo(id) {
  return http.delete(`/prestamos/${id}`);
}