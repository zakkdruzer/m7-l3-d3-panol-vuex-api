import { type Response, type NextFunction } from 'express';
import { type AuthRequest } from './auth.middleware.js';

/**
 * Exige que el usuario autenticado tenga uno de los roles indicados.
 *
 * Se usa SIEMPRE después de authenticateJWT: primero se comprueba
 * QUIÉN eres (autenticación) y recién después QUÉ puedes hacer (autorización).
 * Son dos cosas distintas y por eso son dos middlewares distintos.
 */
export const requireRole = (...rolesPermitidos: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const rol = req.user?.role;

        if (!rol) {
            return res.status(401).json({ message: 'No hay sesión activa' });
        }

        if (!rolesPermitidos.includes(rol)) {
            return res.status(403).json({
                message: `Tu rol "${rol}" no tiene permiso para esta acción. Se requiere: ${rolesPermitidos.join(' o ')}.`,
                rolActual: rol,
                rolesRequeridos: rolesPermitidos
            });
        }

        next();
    };
};
