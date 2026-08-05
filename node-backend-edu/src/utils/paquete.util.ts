/**
 * Validación de paquetes cifrados EN EL CLIENTE.
 *
 * Regla de oro de este archivo: el servidor valida la FORMA del paquete,
 * jamás su CONTENIDO. No puede leerlo y no debe intentarlo. La frase de paso
 * nunca sale del navegador del usuario.
 *
 * Un paquete AES-GCM producido en el navegador tiene siempre tres piezas:
 *
 *   salt → sal aleatoria usada por PBKDF2 para derivar la clave.
 *          Es pública. Se guarda junto al dato, no es un secreto.
 *   iv   → vector de inicialización, único por cada operación de cifrado.
 *          También es público. Reutilizarlo rompe AES-GCM por completo.
 *   dato → el texto cifrado + la etiqueta de autenticación.
 *
 * Los tres viajan en Base64 porque JSON no transporta bytes crudos.
 */

const ES_BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

/** Largo mínimo razonable del dato cifrado en Base64. Debajo de esto, huele a texto plano. */
const LARGO_MINIMO_DATO = 12;

/**
 * Devuelve un mapa `campo → mensaje`. Vacío significa que el paquete está bien formado.
 *
 * @param paquete  El objeto recibido en el cuerpo de la petición.
 * @param prefijo  Nombre con el que se reportan los errores (por defecto "paquete").
 */
export function validarPaqueteCifrado(paquete: any, prefijo = 'paquete'): Record<string, string> {
    const errores: Record<string, string> = {};

    if (!paquete || typeof paquete !== 'object') {
        errores[prefijo] = 'Falta el paquete cifrado. Debe ser un objeto con salt, iv y dato.';
        return errores;
    }

    (['salt', 'iv', 'dato'] as const).forEach(campo => {
        const valor = paquete[campo];

        if (typeof valor !== 'string' || valor.length === 0) {
            errores[`${prefijo}.${campo}`] = `El campo "${campo}" es obligatorio.`;
        } else if (!ES_BASE64.test(valor)) {
            errores[`${prefijo}.${campo}`] = `El campo "${campo}" debe venir codificado en Base64.`;
        }
    });

    // Señal de que el cliente mandó texto plano por error.
    if (typeof paquete.dato === 'string' && paquete.dato.length < LARGO_MINIMO_DATO) {
        errores[`${prefijo}.dato`] =
            'El dato cifrado es sospechosamente corto. ¿Estás enviando el texto sin cifrar?';
    }

    return errores;
}
