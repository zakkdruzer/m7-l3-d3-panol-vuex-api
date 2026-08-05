import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret, DURACION_TOKEN_MIN, DURACION_TOKEN_MAX } from '../config.js';
import { authenticateJWT, type AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

/** Usuarios de prueba. Dos roles distintos, a propósito. */
const USUARIOS = [
    { username: 'admin',    password: 'admin123',    role: 'admin',    nombre: 'Ana Díaz' },
    { username: 'operador', password: 'operador123', role: 'operador', nombre: 'Luis Pérez' }
];

function emitirToken(usuario: { username: string; role: string; nombre: string }, minutos: number) {
    const payload = {
        username: usuario.username,
        role: usuario.role,
        nombre: usuario.nombre
    };

    return jwt.sign(payload, getJwtSecret(), { expiresIn: `${minutos}m` });
}

/**
 * POST /api/login
 *
 * Body: { username, password, duracionMinutos? }
 *
 * `duracionMinutos` es opcional y sirve para PRACTICAR la expiración:
 * pide un token de 1 o 2 minutos y observa qué hace tu aplicación cuando
 * caduca, sin tener que esperar una hora frente al computador.
 */
router.post('/login', (req: Request, res: Response) => {
    const { username, password, duracionMinutos } = req.body ?? {};

    const usuario = USUARIOS.find(u => u.username === username && u.password === password);

    if (!usuario) {
        return res.status(401).json({
            message: 'Credenciales inválidas. Usuarios disponibles: admin/admin123 u operador/operador123.'
        });
    }

    const pedido = Number(duracionMinutos);
    const minutos = Number.isFinite(pedido) && pedido > 0
        ? Math.min(pedido, DURACION_TOKEN_MAX)
        : DURACION_TOKEN_MIN;

    const token = emitirToken(usuario, minutos);

    return res.json({
        message: 'Login exitoso',
        token,
        duracionMinutos: minutos,
        usuario: {
            username: usuario.username,
            nombre: usuario.nombre,
            role: usuario.role
        }
    });
});

/**
 * GET /api/perfil — PROTEGIDO
 *
 * Una LECTURA que exige token. Sirve para comprobar que tu interceptor
 * adjunta la credencial también en las peticiones GET, no sólo al escribir.
 */
router.get('/perfil', authenticateJWT, (req: AuthRequest, res: Response) => {
    const { username, role, nombre, iat, exp } = req.user ?? {};

    res.json({
        username,
        nombre,
        role,
        emitidoEn: iat ? new Date(iat * 1000).toISOString() : null,
        expiraEn: exp ? new Date(exp * 1000).toISOString() : null,
        segundosRestantes: exp ? Math.max(0, exp - Math.floor(Date.now() / 1000)) : 0
    });
});

/**
 * POST /api/refresh — PROTEGIDO
 *
 * Entrega un token nuevo a quien ya tiene uno válido. Si el token ya expiró,
 * esto también falla: hay que volver a iniciar sesión.
 */
router.post('/refresh', authenticateJWT, (req: AuthRequest, res: Response) => {
    const { username, role, nombre } = req.user ?? {};

    const pedido = Number(req.body?.duracionMinutos);
    const minutos = Number.isFinite(pedido) && pedido > 0
        ? Math.min(pedido, DURACION_TOKEN_MAX)
        : DURACION_TOKEN_MIN;

    const token = emitirToken({ username, role, nombre }, minutos);

    res.json({ message: 'Token renovado', token, duracionMinutos: minutos });
});

export default router;
