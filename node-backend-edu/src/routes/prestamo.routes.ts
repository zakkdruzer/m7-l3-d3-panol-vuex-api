import { Router, type Request, type Response } from 'express';
import { authenticateJWT, type AuthRequest } from '../middleware/auth.middleware.js';
import {
    prestamos, equipos, nuevoIdPrestamo, generarCodigoPrestamo, marcaDeTiempo
} from '../data/store.js';
import {
    ESTADOS_PRESTAMO, ESTADOS_VIVOS, CATEGORIAS_EQUIPO,
    type Prestamo, type EstadoPrestamo
} from '../models/prestamo.model.js';
import { unidadesComprometidas } from './equipo.routes.js';

/* ==================================================================== */
/* RECURSO: PRÉSTAMOS                                                    */
/*                                                                       */
/* CRUD para la ACTIVIDAD PRÁCTICA de la Lección 3.                      */
/*                                                                       */
/* Estructura igual a /api/reservas — un catálogo del que depende un     */
/* CRUD — pero con una regla de negocio de otra naturaleza:              */
/*                                                                       */
/*   Reservas → 409 por COLISIÓN: esa cancha, ese día, esa hora.         */
/*              Pregunta de sí o no.                                     */
/*                                                                       */
/*   Préstamos → 409 por STOCK: la suma de todo lo que está fuera        */
/*               supera las unidades que existen.                        */
/*               Pregunta de cuántos quedan.                             */
/*                                                                       */
/* El alumno que intente resolver esto copiando el código del recinto    */
/* va a chocar de frente, y ahí está la gracia.                          */
/* ==================================================================== */

const router = Router();

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

const idDesde = (valor: unknown): number => Number(String(valor));
const buscarPrestamo = (valor: unknown) => prestamos.find(p => p.id === idDesde(valor));

const nombreEquipo = (equipoId: number) =>
    equipos.find(e => e.id === equipoId)?.nombre ?? `Equipo ${equipoId}`;

const hoy = () => new Date().toISOString().slice(0, 10);

function esFechaValida(texto: string): boolean {
    if (!FORMATO_FECHA.test(texto)) return false;

    const fecha = new Date(`${texto}T00:00:00.000Z`);
    return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === texto;
}

/**
 * Enriquece un préstamo con lo que el cliente no puede calcular solo.
 *
 * `atrasado` no se guarda: se deduce comparando la fecha comprometida
 * con el día de HOY según el servidor. Guardarlo obligaría a tener un
 * proceso que recorra la base todas las noches cambiando estados.
 */
function vestir(p: Prestamo) {
    const equipo = equipos.find(e => e.id === p.equipoId);

    return {
        ...p,
        equipoNombre: nombreEquipo(p.equipoId),
        equipoCategoria: equipo?.categoria ?? null,
        atrasado: p.estado === 'entregado' && p.fechaDevolucion < hoy(),
        diasAtraso: p.estado === 'entregado' && p.fechaDevolucion < hoy()
            ? Math.ceil((Date.parse(hoy()) - Date.parse(p.fechaDevolucion)) / 86_400_000)
            : 0,
        valorComprometido: (equipo?.valorUnitario ?? 0) * p.cantidad
    };
}

/* ------------------------------------------------------------------ */
/* Validación: devuelve un mapa campo → mensaje                        */
/* ------------------------------------------------------------------ */
function validarPrestamo(cuerpo: any, parcial = false): Record<string, string> {
    const errores: Record<string, string> = {};
    const tiene = (campo: string) => cuerpo?.[campo] !== undefined;

    if (!parcial || tiene('equipoId')) {
        const equipoId = Number(cuerpo?.equipoId);

        if (!Number.isInteger(equipoId)) {
            errores.equipoId = 'Debes elegir un equipo.';
        } else {
            const equipo = equipos.find(e => e.id === equipoId);

            if (!equipo) {
                errores.equipoId = `No existe el equipo con id ${cuerpo.equipoId}.`;
            } else if (!equipo.operativo) {
                // 422 y no 409: el arreglo es elegir otra opción del selector.
                // El mensaje va debajo del <select>, no en una caja aparte.
                errores.equipoId = `${equipo.nombre} está en mantención y no se puede prestar.`;
            }
        }
    }

    if (!parcial || tiene('solicitante')) {
        const s = cuerpo?.solicitante;
        if (typeof s !== 'string' || s.trim().length < 3) {
            errores.solicitante = 'El nombre de quien retira es obligatorio (mínimo 3 caracteres).';
        } else if (s.trim().length > 60) {
            errores.solicitante = 'El nombre no puede superar los 60 caracteres.';
        }
    }

    if (!parcial || tiene('area')) {
        const a = cuerpo?.area;
        if (typeof a !== 'string' || a.trim().length < 3) {
            errores.area = 'El área o asignatura que respalda el préstamo es obligatoria.';
        }
    }

    if (!parcial || tiene('cantidad')) {
        const c = Number(cuerpo?.cantidad);
        if (!Number.isInteger(c) || c < 1 || c > 20) {
            errores.cantidad = 'La cantidad debe ser un número entero entre 1 y 20.';
        }
    }

    if (!parcial || tiene('fechaRetiro')) {
        const f = cuerpo?.fechaRetiro;
        if (typeof f !== 'string' || !esFechaValida(f.trim())) {
            errores.fechaRetiro = 'La fecha de retiro es obligatoria, con formato AAAA-MM-DD y debe existir.';
        }
    }

    if (!parcial || tiene('fechaDevolucion')) {
        const f = cuerpo?.fechaDevolucion;
        if (typeof f !== 'string' || !esFechaValida(f.trim())) {
            errores.fechaDevolucion = 'La fecha de devolución es obligatoria, con formato AAAA-MM-DD y debe existir.';
        }
    }

    // Regla que cruza DOS campos. Sólo tiene sentido si los dos son válidos.
    if (!errores.fechaRetiro && !errores.fechaDevolucion) {
        const retiro = cuerpo?.fechaRetiro;
        const devolucion = cuerpo?.fechaDevolucion;

        if (typeof retiro === 'string' && typeof devolucion === 'string' && devolucion < retiro) {
            errores.fechaDevolucion = 'La devolución no puede ser anterior al retiro.';
        }
    }

    if (tiene('estado') && !ESTADOS_PRESTAMO.includes(cuerpo.estado)) {
        errores.estado = `El estado debe ser uno de: ${ESTADOS_PRESTAMO.join(', ')}.`;
    }

    if (tiene('observacion') && cuerpo.observacion !== null && cuerpo.observacion !== '') {
        if (typeof cuerpo.observacion !== 'string' || cuerpo.observacion.trim().length > 200) {
            errores.observacion = 'La observación no puede superar los 200 caracteres.';
        }
    }

    return errores;
}

/**
 * ¿Alcanza el stock para esta petición?
 *
 * Devuelve null si alcanza, o el detalle del faltante si no.
 *
 * `excluyendo` es el propio préstamo cuando se está editando: sin eso,
 * subir de 4 a 5 unidades compararía contra un stock que ya descuenta
 * las 4 que ese mismo préstamo tiene tomadas, y nunca alcanzaría.
 */
function revisarStock(equipoId: number, cantidad: number, excluyendo: number | null) {
    const equipo = equipos.find(e => e.id === equipoId);
    if (!equipo) return null;

    const comprometidas = unidadesComprometidas(equipoId, excluyendo);
    const disponibles = Math.max(0, equipo.stockTotal - comprometidas);

    if (cantidad <= disponibles) return null;

    return {
        equipo: equipo.nombre,
        solicitadas: cantidad,
        disponibles,
        comprometidas,
        stockTotal: equipo.stockTotal
    };
}

/** Respuesta 409 uniforme para la falta de stock. */
const respuestaSinStock = (res: Response, faltante: NonNullable<ReturnType<typeof revisarStock>>) =>
    res.status(409).json({
        message:
            `No hay unidades suficientes de ${faltante.equipo}. ` +
            `Pediste ${faltante.solicitadas} y ${faltante.disponibles === 0 ? 'no queda ninguna' : `sólo quedan ${faltante.disponibles}`}.`,
        stock: faltante
    });

/* ==================================================================== */
/* GET /api/prestamos/opciones — PÚBLICO                                 */
/*                                                                       */
/* Estados y categorías para los <select>. Va ANTES que /:id.            */
/* ==================================================================== */
router.get('/opciones', (req: Request, res: Response) => {
    res.json({
        estados: ESTADOS_PRESTAMO,
        estadosVivos: ESTADOS_VIVOS,
        categorias: CATEGORIAS_EQUIPO
    });
});

/* ==================================================================== */
/* GET /api/prestamos/resumen — PÚBLICO. Estadísticas del pañol.         */
/*                                                                       */
/* Igual que en reservas: estas cifras se calculan sobre TODA la base,   */
/* no sobre la página que el cliente tenga cargada.                      */
/* ==================================================================== */
router.get('/resumen', (req: Request, res: Response) => {
    const vivos = prestamos.filter(p => ESTADOS_VIVOS.includes(p.estado));
    const atrasados = prestamos.filter(p => p.estado === 'entregado' && p.fechaDevolucion < hoy());

    const porEstado = ESTADOS_PRESTAMO.reduce((acc, estado) => {
        acc[estado] = prestamos.filter(p => p.estado === estado).length;
        return acc;
    }, {} as Record<string, number>);

    const porEquipo = equipos.map(equipo => {
        const comprometidas = unidadesComprometidas(equipo.id);

        return {
            equipoId: equipo.id,
            nombre: equipo.nombre,
            categoria: equipo.categoria,
            stockTotal: equipo.stockTotal,
            comprometidas,
            disponibles: Math.max(0, equipo.stockTotal - comprometidas),
            // Cuánto de su inventario está fuera, en porcentaje.
            usoPorcentaje: equipo.stockTotal
                ? Number(((comprometidas / equipo.stockTotal) * 100).toFixed(1))
                : 0
        };
    });

    const porCategoria = CATEGORIAS_EQUIPO.reduce((acc, categoria) => {
        const ids = equipos.filter(e => e.categoria === categoria).map(e => e.id);
        acc[categoria] = vivos.filter(p => ids.includes(p.equipoId)).length;
        return acc;
    }, {} as Record<string, number>);

    const valorEnCirculacion = vivos.reduce((suma, p) => {
        const equipo = equipos.find(e => e.id === p.equipoId);
        return suma + (equipo?.valorUnitario ?? 0) * p.cantidad;
    }, 0);

    res.json({
        total: prestamos.length,
        porEstado,
        porEquipo,
        porCategoria,
        unidadesFuera: vivos.reduce((suma, p) => suma + p.cantidad, 0),
        atrasados: atrasados.length,
        valorEnCirculacion,
        equipoMasPedido: [...porEquipo].sort((a, b) => b.comprometidas - a.comprometidas)[0]?.nombre ?? null,
        generadoEn: marcaDeTiempo()
    });
});

/* ==================================================================== */
/* GET /api/prestamos — PÚBLICO. Filtros, búsqueda, orden y paginación.  */
/*                                                                       */
/* Responde { datos, meta }.                                             */
/* ==================================================================== */
router.get('/', (req: Request, res: Response) => {
    const {
        estado, equipoId, categoria, atrasados, buscar,
        orden = 'recientes',
        pagina = '1',
        porPagina = '6'
    } = req.query as Record<string, string>;

    let resultado = prestamos.map(vestir);

    if (estado) {
        if (!ESTADOS_PRESTAMO.includes(estado as EstadoPrestamo)) {
            return res.status(400).json({
                message: `Filtro de estado inválido. Valores aceptados: ${ESTADOS_PRESTAMO.join(', ')}.`
            });
        }
        resultado = resultado.filter(p => p.estado === estado);
    }

    if (equipoId) {
        const id = Number(equipoId);

        if (!Number.isInteger(id) || !equipos.some(e => e.id === id)) {
            return res.status(400).json({
                message: `Filtro de equipo inválido: no existe el equipo ${equipoId}.`
            });
        }
        resultado = resultado.filter(p => p.equipoId === id);
    }

    if (categoria) {
        if (!CATEGORIAS_EQUIPO.includes(categoria as any)) {
            return res.status(400).json({
                message: `Filtro de categoría inválido. Valores aceptados: ${CATEGORIAS_EQUIPO.join(', ')}.`
            });
        }
        resultado = resultado.filter(p => p.equipoCategoria === categoria);
    }

    if (atrasados !== undefined && atrasados !== '') {
        if (atrasados !== 'true' && atrasados !== 'false') {
            return res.status(400).json({ message: 'El filtro "atrasados" sólo acepta true o false.' });
        }
        resultado = resultado.filter(p => p.atrasado === (atrasados === 'true'));
    }

    if (buscar) {
        const q = buscar.toLowerCase();
        resultado = resultado.filter(p =>
            p.solicitante.toLowerCase().includes(q) ||
            p.area.toLowerCase().includes(q) ||
            p.codigo.toLowerCase().includes(q) ||
            p.equipoNombre.toLowerCase().includes(q)
        );
    }

    if (orden === 'solicitante') {
        resultado.sort((a, b) => a.solicitante.localeCompare(b.solicitante, 'es'));
    } else if (orden === 'devolucion') {
        resultado.sort((a, b) => a.fechaDevolucion.localeCompare(b.fechaDevolucion));
    } else if (orden === 'cantidad') {
        resultado.sort((a, b) => b.cantidad - a.cantidad);
    } else {
        resultado.sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
    }

    const total = resultado.length;
    const tam = Math.min(Math.max(parseInt(porPagina, 10) || 6, 1), 50);
    const totalPaginas = Math.max(Math.ceil(total / tam), 1);
    const pag = Math.min(Math.max(parseInt(pagina, 10) || 1, 1), totalPaginas);
    const desde = (pag - 1) * tam;

    res.setHeader('X-Total-Registros', String(total));

    res.json({
        datos: resultado.slice(desde, desde + tam),
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
/* GET /api/prestamos/:id — PÚBLICO                                      */
/* ==================================================================== */
router.get('/:id', (req: Request, res: Response) => {
    const prestamo = buscarPrestamo(req.params.id);

    if (!prestamo) {
        return res.status(404).json({ message: `No existe el préstamo con id ${req.params.id}.` });
    }

    res.json(vestir(prestamo));
});

/* ==================================================================== */
/* POST /api/prestamos — PROTEGIDO                                       */
/*                                                                       */
/* Los dos errores que hay que distinguir:                               */
/*                                                                       */
/*   422 → un campo está mal escrito. Se corrige en el formulario.       */
/*   409 → todo está bien escrito, pero no quedan unidades suficientes.  */
/*         No hay campo culpable: hay que pedir menos o esperar.         */
/* ==================================================================== */
router.post('/', authenticateJWT, (req: AuthRequest, res: Response) => {
    const errores = validarPrestamo(req.body);

    if (Object.keys(errores).length > 0) {
        return res.status(422).json({
            message: 'Algunos campos tienen problemas. Revísalos.',
            errores
        });
    }

    const equipoId = Number(req.body.equipoId);
    const cantidad = Number(req.body.cantidad);

    const faltante = revisarStock(equipoId, cantidad, null);
    if (faltante) return respuestaSinStock(res, faltante);

    const id = nuevoIdPrestamo();
    const ahora = marcaDeTiempo();

    const nuevo: Prestamo = {
        id,
        codigo: generarCodigoPrestamo(id),
        equipoId,
        solicitante: String(req.body.solicitante).trim(),
        area: String(req.body.area).trim(),
        cantidad,
        fechaRetiro: String(req.body.fechaRetiro).trim(),
        fechaDevolucion: String(req.body.fechaDevolucion).trim(),
        estado: req.body.estado ?? 'pendiente',
        observacion: req.body.observacion ? String(req.body.observacion).trim() : null,
        creadoEn: ahora,
        actualizadoEn: ahora
    };

    prestamos.push(nuevo);

    res.setHeader('Location', `/api/prestamos/${nuevo.id}`);
    res.status(201).json(vestir(nuevo));
});

/* ==================================================================== */
/* PUT /api/prestamos/:id — PROTEGIDO. REEMPLAZO TOTAL.                  */
/* ==================================================================== */
router.put('/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
    const prestamo = buscarPrestamo(req.params.id);

    if (!prestamo) {
        return res.status(404).json({ message: `No existe el préstamo con id ${req.params.id}.` });
    }

    if (prestamo.estado === 'devuelto') {
        return res.status(409).json({
            message: 'Un préstamo ya devuelto no se modifica. Crea uno nuevo.',
            estadoActual: prestamo.estado
        });
    }

    const errores = validarPrestamo(req.body, false);
    if (Object.keys(errores).length > 0) {
        return res.status(422).json({
            message: 'PUT reemplaza el recurso completo: faltan campos obligatorios.',
            errores
        });
    }

    const equipoId = Number(req.body.equipoId);
    const cantidad = Number(req.body.cantidad);
    const estado: EstadoPrestamo = req.body.estado ?? 'pendiente';

    // Sólo se compite por el stock si el préstamo va a seguir vivo.
    if (ESTADOS_VIVOS.includes(estado)) {
        const faltante = revisarStock(equipoId, cantidad, prestamo.id);
        if (faltante) return respuestaSinStock(res, faltante);
    }

    prestamo.equipoId = equipoId;
    prestamo.solicitante = String(req.body.solicitante).trim();
    prestamo.area = String(req.body.area).trim();
    prestamo.cantidad = cantidad;
    prestamo.fechaRetiro = String(req.body.fechaRetiro).trim();
    prestamo.fechaDevolucion = String(req.body.fechaDevolucion).trim();
    prestamo.estado = estado;
    prestamo.observacion = req.body.observacion ? String(req.body.observacion).trim() : null;
    prestamo.actualizadoEn = marcaDeTiempo();

    res.json(vestir(prestamo));
});

/* ==================================================================== */
/* PATCH /api/prestamos/:id — PROTEGIDO. Actualización parcial.          */
/*                                                                       */
/* Es el verbo del flujo de mesón:                                       */
/*   PATCH { "estado": "entregado" }  → lo retiran                       */
/*   PATCH { "estado": "devuelto"  }  → vuelve y LIBERA el stock         */
/* ==================================================================== */
router.patch('/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
    const prestamo = buscarPrestamo(req.params.id);

    if (!prestamo) {
        return res.status(404).json({ message: `No existe el préstamo con id ${req.params.id}.` });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(422).json({
            message: 'PATCH necesita al menos un campo que cambiar.',
            errores: { cuerpo: 'El cuerpo de la petición está vacío.' }
        });
    }

    // Un préstamo devuelto está cerrado. Ni siquiera se puede reabrir:
    // si el equipo vuelve a salir, es un préstamo nuevo con su propio
    // registro. Ésta es una diferencia deliberada con las reservas,
    // donde cancelar sí se puede deshacer.
    if (prestamo.estado === 'devuelto') {
        return res.status(409).json({
            message: 'Un préstamo ya devuelto está cerrado y no admite cambios.',
            estadoActual: prestamo.estado
        });
    }

    const errores = validarPrestamo(req.body, true);
    if (Object.keys(errores).length > 0) {
        return res.status(422).json({ message: 'Algunos campos tienen problemas. Revísalos.', errores });
    }

    const equipoId = req.body.equipoId !== undefined ? Number(req.body.equipoId) : prestamo.equipoId;
    const cantidad = req.body.cantidad !== undefined ? Number(req.body.cantidad) : prestamo.cantidad;
    const estado: EstadoPrestamo = req.body.estado !== undefined ? req.body.estado : prestamo.estado;

    if (ESTADOS_VIVOS.includes(estado)) {
        const faltante = revisarStock(equipoId, cantidad, prestamo.id);
        if (faltante) return respuestaSinStock(res, faltante);
    }

    const permitidos = ['solicitante', 'area', 'fechaRetiro', 'fechaDevolucion', 'estado', 'observacion'] as const;

    permitidos.forEach(campo => {
        if (req.body[campo] === undefined) return;

        const valor = req.body[campo];
        (prestamo as any)[campo] = typeof valor === 'string' ? valor.trim() : valor;
    });

    if (req.body.equipoId !== undefined) prestamo.equipoId = equipoId;
    if (req.body.cantidad !== undefined) prestamo.cantidad = cantidad;
    if (req.body.observacion === null || req.body.observacion === '') prestamo.observacion = null;

    prestamo.actualizadoEn = marcaDeTiempo();

    res.json(vestir(prestamo));
});

/* ==================================================================== */
/* DELETE /api/prestamos/:id — PROTEGIDO                                 */
/* ==================================================================== */
router.delete('/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
    const indice = prestamos.findIndex(p => p.id === idDesde(req.params.id));

    if (indice === -1) {
        return res.status(404).json({ message: `No existe el préstamo con id ${req.params.id}.` });
    }

    const [eliminado] = prestamos.splice(indice, 1);

    res.json({ message: `Préstamo ${eliminado.codigo} eliminado.`, id: eliminado.id });
});

export default router;
