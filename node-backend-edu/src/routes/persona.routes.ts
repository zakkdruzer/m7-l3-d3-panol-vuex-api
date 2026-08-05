import { Router, type Request, type Response } from 'express';
import { authenticateJWT, type AuthRequest } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/roles.middleware.js';
import { personas, nuevoIdPersona, marcaDeTiempo } from '../data/store.js';
import { DEPARTAMENTOS, type Persona, type Departamento } from '../models/persona.model.js';
import { normalizarRut, esRutValido } from '../utils/rut.util.js';

const router = Router();

/* ==================================================================== */
/* RECURSO: PERSONAS                                                     */
/*                                                                       */
/* Este recurso existe para practicar un CRUD COMPLETO con los cinco     */
/* verbos. A propósito NO se comporta igual que /api/tickets:            */
/*                                                                       */
/*   · el listado devuelve { resultados, paginacion }, no { datos, meta } */
/*   · el POST responde 201 con cabecera Location                        */
/*   · el DELETE responde 204 SIN CUERPO                                 */
/*   · los duplicados dan 409, no 422                                    */
/*                                                                       */
/* Eso obliga a leer la respuesta real en vez de copiar el código de     */
/* otro recurso. Es la lección más repetida del módulo: NUNCA ASUMAS LA  */
/* FORMA DE UNA RESPUESTA.                                               */
/* ==================================================================== */

const DOMINIO_CORPORATIVO = '@empresa.cl';
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORMATO_TELEFONO = /^\+56\d{9}$/;

/* ------------------------------------------------------------------ */
/* Validación: devuelve un mapa campo → mensaje                        */
/* ------------------------------------------------------------------ */
function validarPersona(cuerpo: any, parcial = false): Record<string, string> {
    const errores: Record<string, string> = {};
    const tiene = (campo: string) => cuerpo?.[campo] !== undefined;

    /* ---- RUT: no basta con que "parezca" un RUT ---- */
    if (!parcial || tiene('rut')) {
        const rut = cuerpo?.rut;

        if (typeof rut !== 'string' || rut.trim().length === 0) {
            errores.rut = 'El RUT es obligatorio.';
        } else if (!esRutValido(rut)) {
            errores.rut =
                'El RUT no es válido. El dígito verificador no corresponde al número. ' +
                'Formato esperado: 12345678-5 (con o sin puntos).';
        }
    }

    if (!parcial || tiene('nombre')) {
        const nombre = cuerpo?.nombre;
        if (typeof nombre !== 'string' || nombre.trim().length < 2) {
            errores.nombre = 'El nombre es obligatorio (mínimo 2 caracteres).';
        } else if (nombre.trim().length > 40) {
            errores.nombre = 'El nombre no puede superar los 40 caracteres.';
        }
    }

    if (!parcial || tiene('apellido')) {
        const apellido = cuerpo?.apellido;
        if (typeof apellido !== 'string' || apellido.trim().length < 2) {
            errores.apellido = 'El apellido es obligatorio (mínimo 2 caracteres).';
        } else if (apellido.trim().length > 60) {
            errores.apellido = 'El apellido no puede superar los 60 caracteres.';
        }
    }

    /* ---- Email: formato Y regla de negocio ---- */
    if (!parcial || tiene('email')) {
        const email = cuerpo?.email;

        if (typeof email !== 'string' || email.trim().length === 0) {
            errores.email = 'El correo es obligatorio.';
        } else if (!FORMATO_EMAIL.test(email.trim())) {
            errores.email = 'El correo no tiene un formato válido.';
        } else if (!email.trim().toLowerCase().endsWith(DOMINIO_CORPORATIVO)) {
            // Esto NO es una validación de formato: es una REGLA DE NEGOCIO.
            // Ningún navegador la conoce; sólo el servidor puede exigirla.
            errores.email = `El correo debe pertenecer al dominio corporativo ${DOMINIO_CORPORATIVO}.`;
        }
    }

    /* ---- Teléfono: opcional, pero si viene tiene que estar bien ---- */
    if (tiene('telefono') && cuerpo.telefono !== null && cuerpo.telefono !== '') {
        if (typeof cuerpo.telefono !== 'string' || !FORMATO_TELEFONO.test(cuerpo.telefono.trim())) {
            errores.telefono = 'El teléfono debe tener el formato +56912345678 (código país + 9 dígitos).';
        }
    }

    if (!parcial || tiene('cargo')) {
        const cargo = cuerpo?.cargo;
        if (typeof cargo !== 'string' || cargo.trim().length < 3) {
            errores.cargo = 'El cargo es obligatorio (mínimo 3 caracteres).';
        }
    }

    if (!parcial || tiene('departamento')) {
        if (!DEPARTAMENTOS.includes(cuerpo?.departamento)) {
            errores.departamento = `El departamento debe ser uno de: ${DEPARTAMENTOS.join(', ')}.`;
        }
    }

    if (tiene('activo') && typeof cuerpo.activo !== 'boolean') {
        errores.activo = 'El campo "activo" debe ser verdadero o falso, no un texto.';
    }

    return errores;
}

/**
 * Busca duplicados de RUT o correo en OTRA persona distinta de `idActual`.
 *
 * Devuelve 409 y no 422 a propósito: el dato está perfectamente bien escrito,
 * el problema es que ya pertenece a alguien más. Es un conflicto de estado,
 * no un error de formato.
 */
function buscarConflictos(cuerpo: any, idActual: number | null): Record<string, string> {
    const conflictos: Record<string, string> = {};

    if (typeof cuerpo?.rut === 'string') {
        const rut = normalizarRut(cuerpo.rut);
        const duenio = personas.find(p => p.rut === rut && p.id !== idActual);
        if (duenio) {
            conflictos.rut = `El RUT ${rut} ya está registrado a nombre de ${duenio.nombre} ${duenio.apellido}.`;
        }
    }

    if (typeof cuerpo?.email === 'string') {
        const email = cuerpo.email.trim().toLowerCase();
        const duenio = personas.find(p => p.email.toLowerCase() === email && p.id !== idActual);
        if (duenio) {
            conflictos.email = `El correo ${email} ya está registrado a nombre de ${duenio.nombre} ${duenio.apellido}.`;
        }
    }

    return conflictos;
}

const idDesde = (valor: unknown): number => Number(String(valor));
const buscarPersona = (valor: unknown) => personas.find(p => p.id === idDesde(valor));

/* ==================================================================== */
/* GET /api/personas/departamentos — PÚBLICO                             */
/*                                                                       */
/* OJO AL ORDEN: va ANTES que /:id. Si estuviera después, Express        */
/* interpretaría "departamentos" como un id y nunca llegarías acá.       */
/* Las rutas se evalúan de arriba abajo, la primera que calza gana.      */
/* ==================================================================== */
router.get('/departamentos', (req: Request, res: Response) => {
    res.json({
        departamentos: DEPARTAMENTOS.map(valor => ({
            valor,
            // Etiqueta lista para mostrar: "recursos_humanos" → "Recursos humanos"
            etiqueta: valor.charAt(0).toUpperCase() + valor.slice(1).replace(/_/g, ' ')
        }))
    });
});

/* ==================================================================== */
/* GET /api/personas — PÚBLICO. Filtros, búsqueda, orden y paginación.   */
/*                                                                       */
/* La respuesta usa { resultados, paginacion }.                          */
/* NO es { datos, meta } como en /api/tickets. Míralo antes de codificar. */
/* ==================================================================== */
router.get('/', (req: Request, res: Response) => {
    const {
        buscar, departamento, activo,
        orden = 'apellido',
        pagina = '1',
        porPagina = '6'
    } = req.query as Record<string, string>;

    let resultado = [...personas];

    if (departamento) {
        if (!DEPARTAMENTOS.includes(departamento as Departamento)) {
            return res.status(400).json({
                message: `Filtro de departamento inválido. Valores aceptados: ${DEPARTAMENTOS.join(', ')}.`
            });
        }
        resultado = resultado.filter(p => p.departamento === departamento);
    }

    if (activo !== undefined && activo !== '') {
        if (activo !== 'true' && activo !== 'false') {
            return res.status(400).json({
                message: 'El filtro "activo" sólo acepta true o false.'
            });
        }
        resultado = resultado.filter(p => p.activo === (activo === 'true'));
    }

    if (buscar) {
        const q = buscar.toLowerCase();
        resultado = resultado.filter(p =>
            p.nombre.toLowerCase().includes(q) ||
            p.apellido.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q) ||
            p.cargo.toLowerCase().includes(q) ||
            p.rut.toLowerCase().includes(q)
        );
    }

    if (orden === 'nombre') {
        resultado.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    } else if (orden === 'antiguedad') {
        resultado.sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
    } else if (orden === 'departamento') {
        resultado.sort((a, b) =>
            a.departamento.localeCompare(b.departamento) ||
            a.apellido.localeCompare(b.apellido, 'es')
        );
    } else {
        resultado.sort((a, b) => a.apellido.localeCompare(b.apellido, 'es'));
    }

    const total = resultado.length;
    const tam = Math.min(Math.max(parseInt(porPagina, 10) || 6, 1), 50);
    const totalPaginas = Math.max(Math.ceil(total / tam), 1);
    const pag = Math.min(Math.max(parseInt(pagina, 10) || 1, 1), totalPaginas);
    const desde = (pag - 1) * tam;

    // Cabecera personalizada: sólo es legible desde JavaScript porque
    // server.ts la expone en la configuración de CORS.
    res.setHeader('X-Total-Registros', String(total));

    res.json({
        resultados: resultado.slice(desde, desde + tam),
        paginacion: {
            paginaActual: pag,
            porPagina: tam,
            totalRegistros: total,
            totalPaginas,
            hayAnterior: pag > 1,
            haySiguiente: pag < totalPaginas
        }
    });
});

/* ==================================================================== */
/* GET /api/personas/:id — PÚBLICO. Objeto directo, sin envoltorio.      */
/* ==================================================================== */
router.get('/:id', (req: Request, res: Response) => {
    const persona = buscarPersona(req.params.id);

    if (!persona) {
        return res.status(404).json({ message: `No existe la persona con id ${req.params.id}.` });
    }

    res.json(persona);
});

/* ==================================================================== */
/* POST /api/personas — PROTEGIDO                                        */
/*                                                                       */
/* Responde 201 (Creado) con la cabecera Location apuntando al recurso   */
/* recién creado. Es lo que manda el estándar HTTP y casi nadie hace.    */
/* ==================================================================== */
router.post('/', authenticateJWT, (req: AuthRequest, res: Response) => {
    const errores = validarPersona(req.body);

    if (Object.keys(errores).length > 0) {
        return res.status(422).json({
            message: 'Algunos campos tienen problemas. Revísalos.',
            errores
        });
    }

    // Formato correcto, pero ¿ya existe? Eso es 409, no 422.
    const conflictos = buscarConflictos(req.body, null);
    if (Object.keys(conflictos).length > 0) {
        return res.status(409).json({
            message: 'Ya existe una persona registrada con esos datos.',
            errores: conflictos
        });
    }

    const ahora = marcaDeTiempo();

    const nueva: Persona = {
        id: nuevoIdPersona(),
        rut: normalizarRut(req.body.rut),
        nombre: String(req.body.nombre).trim(),
        apellido: String(req.body.apellido).trim(),
        email: String(req.body.email).trim().toLowerCase(),
        telefono: req.body.telefono ? String(req.body.telefono).trim() : null,
        cargo: String(req.body.cargo).trim(),
        departamento: req.body.departamento,
        activo: typeof req.body.activo === 'boolean' ? req.body.activo : true,
        creadoEn: ahora,
        actualizadoEn: ahora
    };

    personas.push(nueva);

    res.setHeader('Location', `/api/personas/${nueva.id}`);
    res.status(201).json(nueva);
});

/* ==================================================================== */
/* PUT /api/personas/:id — PROTEGIDO. REEMPLAZO TOTAL.                   */
/*                                                                       */
/* PUT no "actualiza": REEMPLAZA. Lo que no mandes NO se conserva.       */
/* Aquí no hay ningún aviso amable: si no envías el teléfono, se pierde  */
/* en silencio. Descubrirlo comparando con PATCH es parte del ejercicio. */
/* ==================================================================== */
router.put('/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
    const persona = buscarPersona(req.params.id);

    if (!persona) {
        return res.status(404).json({ message: `No existe la persona con id ${req.params.id}.` });
    }

    // `parcial = false`: acá SÍ exigimos el cuerpo completo.
    const errores = validarPersona(req.body, false);
    if (Object.keys(errores).length > 0) {
        return res.status(422).json({
            message: 'PUT reemplaza el recurso completo: faltan campos obligatorios.',
            errores
        });
    }

    const conflictos = buscarConflictos(req.body, persona.id);
    if (Object.keys(conflictos).length > 0) {
        return res.status(409).json({
            message: 'Esos datos ya pertenecen a otra persona.',
            errores: conflictos
        });
    }

    persona.rut = normalizarRut(req.body.rut);
    persona.nombre = String(req.body.nombre).trim();
    persona.apellido = String(req.body.apellido).trim();
    persona.email = String(req.body.email).trim().toLowerCase();
    persona.cargo = String(req.body.cargo).trim();
    persona.departamento = req.body.departamento;

    // Los campos omitidos vuelven a su valor por defecto. Eso es PUT.
    persona.telefono = req.body.telefono ? String(req.body.telefono).trim() : null;
    persona.activo = typeof req.body.activo === 'boolean' ? req.body.activo : true;

    persona.actualizadoEn = marcaDeTiempo();

    res.json(persona);
});

/* ==================================================================== */
/* PATCH /api/personas/:id — PROTEGIDO. Actualización parcial.           */
/* ==================================================================== */
router.patch('/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
    const persona = buscarPersona(req.params.id);

    if (!persona) {
        return res.status(404).json({ message: `No existe la persona con id ${req.params.id}.` });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(422).json({
            message: 'PATCH necesita al menos un campo que cambiar.',
            errores: { cuerpo: 'El cuerpo de la petición está vacío.' }
        });
    }

    const errores = validarPersona(req.body, true);
    if (Object.keys(errores).length > 0) {
        return res.status(422).json({ message: 'Algunos campos tienen problemas. Revísalos.', errores });
    }

    const conflictos = buscarConflictos(req.body, persona.id);
    if (Object.keys(conflictos).length > 0) {
        return res.status(409).json({
            message: 'Esos datos ya pertenecen a otra persona.',
            errores: conflictos
        });
    }

    const permitidos = ['nombre', 'apellido', 'email', 'telefono', 'cargo', 'departamento', 'activo'] as const;

    permitidos.forEach(campo => {
        if (req.body[campo] === undefined) return;

        const valor = req.body[campo];
        (persona as any)[campo] = typeof valor === 'string' ? valor.trim() : valor;
    });

    // El RUT se normaliza aparte: nunca se guarda tal como lo escribió el usuario.
    if (req.body.rut !== undefined) persona.rut = normalizarRut(req.body.rut);
    if (req.body.email !== undefined) persona.email = String(req.body.email).trim().toLowerCase();
    if (req.body.telefono === null || req.body.telefono === '') persona.telefono = null;

    persona.actualizadoEn = marcaDeTiempo();

    res.json(persona);
});

/* ==================================================================== */
/* DELETE /api/personas/:id — PROTEGIDO + SÓLO ROL admin                 */
/*                                                                       */
/* Dos cosas que hay que notar:                                          */
/*                                                                       */
/* 1. Responde 409 si la persona sigue ACTIVA. Regla de negocio: primero */
/*    se desactiva (PATCH) y después se elimina. Eso obliga a encadenar  */
/*    dos verbos distintos, como en un sistema real.                     */
/*                                                                       */
/* 2. Cuando tiene éxito responde 204 (Sin Contenido) y el cuerpo va     */
/*    VACÍO. No hay ningún `message` que leer. Si tu cliente hace        */
/*    respuesta.data.message va a obtener undefined, y estará bien:      */
/*    el mensaje no existe. La confirmación es el propio código 204.     */
/* ==================================================================== */
router.delete('/:id', authenticateJWT, requireRole('admin'), (req: AuthRequest, res: Response) => {
    const indice = personas.findIndex(p => p.id === idDesde(req.params.id));

    if (indice === -1) {
        return res.status(404).json({ message: `No existe la persona con id ${req.params.id}.` });
    }

    const persona = personas[indice] as Persona;

    if (persona.activo) {
        return res.status(409).json({
            message:
                `${persona.nombre} ${persona.apellido} sigue activa en la organización. ` +
                'Desactívala antes de eliminar su registro.',
            sugerencia: `PATCH /api/personas/${persona.id} con { "activo": false }`
        });
    }

    personas.splice(indice, 1);

    // 204 = todo salió bien y NO hay nada que devolver.
    res.status(204).send();
});

export default router;
