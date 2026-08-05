import { type Request, type Response, type NextFunction } from 'express';

/**
 * Limitador de peticiones muy simple, con fines educativos.
 *
 * Responde 429 (Too Many Requests) e incluye la cabecera `Retry-After`,
 * que le dice al cliente cuántos segundos debe esperar antes de reintentar.
 *
 * IMPORTANTE para el frontend: por seguridad, el navegador sólo deja leer
 * unas pocas cabeceras de respuesta, salvo que el servidor las exponga
 * explícitamente con `Access-Control-Expose-Headers`. Eso se configura
 * en el CORS de server.ts. Sin eso, `Retry-After` llega en la respuesta
 * pero es invisible para JavaScript.
 */
interface Registro {
    conteo: number;
    reinicioEn: number;
}

export const rateLimit = (maxPeticiones: number, ventanaSegundos: number) => {
    const memoria = new Map<string, Registro>();

    return (req: Request, res: Response, next: NextFunction) => {
        const llave = req.ip || 'desconocido';
        const ahora = Date.now();
        const registro = memoria.get(llave);

        if (!registro || ahora > registro.reinicioEn) {
            memoria.set(llave, { conteo: 1, reinicioEn: ahora + ventanaSegundos * 1000 });
            return next();
        }

        registro.conteo++;

        if (registro.conteo > maxPeticiones) {
            const esperar = Math.ceil((registro.reinicioEn - ahora) / 1000);

            res.setHeader('Retry-After', String(esperar));

            return res.status(429).json({
                message: `Demasiadas peticiones. Espera ${esperar} segundos antes de volver a intentar.`,
                reintentarEn: esperar
            });
        }

        next();
    };
};
