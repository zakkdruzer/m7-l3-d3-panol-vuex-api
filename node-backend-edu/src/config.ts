/**
 * Configuración compartida.
 *
 * OJO con el detalle: esto es una FUNCIÓN, no una constante.
 *
 * Los `import` de un módulo se evalúan ANTES del cuerpo de server.ts,
 * o sea antes de que `dotenv.config()` alcance a cargar el archivo .env.
 * Si aquí exportáramos `export const JWT_SECRET = process.env.JWT_SECRET`,
 * el valor quedaría congelado en `undefined` para siempre.
 *
 * Al leerlo dentro de una función, se resuelve en tiempo de petición,
 * cuando las variables de entorno ya están cargadas.
 */
export const getJwtSecret = (): string =>
    process.env.JWT_SECRET || 'super-secret-key-para-aprendizaje-2026';

/** Duración por defecto del token, en minutos. */
export const DURACION_TOKEN_MIN = 60;

/** Duración máxima que un cliente puede pedir, en minutos. */
export const DURACION_TOKEN_MAX = 60;
