import { Router, type Response } from 'express';
import { authenticateJWT, type AuthRequest } from '../middleware/auth.middleware.js';
import { notas, nuevoIdNota, marcaDeTiempo } from '../data/store.js';
import { type NotaCifrada } from '../models/ticket.model.js';
import { validarPaqueteCifrado } from '../utils/paquete.util.js';

const router = Router();

/**
 * Notas internas de conocimiento cero.
 *
 * El servidor guarda el paquete cifrado tal cual llega y NO puede leerlo:
 * la frase de paso nunca sale del navegador del usuario. Si alguien roba
 * esta base de datos, se lleva ruido.
 *
 * Por eso el servidor SÓLO valida la FORMA del paquete, nunca su contenido.
 */

function validarPaquete(cuerpo: any): Record<string, string> {
    // La validación de forma del paquete vive en un solo lugar y se comparte
    // con los tickets: ver src/utils/paquete.util.ts
    const errores = validarPaqueteCifrado(cuerpo?.paquete);

    if (typeof cuerpo?.titulo !== 'string' || cuerpo.titulo.trim().length < 3) {
        errores.titulo = 'El título es obligatorio (mínimo 3 caracteres).';
    }

    return errores;
}

/** GET /api/notas — sólo las notas del usuario autenticado. */
router.get('/', authenticateJWT, (req: AuthRequest, res: Response) => {
    const propias = notas.filter(n => n.autor === req.user?.username);
    res.json({ datos: propias, total: propias.length });
});

/** POST /api/notas — recibe el paquete YA cifrado por el cliente. */
router.post('/', authenticateJWT, (req: AuthRequest, res: Response) => {
    const errores = validarPaquete(req.body);

    if (Object.keys(errores).length > 0) {
        return res.status(422).json({
            message: 'El paquete cifrado no tiene el formato esperado.',
            errores
        });
    }

    const nueva: NotaCifrada = {
        id: nuevoIdNota(),
        titulo: String(req.body.titulo).trim(),
        paquete: {
            salt: req.body.paquete.salt,
            iv: req.body.paquete.iv,
            dato: req.body.paquete.dato
        },
        autor: req.user?.username,
        creadoEn: marcaDeTiempo()
    };

    notas.push(nueva);
    res.status(201).json(nueva);
});

/** DELETE /api/notas/:id — sólo el autor puede borrar la suya. */
router.delete('/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
    const indice = notas.findIndex(n => n.id === Number(req.params.id));

    if (indice === -1) {
        return res.status(404).json({ message: 'La nota no existe.' });
    }

    if (notas[indice].autor !== req.user?.username) {
        return res.status(403).json({ message: 'Sólo puedes eliminar tus propias notas.' });
    }

    notas.splice(indice, 1);
    res.json({ message: 'Nota eliminada.' });
});

export default router;
