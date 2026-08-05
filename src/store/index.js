import { createStore } from 'vuex';
import equipos from './modules/equipos';
import prestamos from './modules/prestamos';
import formularioPrestamo from './modules/formularioPrestamo';
import resumen from './modules/resumen';

// Se crea el store principal y se registran los cuatro módulos
// con namespaced:true, tal como pide la guía.
const store = createStore({
  modules: {
    equipos,
    prestamos,
    formularioPrestamo,
    resumen,
  },
});

export default store;