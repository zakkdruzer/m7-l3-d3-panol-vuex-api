import { Router, type Request, type Response } from 'express';
import type { Item } from '../models/item.model.js';
import { authenticateJWT, type AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Mock database
let items: Item[] = [
    { id: 1, name: 'Laptop', description: 'Powerful gaming laptop', category: 'Electronics', price: 1200, createdAt: new Date().toISOString() },
    { id: 2, name: 'Smartphone', description: 'Latest model smartphone', category: 'Electronics', price: 800, createdAt: new Date().toISOString() }
];

// GET: Listar todos (Público)
router.get('/', (req: Request, res: Response) => {
    res.json(items);
});

// GET: Detalle por ID (Público)
router.get('/:id', (req: Request, res: Response) => {
    const idStr = req.params.id as string;
    const item = items.find(i => i.id === Number.parseInt(idStr));
    if (!item) return res.status(404).json({ message: 'Item no encontrado' });
    res.json(item);
});

// POST: Crear (Protegido)
router.post('/', authenticateJWT, (req: AuthRequest, res: Response) => {
    const { name, description, category, price } = req.body;

    if (!name || !price) {
        return res.status(400).json({ message: 'Nombre y precio son obligatorios' });
    }

    const newItem: Item = {
        id: items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1,
        name,
        description: description || '',
        category: category || 'General',
        price,
        createdAt: new Date().toISOString()
    };

    items.push(newItem);
    res.status(201).json(newItem);
});

// PUT: Reemplazo total (Protegido)
router.put('/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
    const idStr = req.params.id as string;
    const itemId = Number.parseInt(idStr);
    const index = items.findIndex(i => i.id === itemId);

    if (index === -1) return res.status(404).json({ message: 'Item no encontrado' });

    const { name, description, category, price } = req.body;

    if (!name || !price) {
        return res.status(400).json({ message: 'Nombre y precio son obligatorios para PUT' });
    }

    items[index] = {
        id: itemId,
        name,
        description: description || '',
        category: category || 'General',
        price,
        createdAt: items[index].createdAt
    };

    res.json(items[index]);
});

// PATCH: Actualización parcial (Protegido)
router.patch('/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
    const idStr = req.params.id as string;
    const itemId = Number.parseInt(idStr);
    const index = items.findIndex(i => i.id === itemId);

    if (index === -1) return res.status(404).json({ message: 'Item no encontrado' });

    items[index] = { ...items[index], ...req.body, id: itemId };

    res.json(items[index]);
});

// DELETE: Eliminar (Protegido)
router.delete('/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
    const idStr = req.params.id as string;
    const itemId = Number.parseInt(idStr);
    const initialLength = items.length;
    items = items.filter(i => i.id !== itemId);

    if (items.length === initialLength) {
        return res.status(404).json({ message: 'Item no encontrado' });
    }

    res.json({ message: 'Item eliminado correctamente' });
});

export default router;
