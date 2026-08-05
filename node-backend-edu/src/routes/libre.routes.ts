import { Router, type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config.js';
import ticketRoutes from './ticket.routes.js';
import personaRoutes from './persona.routes.js';
import itemRoutes from './item.routes.js';
import canchaRoutes from './cancha.routes.js';
import reservaRoutes from './reserva.routes.js';
import equipoRoutes from './equipo.routes.js';
import prestamoRoutes from './prestamo.routes.js';

/* ==================================================================== */
/* RUTAS LIBRES — mismos recursos, SIN autenticación                     */
/*                                                                       */
/* Por qué existe este archivo:                                          */
/*                                                                       */
/* En la Lección 2 el tema ERA la autenticación: token, expiración,      */
/* roles, 401 contra 403. En la Lección 3 el tema es Vuex, y pedirle a   */
/* alguien que resuelva el manejo de estado Y el manejo del token al     */
/* mismo tiempo es cargarle dos problemas para enseñarle uno.            */
/*                                                                       */
/* Entonces montamos los MISMOS recursos bajo /api/libre, sin exigir     */
/* credencial. Los originales bajo /api/tickets y /api/personas quedan   */
/* intactos: el material de la Lección 2 sigue funcionando igual.        */
/*                                                                       */
/* ------------------------------------------------------------------- */
/* Cómo está hecho, porque el truco vale la pena mirarlo:                */
/*                                                                       */
/* NO duplicamos ni una línea de lógica. Reutilizamos los routers que    */
/* ya existen y les anteponemos un middleware que inyecta una            */
/* credencial de invitado en el header. Cuando `authenticateJWT` revisa  */
/* la petición más adelante, encuentra un token válido y deja pasar.     */
/*                                                                       */
/* Consecuencia importante: TODA la validación de negocio se conserva    */
/* exactamente igual. Sigues recibiendo 422 con el detalle por campo,    */
/* 409 al cerrar algo ya cerrado, 400 con un filtro inválido y 429 al    */
/* abusar de /resumen. Lo único que desaparece es la puerta del token.   */
/* ==================================================================== */

const router = Router();

/**
 * Credencial de invitado.
 *
 * Se firma una por petición, así nunca expira a mitad de clase.
 * El rol es `admin` a propósito: sin él, DELETE seguiría devolviendo 403
 * y volveríamos a mezclar el tema de permisos con el de estado.
 */
const INVITADO = {
    username: 'invitado',
    role: 'admin',
    nombre: 'Invitado de clase'
};

const inyectarCredencialDeInvitado = (req: Request, _res: Response, next: NextFunction) => {
    const token = jwt.sign(INVITADO, getJwtSecret(), { expiresIn: '10m' });

    // Se sobrescribe siempre, incluso si el cliente mandó algo.
    // La gracia de estas rutas es que el resultado no dependa del token.
    req.headers.authorization = `Bearer ${token}`;

    next();
};

/* ------------------------------------------------------------------ */
/* GET /api/libre — índice de lo que hay disponible sin token          */
/* ------------------------------------------------------------------ */
router.get('/', (_req: Request, res: Response) => {
    res.json({
        recurso: 'Rutas libres (sin autenticación)',
        proposito: 'Practicar Vuex sin tener que resolver el manejo del token.',
        equivalencias: {
            '/api/libre/tickets': '/api/tickets  (mismo recurso, este no pide token)',
            '/api/libre/personas': '/api/personas (mismo recurso, este no pide token)',
            '/api/libre/items': '/api/items    (mismo recurso, este no pide token)',
            '/api/libre/canchas': '/api/canchas  (mismo recurso, este no pide token)',
            '/api/libre/reservas': '/api/reservas (mismo recurso, este no pide token)',
            '/api/libre/equipos': '/api/equipos  (mismo recurso, este no pide token)',
            '/api/libre/prestamos': '/api/prestamos (mismo recurso, este no pide token)'
        },
        tickets: [
            'GET    /api/libre/tickets              → { datos, meta }',
            'GET    /api/libre/tickets/resumen      → estadísticas (máximo 5 cada 30 s)',
            'GET    /api/libre/tickets/:id          → el ticket directo',
            'POST   /api/libre/tickets              → 201 con el ticket creado',
            'PUT    /api/libre/tickets/:id          → reemplazo total',
            'PATCH  /api/libre/tickets/:id          → actualización parcial',
            'POST   /api/libre/tickets/:id/cerrar   → exige solucion (mínimo 10 caracteres)',
            'POST   /api/libre/tickets/:id/reabrir  → 409 si no estaba cerrado',
            'DELETE /api/libre/tickets/:id          → elimina'
        ],
        personas: [
            'GET    /api/libre/personas               → { resultados, paginacion }',
            'GET    /api/libre/personas/departamentos → valores válidos del selector',
            'GET    /api/libre/personas/:id           → la persona directa',
            'POST   /api/libre/personas               → 201 + cabecera Location',
            'PUT    /api/libre/personas/:id           → reemplazo total',
            'PATCH  /api/libre/personas/:id           → actualización parcial',
            'DELETE /api/libre/personas/:id           → 204 sin cuerpo'
        ],
        canchas: [
            'GET    /api/libre/canchas                → arreglo directo del catálogo',
            'GET    /api/libre/canchas/:id            → la cancha directa',
            'Sólo lectura: construir una cancha no es cosa de una aplicación web.'
        ],
        reservas: [
            'GET    /api/libre/reservas               → { datos, meta }',
            'GET    /api/libre/reservas/bloques       → horarios y estados para los <select>',
            'GET    /api/libre/reservas/resumen       → estadísticas del recinto',
            'GET    /api/libre/reservas/:id           → la reserva directa',
            'POST   /api/libre/reservas               → 201 + cabecera Location',
            'PUT    /api/libre/reservas/:id           → reemplazo total',
            'PATCH  /api/libre/reservas/:id           → confirmar o cancelar',
            'DELETE /api/libre/reservas/:id           → elimina'
        ],
        equipos: [
            'GET    /api/libre/equipos                → catálogo con `disponibles` calculado',
            'GET    /api/libre/equipos/categorias     → valores del selector',
            'GET    /api/libre/equipos/:id            → el equipo directo',
            'Sólo lectura: dar de alta un equipo es un trámite de inventario.'
        ],
        prestamos: [
            'GET    /api/libre/prestamos              → { datos, meta }',
            'GET    /api/libre/prestamos/opciones     → estados y categorías para los <select>',
            'GET    /api/libre/prestamos/resumen      → estadísticas del pañol',
            'GET    /api/libre/prestamos/:id          → el préstamo directo',
            'POST   /api/libre/prestamos              → 201 + cabecera Location · 409 si no alcanza el stock',
            'PUT    /api/libre/prestamos/:id          → reemplazo total',
            'PATCH  /api/libre/prestamos/:id          → entregar o devolver',
            'DELETE /api/libre/prestamos/:id          → elimina'
        ],
        seConservan: {
            '400': 'Filtro con un valor no permitido',
            '404': 'El recurso no existe',
            '409': 'Conflicto de estado (cerrar algo ya cerrado, RUT duplicado, eliminar a alguien activo, cancha ya tomada a esa hora, stock insuficiente en el pañol)',
            '422': 'Validación fallida, con detalle por campo en `errores`',
            '429': 'Demasiadas peticiones en /tickets/resumen, con cabecera Retry-After'
        },
        yaNoAparecen: {
            '401': 'No se pide credencial en estas rutas',
            '403': 'No hay roles que comprobar en estas rutas'
        },
        ojo: 'Los datos son los MISMOS que en /api/tickets y /api/personas. Si borras acá, desaparece allá: es una sola base en memoria.'
    });
});

/* ------------------------------------------------------------------ */
/* Los mismos routers de siempre, precedidos por la credencial fija.   */
/* ------------------------------------------------------------------ */
router.use(inyectarCredencialDeInvitado);

router.use('/tickets', ticketRoutes);
router.use('/personas', personaRoutes);
router.use('/items', itemRoutes);
router.use('/canchas', canchaRoutes);
router.use('/reservas', reservaRoutes);
router.use('/equipos', equipoRoutes);
router.use('/prestamos', prestamoRoutes);

export default router;
