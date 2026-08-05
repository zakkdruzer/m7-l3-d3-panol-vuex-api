import axios from 'axios';

// Instancia única de axios con la URL base del backend.
// La URL aparece sólo aquí en todo el proyecto.
const http = axios.create({
  baseURL: 'http://localhost:3001/api/libre',
});

export default http;