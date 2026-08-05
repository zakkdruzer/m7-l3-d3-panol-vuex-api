import axios from 'axios';

// Se crea una instancia de axios con la URL base del backend.
// La URL aparece sólo aquí para cumplir el criterio del PDF.
const http = axios.create({
  baseURL: 'http://localhost:3001/api/libre',
});

// Aquí se podrían agregar interceptores si fuera necesario
// (por ejemplo, para autenticación con token), pero en esta
// actividad la API libre no requiere token.
export default http;