export interface Item {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number;
    createdAt: string;
}

export interface User {
    username: string;
    role: 'admin' | 'user';
}
