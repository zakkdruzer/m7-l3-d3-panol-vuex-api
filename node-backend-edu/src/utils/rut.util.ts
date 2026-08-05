/**
 * RUT chileno: normalización y validación con el algoritmo módulo 11.
 *
 * ¿Por qué esto vive en el servidor y no en el navegador?
 *
 * Porque el navegador es territorio del usuario. Cualquiera puede abrir la
 * consola, desactivar tu validación y mandar la petición a mano. La validación
 * del cliente existe para EVITAR UN VIAJE INNECESARIO y dar respuesta inmediata;
 * la del servidor existe para PROTEGER LOS DATOS. Son dos trabajos distintos y
 * por eso se hacen las dos veces.
 */

/**
 * Deja el RUT en su forma canónica: sin puntos, sin espacios, sin ceros a la
 * izquierda, con guion y el dígito verificador en mayúscula.
 *
 *   "12.345.678-k"  →  "12345678-K"
 *   "012345678K"    →  "12345678-K"
 */
export function normalizarRut(valor: string): string {
    const limpio = valor
        .replace(/[.\s]/g, '')
        .replace(/-/g, '')
        .toUpperCase()
        .replace(/^0+/, '');

    if (limpio.length < 2) return limpio;

    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);

    return `${cuerpo}-${dv}`;
}

/**
 * Valida el dígito verificador con el algoritmo módulo 11.
 *
 * Se recorre el cuerpo de derecha a izquierda multiplicando por la serie
 * 2,3,4,5,6,7 y volviendo a empezar. El resto de la suma contra 11 determina
 * el dígito esperado, con dos casos especiales: 11 → '0' y 10 → 'K'.
 *
 * Esto es lo que hace que un RUT NO sea sólo "un texto con guion": es un
 * número con un dígito de control, igual que un IBAN o un ISBN.
 */
export function esRutValido(valor: string): boolean {
    const normalizado = normalizarRut(valor);

    // Cuerpo de 7 u 8 dígitos, guion, y un dígito o la letra K.
    if (!/^\d{7,8}-[\dK]$/.test(normalizado)) return false;

    const [cuerpo, dv] = normalizado.split('-') as [string, string];

    let suma = 0;
    let multiplicador = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += Number(cuerpo[i]) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resto = 11 - (suma % 11);
    const dvEsperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);

    return dv === dvEsperado;
}

/** Calcula el dígito verificador de un cuerpo numérico. Útil para sembrar datos. */
export function calcularDv(cuerpo: string): string {
    let suma = 0;
    let multiplicador = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += Number(cuerpo[i]) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resto = 11 - (suma % 11);
    return resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
}
