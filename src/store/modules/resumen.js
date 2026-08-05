import { fetchResumenPrestamos } from '../../api/resumen';

const state = () => ({
  datos: null,        // Objeto con las cifras del pañol
  cargando: false,    // Indicador de carga para el panel
  error: null,        // Mensaje de error
  ultimoFetch: null,  // Marca de tiempo del último fetch
});

const mutations = {
  SET_DATOS(state, datos) {
    state.datos = datos;
  },
  SET_CARGANDO(state, valor) {
    state.cargando = valor;
  },
  SET_ERROR(state, mensaje) {
    state.error = mensaje;
  },
  SET_ULTIMO_FETCH(state, fecha) {
    state.ultimoFetch = fecha;
  },
};

const actions = {
  // Carga el resumen desde el servidor. Se puede forzar recarga
  // pasándole { forzar: true } desde otros módulos.
  async cargar({ commit }, { forzar = false } = {}) {
    commit('SET_ERROR', null);

    // En una versión más avanzada se podría usar forzar y ultimoFetch
    // para evitar recargar demasiado seguido, pero aquí lo simplificamos.
    commit('SET_CARGANDO', true);
    try {
      const respuesta = await fetchResumenPrestamos();
      commit('SET_DATOS', respuesta.data);
      commit('SET_ULTIMO_FETCH', new Date());
    } catch (err) {
      commit('SET_ERROR', 'No se pudo cargar el resumen del pañol.');
    } finally {
      commit('SET_CARGANDO', false);
    }
  },
};

const getters = {
  resumen(state) {
    return state.datos;
  },
  resumenCargando(state) {
    return state.cargando;
  },
  resumenError(state) {
    return state.error;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};