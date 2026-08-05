// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import InventarioView from '../views/InventarioView.vue';
import PrestamosView from '../views/PrestamosView.vue';
import PrestamoFormView from '../views/PrestamoFormView.vue';
import PanelView from '../views/PanelView.vue';

const routes = [
  {
    path: '/',
    redirect: { name: 'panel' }, // El PDF sugiere una ruta comodín al panel
  },
  {
    path: '/panel',
    name: 'panel',
    component: PanelView,
  },
  {
    path: '/prestamos',
    name: 'prestamos',
    component: PrestamosView,
  },
  {
    path: '/prestamos/nuevo',
    name: 'prestamo-nuevo',
    component: PrestamoFormView,
  },
  {
    path: '/prestamos/:id',
    name: 'prestamo-editar',
    component: PrestamoFormView,
    props: true, // El componente recibe `id` como prop en vez de usar useRoute()
  },
  {
    path: '/inventario',
    name: 'inventario',
    component: InventarioView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;