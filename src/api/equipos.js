import http from './http';

// Llama al endpoint GET /equipos para obtener el inventario completo.
// Devuelve un arreglo directo de equipos según la documentación.
export function fetchEquipos(params = {}) {
  // params permite aplicar filtros: categoria, operativo, conStock.
  return http.get('/equipos', { params });
}

// Llama al endpoint GET /equipos/:id para obtener un equipo puntual.
// Se usará más adelante si agregas una vista de detalle.
export function fetchEquipoPorId(id) {
  return http.get(`/equipos/${id}`);
}

// Llama al endpoint GET /equipos/categorias para poblar selectores de filtro.
export function fetchCategoriasEquipos() {
  return http.get('/equipos/categorias');
}