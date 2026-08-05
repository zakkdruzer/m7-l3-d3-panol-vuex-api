import { Router, type Request, type Response } from 'express';
import { equipos, prestamos } from '../data/store.js';
import { CATEGORIAS_EQUIPO, ESTADOS_VIVOS, type Equipo } from '../models/prestamo.model.js';

/* ==================================================================== */
/* RECURSO: EQUIPOS — sólo lectura                                       */
/*                                                                       */
/* Catálogo del pañol. No hay POST ni DELETE: dar de alta un equipo es   */
/* un trámite de inventario, no algo que se haga desde esta aplicación.  */
/*                                                                       */
/* Lo interesante está en `disponibles`. No es un campo guardado: se     */
/* CALCULA en cada consulta restando las unidades comprometidas en       */
/* préstamos vivos.                                                      */
/*                                                                       */
/* Y ese cálculo tiene que vivir acá, en el servidor. El navegador de    */
/* un usuario no conoce los préstamos que están pidiendo los demás en    */
/* este mismo instante. Puede mostrar el número que le dieron; no puede  */
/* garantizar que siga siendo cierto medio segundo después.              */
/* ==================================================================== */

const router = Router();

const idDesde = (valor: unknown): number => Number(String(valor));

/**
 * Unidades de un equipo que están fuera del pañol ahora mismo.
 *
 * Suma la cantidad de todos los préstamos en estado `pendiente` o
 * `entregado`. Los `devuelto` no cuentan: ya volvieron.
 */
export function unidadesComprometidas(equipoId: number, excluyendoPrestamo: number | null = null): number {
    return prestamos
        .filter(p =>
            p.equipoId === equipoId &&
            ESTADOS_VIVOS.includes(p.estado) &&
            p.id !== excluyendoPrestamo
        )
        .reduce((suma, p) => suma + p.cantidad, 0);
}

/** El equipo con su disponibilidad real resuelta. */
export function conDisponibilidad(equipo: Equipo, excluyendoPrestamo: number | null = null) {
    const comprometidas = unidadesComprometidas(equipo.id, excluyendoPrestamo);

    return {
        ...equipo,
        comprometidas,
        disponibles: Math.max(0, equipo.stockTotal - comprometidas)
    };
}

/* ------------------------------------------------------------------ */
/* GET /api/equipos — PÚBLICO. Arreglo directo.                        */
/* ------------------------------------------------------------------ */
router.get('/', (req: Request, res: Response) => {
    const { categoria, operativo, conStock } = req.query as Record<string, string>;

    let resultado = equipos.map(e => conDisponibilidad(e));

    if (categoria) {
        if (!CATEGORIAS_EQUIPO.includes(categoria as any)) {
            return res.status(400).json({
                message: `Filtro de categoría inválido. Valores aceptados: ${CATEGORIAS_EQUIPO.join(', ')}.`
            });
        }
        resultado = resultado.filter(e => e.categoria === categoria);
    }

    if (operativo !== undefined && operativo !== '') {
        if (operativo !== 'true' && operativo !== 'false') {
            return res.status(400).json({ message: 'El filtro "operativo" sólo acepta true o false.' });
        }
        resultado = resultado.filter(e => e.operativo === (operativo === 'true'));
    }

    if (conStock === 'true') {
        resultado = resultado.filter(e => e.disponibles > 0);
    }

    res.json(resultado);
});

/* ------------------------------------------------------------------ */
/* GET /api/equipos/categorias — PÚBLICO                               */
/*                                                                     */
/* Para poblar el <select> sin escribir las opciones a mano.           */
/* OJO AL ORDEN: va ANTES que /:id.                                    */
/* ------------------------------------------------------------------ */
router.get('/categorias', (req: Request, res: Response) => {
    res.json({
        categorias: CATEGORIAS_EQUIPO.map(valor => ({
            valor,
            etiqueta: valor.charAt(0).toUpperCase() + valor.slice(1).replace(/_/g, ' ')
        }))
    });
});

/* ------------------------------------------------------------------ */
/* GET /api/equipos/:id — PÚBLICO                                      */
/* ------------------------------------------------------------------ */
router.get('/:id', (req: Request, res: Response) => {
    const equipo = equipos.find(e => e.id === idDesde(req.params.id));

    if (!equipo) {
        return res.status(404).json({ message: `No existe el equipo con id ${req.params.id}.` });
    }

    res.json(conDisponibilidad(equipo));
});

export default router;
