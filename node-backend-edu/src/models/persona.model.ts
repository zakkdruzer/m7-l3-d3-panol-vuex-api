export type Departamento =
    | 'administracion'
    | 'operaciones'
    | 'informatica'
    | 'ventas'
    | 'recursos_humanos';

/**
 * Una persona del registro de personal.
 *
 * Nota de diseño para quien lea esto en clase: `rut` y `email` son
 * IDENTIFICADORES NATURALES, es decir, valores que ya identifican de forma
 * única a la persona en el mundo real, fuera de esta base de datos.
 *
 * Por eso el servidor rechaza duplicados con un 409 (Conflicto) y no con un
 * 422 (Validación). El dato está bien formado — el problema es que ya existe.
 * Son dos errores distintos y merecen dos códigos distintos.
 */
export interface Persona {
    id: number;
    rut: string;                 // siempre normalizado: "12345678-5"
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
    cargo: string;
    departamento: Departamento;
    activo: boolean;
    creadoEn: string;
    actualizadoEn: string;
}

export const DEPARTAMENTOS: Departamento[] = [
    'administracion',
    'operaciones',
    'informatica',
    'ventas',
    'recursos_humanos'
];
