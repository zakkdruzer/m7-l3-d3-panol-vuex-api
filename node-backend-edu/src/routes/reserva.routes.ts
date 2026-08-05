import { Router, type Request, type Response } from 'express';
import { authenticateJWT, type AuthRequest } from '../middleware/auth.middleware.js';
import {
    reservas, canchas, nuevoIdReserva, generarCodigoReserva, marcaDeTiempo
} from '../data/store.js';
import {
    BLOQUES, ESTADOS_RESERVA, type Reserva, type EstadoReserva
} from '../models/reserva.model.js';

/* ==================================================================== */
/* RECURSO: RESERVAS                                                     */
/*                                                                       */
/* CRUD completo pensado para la Lección 3 (módulos de Vuex, router y    */
/* axios). Es deliberadamente más simple que /api/tickets: no hay roles  */
/* ni sub-recursos de acción, porque acá el tema es el manejo de estado  */
/* en el cliente, no el diseño de la API.                                */
/*                                                                       */
/* Lo que SÍ conserva, porque es justamente lo que hay que aprender a    */
/* manejar desde Vuex:                                                   */
/*                                                                       */
/*   422 → validación con un mensaje POR CAMPO, para pintar el formulario */
/*   409 → el choque de horario: la cancha ya está tomada a esa hora     */
/*   400 → un filtro con un valor que no existe                          */
/*   404 → la reserva no existe                                          */
/*                                                                       */
/* El 409 es el corazón pedagógico de este recurso. Ninguna validación   */
/* de navegador puede detectarlo: depende del estado del servidor en el  */
/* instante del envío. Es la prueba de que validar en el cliente NUNCA   */
/* reemplaza validar en el servidor.                                     */
/* ==================================================================== */

const router = Router();

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const FORMATO_TELEFONO = /^\+56\d{9}$/;

const idDesde = (valor: unknown): number => Number(String(valor));
const buscarReserva = (valor: unknown) => reservas.find(r => r.id === idDesde(valor));

/** Nombre de la cancha, o un texto de respaldo si el id no calza con nada. */
const nombreCancha = (canchaId: number) =>
    canchas.find(c => c.id === canchaId)?.nombre ?? `Cancha ${canchaId}`;

/**
 * ¿Es una fecha real y no sólo diez caracteres con la forma correcta?
 *
 * `2026-02-31` pasa la expresión regular pero no existe. Se comprueba
 * reconstruyendo la fecha y comparándola con el texto original.
 */
function esFechaValida(texto: string): boolean {
    if (!FORMATO_FECHA.test(texto)) return false;

    const fecha = new Date(`${texto}T00:00:00.000Z`);
    return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === texto;
}

/* ------------------------------------------------------------------ */
/* Validación: devuelve un mapa campo → mensaje                        */
/*                                                                     */
/* A propósito NO se valida que la fecha sea futura. Sería una regla    */
/* razonable en un sistema real, pero dejaría este material inservible  */
/* el día que las fechas de ejemplo queden en el pasado.                */
/* ------------------------------------------------------------------ */
function validarReserva(cuerpo: any, parcial = false): Record<string, string> {
    const errores: Record<string, string> = {};
    const tiene = (campo: string) => cuerpo?.[campo] !== undefined;

    if (!parcial || tiene('canchaId')) {
        const canchaId = Number(cuerpo?.canchaId);

        if (!Number.isInteger(canchaId)) {
            errores.canchaId = 'Debes elegir una cancha.';
        } else {
            const cancha = canchas.find(c => c.id === canchaId);

            if (!cancha) {
                errores.canchaId = `No existe la cancha con id ${cuerpo.canchaId}.`;
            } else if (!cancha.activa) {
                // El dato está bien escrito y la cancha existe, pero no se puede
                // usar. Es 422 y no 409 porque el arreglo es elegir otra opción
                // del selector: el mensaje va debajo del <select>.
                errores.canchaId = `${cancha.nombre} está fuera de servicio. Elige otra.`;
            }
        }
    }

    if (!parcial || tiene('cliente')) {
        const cliente = cuerpo?.cliente;
        if (typeof cliente !== 'string' || cliente.trim().length < 3) {
            errores.cliente = 'El nombre de quien reserva es obligatorio (mínimo 3 caracteres).';
        } else if (cliente.trim().length > 60) {
            errores.cliente = 'El nombre no puede superar los 60 caracteres.';
        }
    }

    if (!parcial || tiene('telefono')) {
        const telefono = cuerpo?.telefono;
        if (typeof telefono !== 'string' || !FORMATO_TELEFONO.test(telefono.trim())) {
            errores.telefono = 'El teléfono debe tener el formato +56912345678 (código país + 9 dígitos).';
        }
    }

    if (!parcial || tiene('fecha')) {
        const fecha = cuerpo?.fecha;
        if (typeof fecha !== 'string' || !esFechaValida(fecha.trim())) {
            errores.fecha = 'La fecha es obligatoria y debe existir, con el formato AAAA-MM-DD.';
        }
    }

    if (!parcial || tiene('bloque')) {
        if (!BLOQUES.includes(cuerpo?.bloque)) {
            errores.bloque = `El bloque debe ser uno de: ${BLOQUES.join(', ')}.`;
        }
    }

    if (!parcial || tiene('jugadores')) {
        const jugadores = Number(cuerpo?.jugadores);
        if (!Number.isInteger(jugadores) || jugadores < 2 || jugadores > 22) {
            errores.jugadores = 'La cantidad de jugadores debe ser un número entero entre 2 y 22.';
        }
    }

    if (tiene('estado') && !ESTADOS_RESERVA.includes(cuerpo.estado)) {
        errores.estado = `El estado debe ser uno de: ${ESTADOS_RESERVA.join(', ')}.`;
    }

    if (tiene('comentario') && cuerpo.comentario !== null && cuerpo.comentario !== '') {
        if (typeof cuerpo.comentario !== 'string' || cuerpo.comentario.trim().length > 200) {
            errores.comentario = 'El comentario no puede superar los 200 caracteres.';
        }
    }

    return errores;
}

/**
 * ¿Hay otra reserva viva en esa cancha, esa fecha y ese bloque?
 *
 * Las canceladas no cuentan: liberan el horario. Y se excluye la propia
 * reserva (`idActual`) para que editarla sin cambiarle la hora no choque
 * consigo misma — un error clásico al implementar esto.
 */
function buscarChoque(canchaId: number, fecha: string, bloque: string, idActual: number | null) {
    return reservas.find(r =>
        r.canchaId === canchaId &&
        r.fecha === fecha &&
        r.bloque === bloque &&
        r.estado !== 'cancelada' &&
        r.id !== idActual
    );
}

/** Respuesta 409 uniforme para el choque de horario. */
const respuestaChoque = (res: Response, choque: Reserva) =>
    res.status(409).json({
        message:
            `${nombreCancha(choque.canchaId)} ya está tomada el ${choque.fecha} a las ${choque.bloque}. ` +
            'Elige otro bloque u otra cancha.',
        conflicto: {
            codigo: choque.codigo,
            cliente: choque.cliente,
            fecha: choque.fecha,
            bloque: choque.bloque,
            estado: choque.estado
        }
    });

/* ==================================================================== */
/* GET /api/reservas/bloques — PÚBLICO                                   */
/*                                                                       */
/* Los horarios que se pueden reservar. Consúmelo para armar el <select> */
/* en vez de escribir las opciones a mano: si el recinto cambia su       */
/* horario, tu formulario se entera solo.                                */
/*                                                                       */
/* OJO AL ORDEN: va ANTES que /:id. Si estuviera después, Express        */
/* interpretaría "bloques" como un id y nunca llegarías acá.             */
/* ==================================================================== */
router.get('/bloques', (req: Request, res: Response) => {
    res.json({ bloques: BLOQUES, estados: ESTADOS_RESERVA });
});

/* ==================================================================== */
/* GET /api/reservas/resumen — PÚBLICO. Estadísticas del recinto.        */
/*                                                                       */
/* Estas cifras las calcula el SERVIDOR sobre TODAS las reservas.        */
/* No las confundas con lo que puedes derivar en un getter de Vuex:      */
/* un getter sólo ve lo que tienes cargado en el estado, que casi        */
/* siempre es una página de resultados, no la base completa.             */
/*                                                                       */
/* Saber cuál de las dos necesitas en cada caso es la decisión.          */
/* ==================================================================== */
router.get('/resumen', (req: Request, res: Response) => {
    const vivas = reservas.filter(r => r.estado !== 'cancelada');

    const porEstado = ESTADOS_RESERVA.reduce((acc, estado) => {
        acc[estado] = reservas.filter(r => r.estado === estado).length;
        return acc;
    }, {} as Record<string, number>);

    const porCancha = canchas.map(cancha => {
        const suyas = vivas.filter(r => r.canchaId === cancha.id);

        return {
            canchaId: cancha.id,
            nombre: cancha.nombre,
            reservas: suyas.length,
            ingreso: suyas.filter(r => r.estado === 'confirmada').length * cancha.valorHora
        };
    });

    const porBloque = BLOQUES.reduce((acc, bloque) => {
        acc[bloque] = vivas.filter(r => r.bloque === bloque).length;
        return acc;
    }, {} as Record<string, number>);

    const masPedido = Object.entries(porBloque).sort((a, b) => b[1] - a[1])[0];

    // Bloques posibles = canchas activas × bloques del día × días con movimiento.
    const dias = new Set(vivas.map(r => r.fecha)).size;
    const cupos = canchas.filter(c => c.activa).length * BLOQUES.length * (dias || 1);

    res.json({
        total: reservas.length,
        porEstado,
        porCancha,
        porBloque,
        bloqueMasPedido: masPedido && masPedido[1] > 0 ? masPedido[0] : null,
        ingresoConfirmado: porCancha.reduce((suma, c) => suma + c.ingreso, 0),
        ocupacion: Number(((vivas.length / cupos) * 100).toFixed(1)),
        diasConReservas: dias,
        generadoEn: marcaDeTiempo()
    });
});

/* ==================================================================== */
/* GET /api/reservas — PÚBLICO. Filtros, búsqueda, orden y paginación.   */
/*                                                                       */
/* Responde { datos, meta }, igual que /api/tickets.                     */
/*                                                                       */
/* Cada reserva viaja con `canchaNombre` ya resuelto. Es una comodidad   */
/* deliberada: así puedes pintar la tabla sin cruzar los dos módulos,    */
/* y cuando en el formulario SÍ necesites el módulo `canchas`, la        */
/* diferencia entre las dos situaciones va a quedar clarísima.           */
/* ==================================================================== */
router.get('/', (req: Request, res: Response) => {
    const {
        estado, canchaId, fecha, buscar,
        orden = 'fecha',
        pagina = '1',
        porPagina = '6'
    } = req.query as Record<string, string>;

    let resultado = [...reservas];

    if (estado) {
        if (!ESTADOS_RESERVA.includes(estado as EstadoReserva)) {
            return res.status(400).json({
                message: `Filtro de estado inválido. Valores aceptados: ${ESTADOS_RESERVA.join(', ')}.`
            });
        }
        resultado = resultado.filter(r => r.estado === estado);
    }

    if (canchaId) {
        const id = Number(canchaId);

        if (!Number.isInteger(id) || !canchas.some(c => c.id === id)) {
            return res.status(400).json({
                message: `Filtro de cancha inválido: no existe la cancha ${canchaId}.`
            });
        }
        resultado = resultado.filter(r => r.canchaId === id);
    }

    if (fecha) {
        if (!esFechaValida(fecha)) {
            return res.status(400).json({
                message: 'El filtro "fecha" debe tener el formato AAAA-MM-DD y ser una fecha real.'
            });
        }
        resultado = resultado.filter(r => r.fecha === fecha);
    }

    if (buscar) {
        const q = buscar.toLowerCase();
        resultado = resultado.filter(r =>
            r.cliente.toLowerCase().includes(q) ||
            r.codigo.toLowerCase().includes(q) ||
            r.telefono.includes(q) ||
            nombreCancha(r.canchaId).toLowerCase().includes(q)
        );
    }

    if (orden === 'cliente') {
        resultado.sort((a, b) => a.cliente.localeCompare(b.cliente, 'es'));
    } else if (orden === 'recientes') {
        resultado.sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
    } else {
        // Por fecha y, dentro del mismo día, por hora.
        resultado.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.bloque.localeCompare(b.bloque));
    }

    const total = resultado.length;
    const tam = Math.min(Math.max(parseInt(porPagina, 10) || 6, 1), 50);
    const totalPaginas = Math.max(Math.ceil(total / tam), 1);
    const pag = Math.min(Math.max(parseInt(pagina, 10) || 1, 1), totalPaginas);
    const desde = (pag - 1) * tam;

    res.setHeader('X-Total-Registros', String(total));

    res.json({
        datos: resultado.slice(desde, desde + tam).map(r => ({
            ...r,
            canchaNombre: nombreCancha(r.canchaId)
        })),
        meta: {
            pagina: pag,
            porPagina: tam,
            total,
            totalPaginas,
            hayAnterior: pag > 1,
            haySiguiente: pag < totalPaginas
        }
    });
});

/* ==================================================================== */
/* GET /api/reservas/:id — PÚBLICO                                       */
/* ==================================================================== */
router.get('/:id', (req: Request, res: Response) => {
    const reserva = buscarReserva(req.params.id);

    if (!reserva) {
        return res.status(404).json({ message: `No existe la reserva con id ${req.params.id}.` });
    }

    res.json({ ...reserva, canchaNombre: nombreCancha(reserva.canchaId) });
});

/* ==================================================================== */
/* POST /api/reservas — PROTEGIDO                                        */
/*                                                                       */
/* Aquí conviven los dos errores que hay que saber distinguir:           */
/*                                                                       */
/*   422 → escribiste algo mal. Se arregla en el formulario.             */
/*   409 → escribiste todo bien, pero alguien llegó antes. No se arregla */
/*         corrigiendo un campo: hay que elegir otro horario.            */
/* ==================================================================== */
router.post('/', authenticateJWT, (req: AuthRequest, res: Response) => {
    const errores = validarReserva(req.body);

    if (Object.keys(errores).length > 0) {
        return res.status(422).json({
            message: 'Algunos campos tienen problemas. Revísalos.',
            errores
        });
    }

    const canchaId = Number(req.body.canchaId);
    const fecha = String(req.body.fecha).trim();
    const bloque = req.body.bloque;

    const choque = buscarChoque(canchaId, fecha, bloque, null);
    if (choque) return respuestaChoque(res, choque);

    const id = nuevoIdReserva();
    const ahora = marcaDeTiempo();

    const nueva: Reserva = {
        id,
        codigo: generarCodigoReserva(id),
        canchaId,
        cliente: String(req.body.cliente).trim(),
        telefono: String(req.body.telefono).trim(),
        fecha,
        bloque,
        jugadores: Number(req.body.jugadores),
        estado: req.body.estado ?? 'pendiente',
        comentario: req.body.comentario ? String(req.body.comentario).trim() : null,
        creadoEn: ahora,
        actualizadoEn: ahora
    };

    reservas.push(nueva);

    res.setHeader('Location', `/api/reservas/${nueva.id}`);
    res.status(201).json({ ...nueva, canchaNombre: nombreCancha(nueva.canchaId) });
});

/* ==================================================================== */
/* PUT /api/reservas/:id — PROTEGIDO. REEMPLAZO TOTAL.                   */
/*                                                                       */
/* Exige el cuerpo completo. Lo que no mandes se pierde: `comentario`    */
/* vuelve a null y `estado` vuelve a "pendiente".                        */
/* ==================================================================== */
router.put('/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
    const reserva = buscarReserva(req.params.id);

    if (!reserva) {
        return res.status(404).json({ message: `No existe la reserva con id ${req.params.id}.` });
    }

    if (reserva.estado === 'cancelada') {
        return res.status(409).json({
            message: 'No se puede modificar una reserva cancelada. Crea una nueva.',
            estadoActual: reserva.estado
        });
    }

    const errores = validarReserva(req.body, false);
    if (Object.keys(errores).length > 0) {
        return res.status(422).json({
            message: 'PUT reemplaza el recurso completo: faltan campos obligatorios.',
            errores
        });
    }

    const canchaId = Number(req.body.canchaId);
    const fecha = String(req.body.fecha).trim();
    const bloque = req.body.bloque;

    const choque = buscarChoque(canchaId, fecha, bloque, reserva.id);
    if (choque) return respuestaChoque(res, choque);

    reserva.canchaId = canchaId;
    reserva.cliente = String(req.body.cliente).trim();
    reserva.telefono = String(req.body.telefono).trim();
    reserva.fecha = fecha;
    reserva.bloque = bloque;
    reserva.jugadores = Number(req.body.jugadores);
    reserva.estado = req.body.estado ?? 'pendiente';
    reserva.comentario = req.body.comentario ? String(req.body.comentario).trim() : null;
    reserva.actualizadoEn = marcaDeTiempo();

    res.json({ ...reserva, canchaNombre: nombreCancha(reserva.canchaId) });
});

/* ==================================================================== */
/* PATCH /api/reservas/:id — PROTEGIDO. Actualización parcial.           */
/*                                                                       */
/* Es el verbo que usa la aplicación para confirmar o cancelar:          */
/*   PATCH { "estado": "confirmada" }                                    */
/*   PATCH { "estado": "cancelada" }                                     */
/*                                                                       */
/* Cancelar libera el horario, así que después de un PATCH a cancelada   */
/* ese bloque vuelve a estar disponible para otro cliente.               */
/* ==================================================================== */
router.patch('/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
    const reserva = buscarReserva(req.params.id);

    if (!reserva) {
        return res.status(404).json({ message: `No existe la reserva con id ${req.params.id}.` });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(422).json({
            message: 'PATCH necesita al menos un campo que cambiar.',
            errores: { cuerpo: 'El cuerpo de la petición está vacío.' }
        });
    }

    // Reactivar una reserva cancelada sí se permite: es el único cambio
    // que tiene sentido sobre ella, y vuelve a competir por el horario.
    const soloEstado = Object.keys(req.body).length === 1 && req.body.estado !== undefined;

    if (reserva.estado === 'cancelada' && !soloEstado) {
        return res.status(409).json({
            message: 'Una reserva cancelada sólo admite un cambio de estado.',
            estadoActual: reserva.estado
        });
    }

    const errores = validarReserva(req.body, true);
    if (Object.keys(errores).length > 0) {
        return res.status(422).json({ message: 'Algunos campos tienen problemas. Revísalos.', errores });
    }

    const canchaId = req.body.canchaId !== undefined ? Number(req.body.canchaId) : reserva.canchaId;
    const fecha = req.body.fecha !== undefined ? String(req.body.fecha).trim() : reserva.fecha;
    const bloque = req.body.bloque !== undefined ? req.body.bloque : reserva.bloque;
    const estado = req.body.estado !== undefined ? req.body.estado : reserva.estado;

    // Sólo se compite por el horario si la reserva va a quedar viva.
    if (estado !== 'cancelada') {
        const choque = buscarChoque(canchaId, fecha, bloque, reserva.id);
        if (choque) return respuestaChoque(res, choque);
    }

    const permitidos = ['cliente', 'telefono', 'bloque', 'estado', 'comentario'] as const;

    permitidos.forEach(campo => {
        if (req.body[campo] === undefined) return;

        const valor = req.body[campo];
        (reserva as any)[campo] = typeof valor === 'string' ? valor.trim() : valor;
    });

    if (req.body.canchaId !== undefined) reserva.canchaId = canchaId;
    if (req.body.fecha !== undefined) reserva.fecha = fecha;
    if (req.body.jugadores !== undefined) reserva.jugadores = Number(req.body.jugadores);
    if (req.body.comentario === null || req.body.comentario === '') reserva.comentario = null;

    reserva.actualizadoEn = marcaDeTiempo();

    res.json({ ...reserva, canchaNombre: nombreCancha(reserva.canchaId) });
});

/* ==================================================================== */
/* DELETE /api/reservas/:id — PROTEGIDO                                  */
/*                                                                       */
/* A diferencia de tickets y personas, no exige rol admin: en la         */
/* Lección 3 el tema es el estado en el cliente, no los permisos.        */
/* ==================================================================== */
router.delete('/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
    const indice = reservas.findIndex(r => r.id === idDesde(req.params.id));

    if (indice === -1) {
        return res.status(404).json({ message: `No existe la reserva con id ${req.params.id}.` });
    }

    const [eliminada] = reservas.splice(indice, 1);

    res.json({ message: `Reserva ${eliminada.codigo} eliminada.`, id: eliminada.id });
});

export default router;
