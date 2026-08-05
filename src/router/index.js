// Configuración de Vue Router para El Pañol.
// - Usa createWebHashHistory para que funcione bien en GitHub Pages.
// - Define las cuatro pantallas de la actividad y una ruta comodín que redirige al panel.

import { createRouter, createWebHashHistory } from 'vue-router'

// importa tus vistas reales
import PanelView from '../views/PanelView.vue'
import PrestamosView from '../views/PrestamosView.vue'
import InventarioView from '../views/InventarioView.vue'
import PrestamoFormView from '../views/PrestamoFormView.vue'

const router = createRouter({
  // En GitHub Pages es más seguro usar hash mode.
  // import.meta.env.BASE_URL ya incluye el base de Vite.
  history: createWebHashHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      name: 'panel',
      component: PanelView,
    },
    {
      path: '/prestamos',
      name: 'prestamos',
      component: PrestamosView,
    },
    {
      path: '/inventario',
      name: 'inventario',
      component: InventarioView,
    },
    {
      // formulario para crear nuevo préstamo
      path: '/prestamos/nuevo',
      name: 'prestamo-nuevo',
      component: PrestamoFormView,
    },
    {
      // mismo componente para editar, recibiendo el id como prop
      path: '/prestamos/:id',
      name: 'prestamo-editar',
      component: PrestamoFormView,
      props: true,
    },
    {
      // ruta comodín: cualquier cosa rara redirige al panel
      path: '/:pathMatch(.*)*',
      redirect: { name: 'panel' },
    },
  ],
})

export default router