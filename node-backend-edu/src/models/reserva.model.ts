/* ==================================================================== */
/* RECINTO DEPORTIVO — canchas y reservas                                */
/*                                                                       */
/* Este recurso existe para la Lección 3: módulos de Vuex, router y      */
/* axios. Son DOS entidades a propósito.                                 */
/*                                                                       */
/* Una sola entidad no justifica partir el store: se puede resolver todo */
/* en un archivo y el alumno se queda pensando que los módulos son un    */
/* capricho. Con dos entidades que se necesitan mutuamente —una reserva  */
/* NO existe sin una cancha— el módulo deja de ser decoración.           */
/* ==================================================================== */

export type Superficie = 'pasto_sintetico' | 'pasto_natural' | 'cemento';
export type EstadoReserva = 'pendiente' | 'confirmada' | 'cancelada';

/**
 * Una cancha del recinto.
 *
 * Es un CATÁLOGO: sólo se lee. No hay POST ni DELETE de canchas, porque
 * construir una cancha no es cosa de una aplicación web.
 */
export interface Cancha {
    id: number;
    nombre: string;
    superficie: Superficie;
    /** Jugadores por lado: 5, 7 u 11. */
    jugadores: number;
    /** Valor por hora en pesos chilenos. */
    valorHora: number;
    techada: boolean;
    activa: boolean;
}

/**
 * Una reserva de una cancha, para una fecha y un bloque horario.
 *
 * `canchaId` es la relación que obliga a los dos módulos de Vuex a
 * hablarse: el formulario de reservas necesita la lista de canchas para
 * poblar su selector, y la tabla necesita el nombre de la cancha para
 * mostrar algo legible en vez de un número.
 */
export interface Reserva {
    id: number;
    codigo: string;
    canchaId: number;
    cliente: string;
    telefono: string;
    /** Formato YYYY-MM-DD. */
    fecha: string;
    /** Uno de BLOQUES. Una reserva ocupa exactamente una hora. */
    bloque: string;
    jugadores: number;
    estado: EstadoReserva;
    comentario: string | null;
    creadoEn: string;
    actualizadoEn: string;
}

export const SUPERFICIES: Superficie[] = ['pasto_sintetico', 'pasto_natural', 'cemento'];

export const ESTADOS_RESERVA: EstadoReserva[] = ['pendiente', 'confirmada', 'cancelada'];

/**
 * Bloques horarios que se pueden reservar.
 *
 * Están acá y se sirven por HTTP (`GET /api/reservas/bloques`) para que el
 * `<select>` del formulario no los tenga escritos a mano. Si mañana el
 * recinto abre a las 15:00, el formulario se entera solo.
 */
export const BLOQUES: string[] = [
    '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];
