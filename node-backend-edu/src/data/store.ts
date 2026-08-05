import { type Ticket, type NotaCifrada } from '../models/ticket.model.js';
import { type Persona } from '../models/persona.model.js';
import { type Cancha, type Reserva } from '../models/reserva.model.js';
import { type Equipo, type Prestamo } from '../models/prestamo.model.js';

/** Base de datos en memoria. Se reinicia cada vez que levantas el servidor. */

const ahora = () => new Date().toISOString();

export const tickets: Ticket[] = [
    {
        id: 1, codigo: 'TK-0001',
        asunto: 'La impresora del segundo piso no responde',
        descripcion: 'Enciende pero no aparece en la lista de dispositivos.',
        prioridad: 'media', estado: 'abierto',
        solicitante: 'Camila Rojas', solucion: null,
        creadoEn: '2026-07-20T13:05:00.000Z', actualizadoEn: '2026-07-20T13:05:00.000Z'
    },
    {
        id: 2, codigo: 'TK-0002',
        asunto: 'Correo institucional rechaza adjuntos',
        descripcion: 'Archivos sobre 5 MB devuelven error de cuota.',
        prioridad: 'alta', estado: 'en_proceso',
        solicitante: 'Diego Pino', solucion: null,
        creadoEn: '2026-07-21T09:30:00.000Z', actualizadoEn: '2026-07-22T11:00:00.000Z'
    },
    {
        id: 3, codigo: 'TK-0003',
        asunto: 'Solicitud de acceso a carpeta compartida',
        descripcion: 'Necesita permisos de lectura en la unidad de Contabilidad.',
        prioridad: 'baja', estado: 'cerrado',
        solicitante: 'Andrea Bouffanais', solucion: 'Permisos otorgados por el área de sistemas.',
        creadoEn: '2026-07-18T16:45:00.000Z', actualizadoEn: '2026-07-19T10:12:00.000Z'
    },
    {
        id: 4, codigo: 'TK-0004',
        asunto: 'Notebook no carga al conectarlo',
        descripcion: 'El cargador enciende pero la batería no sube del 3%.',
        prioridad: 'alta', estado: 'abierto',
        solicitante: 'Marcelo Vera', solucion: null,
        creadoEn: '2026-07-23T08:15:00.000Z', actualizadoEn: '2026-07-23T08:15:00.000Z'
    },
    {
        id: 5, codigo: 'TK-0005',
        asunto: 'Sala de reuniones sin señal de proyector',
        descripcion: 'El cable HDMI parece dañado en el conector.',
        prioridad: 'media', estado: 'abierto',
        solicitante: 'Paula Núñez', solucion: null,
        creadoEn: '2026-07-24T14:20:00.000Z', actualizadoEn: '2026-07-24T14:20:00.000Z'
    },
    {
        id: 6, codigo: 'TK-0006',
        asunto: 'Teclado con teclas repetidas',
        descripcion: 'Al escribir, algunas letras se duplican.',
        prioridad: 'baja', estado: 'en_proceso',
        solicitante: 'Ignacio Soto', solucion: null,
        creadoEn: '2026-07-24T17:40:00.000Z', actualizadoEn: '2026-07-25T09:05:00.000Z'
    },
    {
        id: 7, codigo: 'TK-0007',
        asunto: 'Sistema de asistencia marca doble entrada',
        descripcion: 'Registra dos veces la misma marcación de la mañana.',
        prioridad: 'alta', estado: 'abierto',
        solicitante: 'Valentina Cid', solucion: null,
        creadoEn: '2026-07-25T11:55:00.000Z', actualizadoEn: '2026-07-25T11:55:00.000Z'
    },
    {
        id: 8, codigo: 'TK-0008',
        asunto: 'Actualizar antivirus en equipos de recepción',
        descripcion: 'Las licencias vencen a fin de mes.',
        prioridad: 'media', estado: 'cerrado',
        solicitante: 'Rodrigo Lara', solucion: 'Licencias renovadas y equipos actualizados.',
        creadoEn: '2026-07-15T10:00:00.000Z', actualizadoEn: '2026-07-17T15:30:00.000Z'
    },
    {
        id: 9, codigo: 'TK-0009',
        asunto: 'Wi-Fi intermitente en bodega',
        descripcion: 'La señal se cae cada 10 minutos aproximadamente.',
        prioridad: 'media', estado: 'abierto',
        solicitante: 'Fernanda Aguilar', solucion: null,
        creadoEn: '2026-07-26T09:10:00.000Z', actualizadoEn: '2026-07-26T09:10:00.000Z'
    },
    {
        id: 10, codigo: 'TK-0010',
        asunto: 'Restablecer contraseña de usuario nuevo',
        descripcion: 'Ingreso de personal, requiere credenciales iniciales.',
        prioridad: 'baja', estado: 'abierto',
        solicitante: 'Tomás Herrera', solucion: null,
        creadoEn: '2026-07-26T15:25:00.000Z', actualizadoEn: '2026-07-26T15:25:00.000Z'
    },
    {
        id: 11, codigo: 'TK-0011',
        asunto: 'Monitor con líneas verticales',
        descripcion: 'Aparecen franjas de color en el tercio derecho.',
        prioridad: 'baja', estado: 'abierto',
        solicitante: 'Josefa Miranda', solucion: null,
        creadoEn: '2026-07-27T08:50:00.000Z', actualizadoEn: '2026-07-27T08:50:00.000Z'
    },
    {
        id: 12, codigo: 'TK-0012',
        asunto: 'Respaldo automático detenido hace 4 días',
        descripcion: 'El trabajo programado no se ejecuta desde el lunes.',
        prioridad: 'alta', estado: 'en_proceso',
        solicitante: 'Cristian Fuentes', solucion: null,
        creadoEn: '2026-07-27T12:35:00.000Z', actualizadoEn: '2026-07-27T13:00:00.000Z'
    }
];

export const notas: NotaCifrada[] = [];

/* ------------------------------------------------------------------ */
/* Registro de personal.                                               */
/*                                                                     */
/* Todos los RUT de esta lista son VÁLIDOS según el algoritmo módulo   */
/* 11. No están inventados: se calcularon con su dígito verificador    */
/* real. Si cambias un dígito a mano, el servidor va a rechazar esa     */
/* persona al intentar actualizarla — y estará en lo correcto.         */
/* ------------------------------------------------------------------ */
export const personas: Persona[] = [
    {
        id: 1, rut: '15782394-9',
        nombre: 'Camila', apellido: 'Rojas Fuentes',
        email: 'camila.rojas@empresa.cl', telefono: '+56912345678',
        cargo: 'Analista de Soporte', departamento: 'informatica', activo: true,
        creadoEn: '2026-03-04T13:20:00.000Z', actualizadoEn: '2026-03-04T13:20:00.000Z'
    },
    {
        id: 2, rut: '11445236-K',
        nombre: 'Diego', apellido: 'Pino Salazar',
        email: 'diego.pino@empresa.cl', telefono: '+56987654321',
        cargo: 'Jefe de Operaciones', departamento: 'operaciones', activo: true,
        creadoEn: '2025-11-18T09:05:00.000Z', actualizadoEn: '2026-05-22T11:40:00.000Z'
    },
    {
        id: 3, rut: '19023874-1',
        nombre: 'Andrea', apellido: 'Bouffanais Leiva',
        email: 'andrea.bouffanais@empresa.cl', telefono: null,
        cargo: 'Contadora', departamento: 'administracion', activo: true,
        creadoEn: '2026-01-09T16:45:00.000Z', actualizadoEn: '2026-01-09T16:45:00.000Z'
    },
    {
        id: 4, rut: '8765432-K',
        nombre: 'Marcelo', apellido: 'Vera Cortés',
        email: 'marcelo.vera@empresa.cl', telefono: '+56955512340',
        cargo: 'Gerente Comercial', departamento: 'ventas', activo: true,
        creadoEn: '2024-07-01T08:15:00.000Z', actualizadoEn: '2026-06-30T10:00:00.000Z'
    },
    {
        id: 5, rut: '20114558-9',
        nombre: 'Paula', apellido: 'Núñez Bravo',
        email: 'paula.nunez@empresa.cl', telefono: '+56944498765',
        cargo: 'Ejecutiva de Ventas', departamento: 'ventas', activo: true,
        creadoEn: '2026-02-14T14:20:00.000Z', actualizadoEn: '2026-02-14T14:20:00.000Z'
    },
    {
        id: 6, rut: '13998271-1',
        nombre: 'Ignacio', apellido: 'Soto Miranda',
        email: 'ignacio.soto@empresa.cl', telefono: '+56933321456',
        cargo: 'Encargado de Bodega', departamento: 'operaciones', activo: false,
        creadoEn: '2025-05-20T17:40:00.000Z', actualizadoEn: '2026-04-11T09:05:00.000Z'
    },
    {
        id: 7, rut: '17332019-1',
        nombre: 'Valentina', apellido: 'Cid Morales',
        email: 'valentina.cid@empresa.cl', telefono: '+56922234567',
        cargo: 'Analista de Personas', departamento: 'recursos_humanos', activo: true,
        creadoEn: '2025-09-30T11:55:00.000Z', actualizadoEn: '2026-07-02T15:10:00.000Z'
    },
    {
        id: 8, rut: '9884736-7',
        nombre: 'Rodrigo', apellido: 'Lara Espinoza',
        email: 'rodrigo.lara@empresa.cl', telefono: null,
        cargo: 'Administrador de Sistemas', departamento: 'informatica', activo: true,
        creadoEn: '2024-10-15T10:00:00.000Z', actualizadoEn: '2026-03-17T15:30:00.000Z'
    },
    {
        id: 9, rut: '21005463-4',
        nombre: 'Fernanda', apellido: 'Aguilar Ríos',
        email: 'fernanda.aguilar@empresa.cl', telefono: '+56911122334',
        cargo: 'Practicante de Informática', departamento: 'informatica', activo: false,
        creadoEn: '2026-06-01T09:10:00.000Z', actualizadoEn: '2026-07-15T09:10:00.000Z'
    },
    {
        id: 10, rut: '16447290-6',
        nombre: 'Tomás', apellido: 'Herrera Godoy',
        email: 'tomas.herrera@empresa.cl', telefono: '+56966677889',
        cargo: 'Asistente Administrativo', departamento: 'administracion', activo: true,
        creadoEn: '2026-04-26T15:25:00.000Z', actualizadoEn: '2026-04-26T15:25:00.000Z'
    },
    {
        id: 11, rut: '12345678-5',
        nombre: 'Josefa', apellido: 'Miranda Pavez',
        email: 'josefa.miranda@empresa.cl', telefono: '+56977788990',
        cargo: 'Diseñadora', departamento: 'ventas', activo: true,
        creadoEn: '2025-12-03T08:50:00.000Z', actualizadoEn: '2026-05-05T08:50:00.000Z'
    },
    {
        id: 12, rut: '7654321-6',
        nombre: 'Cristian', apellido: 'Fuentes Alarcón',
        email: 'cristian.fuentes@empresa.cl', telefono: '+56900011223',
        cargo: 'Jefe de Recursos Humanos', departamento: 'recursos_humanos', activo: true,
        creadoEn: '2023-08-21T12:35:00.000Z', actualizadoEn: '2026-07-20T13:00:00.000Z'
    }
];

/* ------------------------------------------------------------------ */
/* Recinto deportivo — el catálogo de canchas.                         */
/*                                                                     */
/* Sólo se lee. No hay POST ni DELETE: construir una cancha no es cosa */
/* de una aplicación web. Existe para alimentar el selector del        */
/* formulario de reservas y para poder mostrar el nombre en la tabla   */
/* en lugar de un `canchaId` que no le dice nada a nadie.              */
/* ------------------------------------------------------------------ */
export const canchas: Cancha[] = [
    { id: 1, nombre: 'Cancha 1 · Techada',    superficie: 'pasto_sintetico', jugadores: 7,  valorHora: 32000, techada: true,  activa: true },
    { id: 2, nombre: 'Cancha 2 · Techada',    superficie: 'pasto_sintetico', jugadores: 7,  valorHora: 32000, techada: true,  activa: true },
    { id: 3, nombre: 'Cancha 3 · Aire libre', superficie: 'pasto_sintetico', jugadores: 5,  valorHora: 24000, techada: false, activa: true },
    { id: 4, nombre: 'Cancha 4 · Aire libre', superficie: 'cemento',         jugadores: 5,  valorHora: 18000, techada: false, activa: true },
    { id: 5, nombre: 'Cancha Central',        superficie: 'pasto_natural',   jugadores: 11, valorHora: 65000, techada: false, activa: true },
    { id: 6, nombre: 'Cancha 6 · En obras',   superficie: 'cemento',         jugadores: 5,  valorHora: 18000, techada: false, activa: false }
];

/* ------------------------------------------------------------------ */
/* Reservas ya tomadas.                                                */
/*                                                                     */
/* Ojo con los pares fecha+bloque de una misma cancha: son únicos      */
/* entre las reservas que NO están canceladas. Esa es la regla que     */
/* provoca el 409 al intentar reservar algo que ya está tomado, y es   */
/* justamente el tipo de conflicto que el navegador no puede detectar  */
/* solo: necesita preguntarle al servidor.                             */
/* ------------------------------------------------------------------ */
export const reservas: Reserva[] = [
    {
        id: 1, codigo: 'RES-0001', canchaId: 1,
        cliente: 'Los Cracks del Barrio', telefono: '+56912345678',
        fecha: '2026-08-05', bloque: '20:00', jugadores: 14,
        estado: 'confirmada', comentario: 'Piden pechera de color.',
        creadoEn: '2026-07-28T18:00:00.000Z', actualizadoEn: '2026-07-29T10:15:00.000Z'
    },
    {
        id: 2, codigo: 'RES-0002', canchaId: 1,
        cliente: 'Deportivo La Esquina', telefono: '+56987654321',
        fecha: '2026-08-05', bloque: '21:00', jugadores: 12,
        estado: 'confirmada', comentario: null,
        creadoEn: '2026-07-28T19:30:00.000Z', actualizadoEn: '2026-07-28T19:30:00.000Z'
    },
    {
        id: 3, codigo: 'RES-0003', canchaId: 2,
        cliente: 'Oficina de Contabilidad', telefono: '+56955512340',
        fecha: '2026-08-05', bloque: '19:00', jugadores: 10,
        estado: 'pendiente', comentario: 'Confirman el mismo día en la tarde.',
        creadoEn: '2026-07-30T09:05:00.000Z', actualizadoEn: '2026-07-30T09:05:00.000Z'
    },
    {
        id: 4, codigo: 'RES-0004', canchaId: 3,
        cliente: 'Las Leonas FC', telefono: '+56944498765',
        fecha: '2026-08-06', bloque: '18:00', jugadores: 8,
        estado: 'confirmada', comentario: 'Equipo femenino, torneo interno.',
        creadoEn: '2026-07-30T14:20:00.000Z', actualizadoEn: '2026-07-31T08:00:00.000Z'
    },
    {
        id: 5, codigo: 'RES-0005', canchaId: 3,
        cliente: 'Curso 4°B', telefono: '+56933321456',
        fecha: '2026-08-06', bloque: '17:00', jugadores: 10,
        estado: 'cancelada', comentario: 'Se suspendió por lluvia.',
        creadoEn: '2026-07-29T11:40:00.000Z', actualizadoEn: '2026-08-01T16:10:00.000Z'
    },
    {
        id: 6, codigo: 'RES-0006', canchaId: 5,
        cliente: 'Liga Amateur Ñuñoa', telefono: '+56922234567',
        fecha: '2026-08-07', bloque: '20:00', jugadores: 22,
        estado: 'confirmada', comentario: 'Partido de fecha oficial.',
        creadoEn: '2026-07-25T10:00:00.000Z', actualizadoEn: '2026-07-26T12:30:00.000Z'
    },
    {
        id: 7, codigo: 'RES-0007', canchaId: 5,
        cliente: 'Liga Amateur Ñuñoa', telefono: '+56922234567',
        fecha: '2026-08-07', bloque: '21:00', jugadores: 22,
        estado: 'confirmada', comentario: 'Segundo partido de la fecha.',
        creadoEn: '2026-07-25T10:02:00.000Z', actualizadoEn: '2026-07-26T12:30:00.000Z'
    },
    {
        id: 8, codigo: 'RES-0008', canchaId: 4,
        cliente: 'Junta de Vecinos N°12', telefono: '+56911122334',
        fecha: '2026-08-07', bloque: '18:00', jugadores: 10,
        estado: 'pendiente', comentario: null,
        creadoEn: '2026-08-01T08:45:00.000Z', actualizadoEn: '2026-08-01T08:45:00.000Z'
    },
    {
        id: 9, codigo: 'RES-0009', canchaId: 2,
        cliente: 'Talento Digital G7', telefono: '+56966677889',
        fecha: '2026-08-08', bloque: '19:00', jugadores: 14,
        estado: 'pendiente', comentario: 'Pagan al llegar.',
        creadoEn: '2026-08-01T20:15:00.000Z', actualizadoEn: '2026-08-01T20:15:00.000Z'
    },
    {
        id: 10, codigo: 'RES-0010', canchaId: 1,
        cliente: 'Los Cracks del Barrio', telefono: '+56912345678',
        fecha: '2026-08-08', bloque: '20:00', jugadores: 14,
        estado: 'confirmada', comentario: 'Reserva semanal fija.',
        creadoEn: '2026-07-28T18:05:00.000Z', actualizadoEn: '2026-07-29T10:15:00.000Z'
    },
    {
        id: 11, codigo: 'RES-0011', canchaId: 4,
        cliente: 'Turno de Noche Hospital', telefono: '+56900011223',
        fecha: '2026-08-08', bloque: '23:00', jugadores: 8,
        estado: 'confirmada', comentario: 'Salen del turno a las 22:30.',
        creadoEn: '2026-07-31T22:00:00.000Z', actualizadoEn: '2026-07-31T22:00:00.000Z'
    },
    {
        id: 12, codigo: 'RES-0012', canchaId: 3,
        cliente: 'Colegio San Andrés', telefono: '+56977788990',
        fecha: '2026-08-09', bloque: '16:00', jugadores: 10,
        estado: 'cancelada', comentario: 'El colegio suspendió la actividad.',
        creadoEn: '2026-07-27T15:30:00.000Z', actualizadoEn: '2026-08-02T09:00:00.000Z'
    },
    {
        id: 13, codigo: 'RES-0013', canchaId: 2,
        cliente: 'Amigos del Fútbol', telefono: '+56988899001',
        fecha: '2026-08-09', bloque: '20:00', jugadores: 12,
        estado: 'pendiente', comentario: null,
        creadoEn: '2026-08-02T11:10:00.000Z', actualizadoEn: '2026-08-02T11:10:00.000Z'
    },
    {
        id: 14, codigo: 'RES-0014', canchaId: 5,
        cliente: 'Empresa Andes Ltda.', telefono: '+56911223344',
        fecha: '2026-08-09', bloque: '19:00', jugadores: 20,
        estado: 'confirmada', comentario: 'Actividad de fin de mes.',
        creadoEn: '2026-07-29T16:50:00.000Z', actualizadoEn: '2026-07-30T09:20:00.000Z'
    }
];

/* ------------------------------------------------------------------ */
/* El Pañol — inventario de equipos.                                   */
/*                                                                     */
/* Sólo se lee. `stockTotal` son las unidades que EXISTEN; cuántas hay */
/* disponibles se calcula restando las comprometidas en préstamos      */
/* vivos, y eso lo hace el servidor en cada consulta.                  */
/*                                                                     */
/* El equipo 8 está en mantención: sirve para provocar el 422.         */
/* ------------------------------------------------------------------ */
export const equipos: Equipo[] = [
    { id: 1, nombre: 'Notebook Lenovo ThinkPad',   categoria: 'computacion', marca: 'Lenovo',    stockTotal: 12, valorUnitario: 620000, operativo: true  },
    { id: 2, nombre: 'Proyector portátil',         categoria: 'audiovisual', marca: 'Epson',     stockTotal: 4,  valorUnitario: 380000, operativo: true  },
    { id: 3, nombre: 'Cámara de video',            categoria: 'audiovisual', marca: 'Sony',      stockTotal: 3,  valorUnitario: 890000, operativo: true  },
    { id: 4, nombre: 'Router configurable',        categoria: 'redes',       marca: 'Cisco',     stockTotal: 8,  valorUnitario: 145000, operativo: true  },
    { id: 5, nombre: 'Switch administrable 24p',   categoria: 'redes',       marca: 'TP-Link',   stockTotal: 5,  valorUnitario: 210000, operativo: true  },
    { id: 6, nombre: 'Multímetro digital',         categoria: 'medicion',    marca: 'Fluke',     stockTotal: 15, valorUnitario:  95000, operativo: true  },
    { id: 7, nombre: 'Carro de carga para equipos', categoria: 'mobiliario', marca: 'Genérico',  stockTotal: 2,  valorUnitario:  75000, operativo: true  },
    { id: 8, nombre: 'Osciloscopio',               categoria: 'medicion',    marca: 'Rigol',     stockTotal: 2,  valorUnitario: 540000, operativo: false }
];

/* ------------------------------------------------------------------ */
/* Préstamos.                                                          */
/*                                                                     */
/* Ojo con las cantidades: los estados `pendiente` y `entregado`       */
/* mantienen unidades fuera del pañol. La suma de esos préstamos       */
/* contra el `stockTotal` es lo que produce el 409 por falta de stock. */
/*                                                                     */
/* El equipo 3 (cámaras, stock 3) arranca con las 3 unidades fuera:    */
/* pedir una más da 409 de inmediato, sin tener que preparar nada.     */
/*                                                                     */
/* Hay préstamos con `fechaDevolucion` ya vencida y estado             */
/* `entregado`: el servidor los marca como atrasados al vuelo.         */
/* ------------------------------------------------------------------ */
export const prestamos: Prestamo[] = [
    {
        id: 1, codigo: 'PR-0001', equipoId: 1,
        solicitante: 'Camila Rojas', area: 'Taller de Programación',
        cantidad: 4, fechaRetiro: '2026-07-28', fechaDevolucion: '2026-08-08',
        estado: 'entregado', observacion: 'Para el módulo de frontend.',
        creadoEn: '2026-07-27T14:00:00.000Z', actualizadoEn: '2026-07-28T09:15:00.000Z'
    },
    {
        id: 2, codigo: 'PR-0002', equipoId: 1,
        solicitante: 'Diego Pino', area: 'Certificación G7',
        cantidad: 3, fechaRetiro: '2026-08-01', fechaDevolucion: '2026-08-15',
        estado: 'entregado', observacion: null,
        creadoEn: '2026-07-30T11:20:00.000Z', actualizadoEn: '2026-08-01T08:40:00.000Z'
    },
    {
        id: 3, codigo: 'PR-0003', equipoId: 2,
        solicitante: 'Andrea Bouffanais', area: 'Charla de Titulación',
        cantidad: 2, fechaRetiro: '2026-08-05', fechaDevolucion: '2026-08-07',
        estado: 'pendiente', observacion: 'Retiran a primera hora.',
        creadoEn: '2026-08-02T16:30:00.000Z', actualizadoEn: '2026-08-02T16:30:00.000Z'
    },
    {
        id: 4, codigo: 'PR-0004', equipoId: 3,
        solicitante: 'Marcelo Vera', area: 'Registro Audiovisual',
        cantidad: 2, fechaRetiro: '2026-07-20', fechaDevolucion: '2026-07-31',
        estado: 'entregado', observacion: 'Cobertura de la ceremonia.',
        creadoEn: '2026-07-18T10:00:00.000Z', actualizadoEn: '2026-07-20T09:00:00.000Z'
    },
    {
        id: 5, codigo: 'PR-0005', equipoId: 3,
        solicitante: 'Paula Núñez', area: 'Difusión',
        cantidad: 1, fechaRetiro: '2026-08-03', fechaDevolucion: '2026-08-10',
        estado: 'entregado', observacion: null,
        creadoEn: '2026-08-02T09:45:00.000Z', actualizadoEn: '2026-08-03T08:30:00.000Z'
    },
    {
        id: 6, codigo: 'PR-0006', equipoId: 4,
        solicitante: 'Ignacio Soto', area: 'Laboratorio de Redes',
        cantidad: 6, fechaRetiro: '2026-07-15', fechaDevolucion: '2026-07-29',
        estado: 'devuelto', observacion: 'Devueltos completos y operativos.',
        creadoEn: '2026-07-14T13:10:00.000Z', actualizadoEn: '2026-07-29T17:20:00.000Z'
    },
    {
        id: 7, codigo: 'PR-0007', equipoId: 4,
        solicitante: 'Valentina Cid', area: 'Laboratorio de Redes',
        cantidad: 4, fechaRetiro: '2026-08-04', fechaDevolucion: '2026-08-18',
        estado: 'entregado', observacion: null,
        creadoEn: '2026-08-03T15:00:00.000Z', actualizadoEn: '2026-08-04T08:20:00.000Z'
    },
    {
        id: 8, codigo: 'PR-0008', equipoId: 5,
        solicitante: 'Rodrigo Lara', area: 'Infraestructura',
        cantidad: 2, fechaRetiro: '2026-07-22', fechaDevolucion: '2026-08-01',
        estado: 'entregado', observacion: 'Migración del rack del segundo piso.',
        creadoEn: '2026-07-21T11:00:00.000Z', actualizadoEn: '2026-07-22T09:30:00.000Z'
    },
    {
        id: 9, codigo: 'PR-0009', equipoId: 6,
        solicitante: 'Fernanda Aguilar', area: 'Taller de Electrónica',
        cantidad: 10, fechaRetiro: '2026-08-04', fechaDevolucion: '2026-08-22',
        estado: 'entregado', observacion: 'Uno por estudiante del taller.',
        creadoEn: '2026-08-01T10:15:00.000Z', actualizadoEn: '2026-08-04T08:00:00.000Z'
    },
    {
        id: 10, codigo: 'PR-0010', equipoId: 6,
        solicitante: 'Tomás Herrera', area: 'Mantención',
        cantidad: 2, fechaRetiro: '2026-07-10', fechaDevolucion: '2026-07-20',
        estado: 'devuelto', observacion: null,
        creadoEn: '2026-07-09T08:30:00.000Z', actualizadoEn: '2026-07-20T16:00:00.000Z'
    },
    {
        id: 11, codigo: 'PR-0011', equipoId: 7,
        solicitante: 'Josefa Miranda', area: 'Logística',
        cantidad: 1, fechaRetiro: '2026-08-05', fechaDevolucion: '2026-08-06',
        estado: 'pendiente', observacion: 'Traslado de equipos al auditorio.',
        creadoEn: '2026-08-04T12:00:00.000Z', actualizadoEn: '2026-08-04T12:00:00.000Z'
    },
    {
        id: 12, codigo: 'PR-0012', equipoId: 2,
        solicitante: 'Cristian Fuentes', area: 'Reunión de Apoderados',
        cantidad: 1, fechaRetiro: '2026-07-25', fechaDevolucion: '2026-07-26',
        estado: 'devuelto', observacion: null,
        creadoEn: '2026-07-24T09:00:00.000Z', actualizadoEn: '2026-07-26T18:00:00.000Z'
    },
    {
        id: 13, codigo: 'PR-0013', equipoId: 1,
        solicitante: 'Liga de Robótica', area: 'Extraprogramática',
        cantidad: 2, fechaRetiro: '2026-08-06', fechaDevolucion: '2026-08-20',
        estado: 'pendiente', observacion: 'Competencia regional.',
        creadoEn: '2026-08-03T19:30:00.000Z', actualizadoEn: '2026-08-03T19:30:00.000Z'
    },
    {
        id: 14, codigo: 'PR-0014', equipoId: 5,
        solicitante: 'Camila Rojas', area: 'Taller de Programación',
        cantidad: 1, fechaRetiro: '2026-08-04', fechaDevolucion: '2026-08-12',
        estado: 'entregado', observacion: null,
        creadoEn: '2026-08-03T14:20:00.000Z', actualizadoEn: '2026-08-04T09:10:00.000Z'
    },
    {
        id: 15, codigo: 'PR-0015', equipoId: 6,
        solicitante: 'Diego Pino', area: 'Certificación G7',
        cantidad: 3, fechaRetiro: '2026-07-18', fechaDevolucion: '2026-07-28',
        estado: 'devuelto', observacion: 'Uno llegó con la punta doblada.',
        creadoEn: '2026-07-17T15:45:00.000Z', actualizadoEn: '2026-07-28T17:30:00.000Z'
    }
];

/** Contadores para los identificadores. */
let siguienteTicket = tickets.length + 1;
let siguienteNota = 1;
let siguientePersona = personas.length + 1;
let siguienteReserva = reservas.length + 1;
let siguientePrestamo = prestamos.length + 1;

export const nuevoIdTicket = () => siguienteTicket++;
export const nuevoIdNota = () => siguienteNota++;
export const nuevoIdPersona = () => siguientePersona++;
export const nuevoIdReserva = () => siguienteReserva++;
export const nuevoIdPrestamo = () => siguientePrestamo++;

export const generarCodigo = (id: number) => `TK-${String(id).padStart(4, '0')}`;

export const generarCodigoReserva = (id: number) => `RES-${String(id).padStart(4, '0')}`;

export const generarCodigoPrestamo = (id: number) => `PR-${String(id).padStart(4, '0')}`;

export const marcaDeTiempo = ahora;
