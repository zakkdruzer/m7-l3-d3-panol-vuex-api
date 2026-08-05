import { createRouter, createWebHistory } from 'vue-router';
import InventarioView from '../views/InventarioView.vue';
import PrestamosView from '../views/PrestamosView.vue';
import FormularioPrestamoView from '../views/FormularioPrestamoView.vue';
import PanelEncargadoView from '../views/PanelEncargadoView.vue';

// Se define el router con cuatro rutas principales.
// Cada ruta corresponde a uno de los requisitos del PDF:
// inventario, planilla de préstamos, formulario, y panel del encargado.
const routes = [
  {
    path: '/',
    redirect: '/inventario', // Redirigir la raíz al inventario
  },
  {
    path: '/inventario',
    name: 'inventario',
    component: InventarioView,
  },
  {
    path: '/prestamos',
    name: 'prestamos',
    component: PrestamosView,
  },
  {
    path: '/prestamos/nuevo',
    name: 'prestamo-nuevo',
    component: FormularioPrestamoView,
  },
  {
    path: '/panel',
    name: 'panel',
    component: PanelEncargadoView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;