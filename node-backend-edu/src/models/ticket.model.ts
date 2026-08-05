export type Prioridad = 'baja' | 'media' | 'alta';
export type EstadoTicket = 'abierto' | 'en_proceso' | 'cerrado';

export interface Ticket {
    id: number;
    codigo: string;
    asunto: string;
    descripcion: string;
    prioridad: Prioridad;
    estado: EstadoTicket;
    solicitante: string;
    solucion: string | null;
    /**
     * Dato sensible del solicitante (RUT, teléfono de contacto, credencial temporal…)
     * CIFRADO EN EL NAVEGADOR. El servidor lo almacena y lo devuelve sin poder leerlo.
     * Es opcional: un ticket puede no tener ninguno.
     */
    datoSeguro?: DatoSeguro | null;
    creadoEn: string;
    actualizadoEn: string;
}

/**
 * Nota cifrada en el CLIENTE.
 *
 * El servidor guarda `paquete` tal cual llega y jamás puede leer su contenido:
 * no conoce la frase de paso. Esto se llama almacenamiento de conocimiento cero.
 */
export interface PaqueteCifrado {
    salt: string;
    iv: string;
    dato: string;
}

/**
 * Un dato sensible adjunto a un ticket.
 *
 * `etiqueta` viaja EN CLARO a propósito: es lo único que el servidor (y la
 * interfaz) puede mostrar sin descifrar nada. Sirve para que el usuario sepa
 * QUÉ hay guardado sin revelar el contenido. Nunca pongas el secreto acá.
 */
export interface DatoSeguro {
    etiqueta: string;
    paquete: PaqueteCifrado;
    actualizadoEn: string;
}

export interface NotaCifrada {
    id: number;
    titulo: string;
    paquete: PaqueteCifrado;
    autor: string;
    creadoEn: string;
}

export const PRIORIDADES: Prioridad[] = ['baja', 'media', 'alta'];
export const ESTADOS: EstadoTicket[] = ['abierto', 'en_proceso', 'cerrado'];
