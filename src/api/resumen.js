import http from './http';

// Llama al endpoint GET /prestamos/resumen para obtener
// las cifras agregadas del pañol.
export function fetchResumenPrestamos(params = {}) {
  return http.get('/prestamos/resumen', { params });
}