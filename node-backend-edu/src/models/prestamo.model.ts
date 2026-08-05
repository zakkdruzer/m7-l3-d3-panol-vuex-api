/* ==================================================================== */
/* EL PAÑOL — equipos y préstamos                                        */
/*                                                                       */
/* Recurso gemelo de canchas/reservas: misma ESTRUCTURA (un catálogo de  */
/* sólo lectura + un CRUD que depende de él), reglas de negocio          */
/* DISTINTAS.                                                            */
/*                                                                       */
/* Eso es deliberado. Sirve para la actividad práctica que sigue a la    */
/* clase en vivo: si las reglas fueran las mismas, se resolvería         */
/* copiando el código del recinto sin entender nada.                     */
/*                                                                       */
/*   Recinto  → el 409 es una COLISIÓN EXACTA.                           */
/*              Esa cancha, ese día, esa hora: tomado o libre.           */
/*                                                                       */
/*   Pañol    → el 409 es CAPACIDAD AGREGADA.                            */
/*              No importa cuándo: importa cuántas unidades hay fuera    */
/*              sumando TODOS los préstamos vivos de ese equipo.         */
/*                                                                       */
/* Un problema de sí-o-no contra un problema de cuántos-quedan. El       */
/* alumno no puede transferir el código; tiene que transferir la idea.   */
/* ==================================================================== */

export type CategoriaEquipo = 'computacion' | 'audiovisual' | 'redes' | 'medicion' | 'mobiliario';

export type EstadoPrestamo = 'pendiente' | 'entregado' | 'devuelto';

/**
 * Un equipo del pañol.
 *
 * Es un CATÁLOGO: sólo se lee. Dar de alta un equipo es un trámite de
 * inventario, no algo que se haga desde esta aplicación.
 *
 * `stockTotal` son las unidades que EXISTEN. Cuántas hay realmente
 * disponibles se calcula restando las que están comprometidas en
 * préstamos vivos — y ese cálculo lo hace el servidor, porque el
 * navegador no puede conocer los préstamos de los demás.
 */
export interface Equipo {
    id: number;
    nombre: string;
    categoria: CategoriaEquipo;
    marca: string;
    /** Unidades que existen en el inventario. */
    stockTotal: number;
    /** Valor de reposición por unidad, en pesos chilenos. */
    valorUnitario: number;
    /** Si está en mantención o de baja, no se puede prestar. */
    operativo: boolean;
}

/**
 * Un préstamo de N unidades de UN equipo.
 *
 * Se eligió a propósito "un préstamo = un equipo": con varias líneas por
 * préstamo el ejercicio se convierte en un problema de estructuras
 * anidadas, y hoy el tema es Vuex, no el modelado de carritos.
 *
 * Estados y qué significan para el stock:
 *
 *   pendiente → reservado, todavía no lo retiran. COMPROMETE stock.
 *   entregado → está en manos del solicitante.     COMPROMETE stock.
 *   devuelto  → volvió al pañol.                   LIBERA stock.
 */
export interface Prestamo {
    id: number;
    codigo: string;
    equipoId: number;
    solicitante: string;
    /** Curso, asignatura o área que respalda el préstamo. */
    area: string;
    cantidad: number;
    /** Formato AAAA-MM-DD. */
    fechaRetiro: string;
    /** Formato AAAA-MM-DD. Nunca anterior a `fechaRetiro`. */
    fechaDevolucion: string;
    estado: EstadoPrestamo;
    observacion: string | null;
    creadoEn: string;
    actualizadoEn: string;
}

export const CATEGORIAS_EQUIPO: CategoriaEquipo[] = [
    'computacion',
    'audiovisual',
    'redes',
    'medicion',
    'mobiliario'
];

export const ESTADOS_PRESTAMO: EstadoPrestamo[] = ['pendiente', 'entregado', 'devuelto'];

/**
 * Los estados que mantienen unidades FUERA del pañol.
 *
 * Es la lista que define el cálculo de disponibilidad, y por eso vive
 * acá y no repartida en tres archivos.
 */
export const ESTADOS_VIVOS: EstadoPrestamo[] = ['pendiente', 'entregado'];
