import { Router, type Request, type Response } from 'express';
import { canchas } from '../data/store.js';
import { SUPERFICIES } from '../models/reserva.model.js';

/* ==================================================================== */
/* RECURSO: CANCHAS — sólo lectura                                       */
/*                                                                       */
/* Un catálogo. No hay POST, PUT ni DELETE: construir o demoler una      */
/* cancha no es algo que se haga desde una aplicación web.               */
/*                                                                       */
/* Existe para dos cosas concretas en el frontend:                       */
/*                                                                       */
/*   1. Poblar el <select> del formulario de reservas.                   */
/*   2. Traducir `canchaId: 3` a "Cancha 3 · Aire libre" en la tabla.    */
/*                                                                       */
/* Esas dos cosas son las que obligan al módulo `reservas` de Vuex a     */
/* hablar con el módulo `canchas`. Sin esta relación, partir el store    */
/* en módulos sería una decisión cosmética.                              */
/* ==================================================================== */

const router = Router();

const idDesde = (valor: unknown): number => Number(String(valor));

/* ------------------------------------------------------------------ */
/* GET /api/canchas — PÚBLICO. Arreglo directo, sin envoltorio.        */
/* ------------------------------------------------------------------ */
router.get('/', (req: Request, res: Response) => {
    const { activa, superficie } = req.query as Record<string, string>;

    let resultado = [...canchas];

    if (activa !== undefined && activa !== '') {
        if (activa !== 'true' && activa !== 'false') {
            return res.status(400).json({
                message: 'El filtro "activa" sólo acepta true o false.'
            });
        }
        resultado = resultado.filter(c => c.activa === (activa === 'true'));
    }

    if (superficie) {
        if (!SUPERFICIES.includes(superficie as any)) {
            return res.status(400).json({
                message: `Filtro de superficie inválido. Valores aceptados: ${SUPERFICIES.join(', ')}.`
            });
        }
        resultado = resultado.filter(c => c.superficie === superficie);
    }

    res.json(resultado);
});

/* ------------------------------------------------------------------ */
/* GET /api/canchas/:id — PÚBLICO                                      */
/* ------------------------------------------------------------------ */
router.get('/:id', (req: Request, res: Response) => {
    const cancha = canchas.find(c => c.id === idDesde(req.params.id));

    if (!cancha) {
        return res.status(404).json({ message: `No existe la cancha con id ${req.params.id}.` });
    }

    res.json(cancha);
});

export default router;
