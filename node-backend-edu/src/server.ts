import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import itemRoutes from './routes/item.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import notaRoutes from './routes/nota.routes.js';
import personaRoutes from './routes/persona.routes.js';
import canchaRoutes from './routes/cancha.routes.js';
import reservaRoutes from './routes/reserva.routes.js';
import equipoRoutes from './routes/equipo.routes.js';
import prestamoRoutes from './routes/prestamo.routes.js';
import libreRoutes from './routes/libre.routes.js';

// Cargar variables de entorno
dotenv.config();

const app: Application = express();
const PORT = 3001;

// Middleware
// exposedHeaders: sin esto, el navegador NO deja que JavaScript lea estas
// cabeceras aunque el servidor sí las envíe. Por defecto sólo son legibles
// unas pocas cabeceras estándar.
app.use(cors({
    exposedHeaders: ['Retry-After', 'X-Total-Registros', 'Location']
}));
app.use(express.json());

// Rutas base para prueba
app.get('/', (req: Request, res: Response) => {
    res.json({
        name: 'Backend Educativo Node.js',
        version: '2.0.0',
        message: 'Servidor funcionando correctamente. Usa POST /api/login para obtener un token.',
        recursos: {
            auth: ['POST /api/login', 'GET /api/perfil', 'POST /api/refresh'],
            tickets: [
                'GET /api/tickets',
                'GET /api/tickets/resumen',
                'GET /api/tickets/:id',
                'POST /api/tickets',
                'PUT /api/tickets/:id',
                'PATCH /api/tickets/:id',
                'POST /api/tickets/:id/cerrar',
                'POST /api/tickets/:id/reabrir',
                'PUT /api/tickets/:id/seguro',
                'DELETE /api/tickets/:id/seguro',
                'DELETE /api/tickets/:id'
            ],
            personas: [
                'GET /api/personas',
                'GET /api/personas/departamentos',
                'GET /api/personas/:id',
                'POST /api/personas',
                'PUT /api/personas/:id',
                'PATCH /api/personas/:id',
                'DELETE /api/personas/:id'
            ],
            notas: ['GET /api/notas', 'POST /api/notas', 'DELETE /api/notas/:id'],
            items: ['GET /api/items', 'POST /api/items', 'PUT /api/items/:id', 'PATCH /api/items/:id', 'DELETE /api/items/:id'],
            canchas: ['GET /api/canchas', 'GET /api/canchas/:id'],
            reservas: [
                'GET /api/reservas',
                'GET /api/reservas/bloques',
                'GET /api/reservas/resumen',
                'GET /api/reservas/:id',
                'POST /api/reservas',
                'PUT /api/reservas/:id',
                'PATCH /api/reservas/:id',
                'DELETE /api/reservas/:id'
            ],
            equipos: ['GET /api/equipos', 'GET /api/equipos/categorias', 'GET /api/equipos/:id'],
            prestamos: [
                'GET /api/prestamos',
                'GET /api/prestamos/opciones',
                'GET /api/prestamos/resumen',
                'GET /api/prestamos/:id',
                'POST /api/prestamos',
                'PUT /api/prestamos/:id',
                'PATCH /api/prestamos/:id',
                'DELETE /api/prestamos/:id'
            ],
            libre: [
                'GET /api/libre  ← índice de las rutas SIN autenticación',
                'Todos los recursos anteriores sin token (Lección 3 · Vuex)'
            ]
        }
    });
});

// Rutas de la API
app.use('/api', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/personas', personaRoutes);
app.use('/api/notas', notaRoutes);

// Recinto deportivo. Dos recursos relacionados, pensados para practicar
// módulos de Vuex: una reserva no existe sin su cancha.
app.use('/api/canchas', canchaRoutes);
app.use('/api/reservas', reservaRoutes);

// El Pañol. Mismo patrón que canchas/reservas, con una regla de negocio
// distinta: acá el conflicto es por stock, no por colisión de horario.
app.use('/api/equipos', equipoRoutes);
app.use('/api/prestamos', prestamoRoutes);

// Mismos recursos, sin exigir token. Ver src/routes/libre.routes.ts.
// Existe para la Lección 3 (Vuex): ahí el tema es el estado, no la sesión.
app.use('/api/libre', libreRoutes);

// Manejo de errores 404
app.use((req: Request, res: Response) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
