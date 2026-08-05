import { fetchResumenPrestamos } from '../../api/resumen';

const state = () => ({
  datos: null,       // objeto con total, porEstado, porEquipo, porCategoria, etc.
  cargando: false,
  error: null,
  ultimoFetch: null, // fecha del último fetch para el caché de 30s
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
  // Carga el resumen, respetando caché salvo que se pase { forzar: true }.
  async cargar({ state, commit }, { forzar = false } = {}) {
    commit('SET_ERROR', null);

    const ahora = Date.now();

    if (
      state.ultimoFetch &&
      !forzar &&
      ahora - state.ultimoFetch < 30_000 // 30 segundos
    ) {
      // todavía dentro de la ventana de caché: no volver a pedir
      return;
    }

    commit('SET_CARGANDO', true);
    try {
      const respuesta = await fetchResumenPrestamos();
      commit('SET_DATOS', respuesta.data);
      commit('SET_ULTIMO_FETCH', Date.now());
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
  // getters de forma: preparan datos completos para pintar,
  // sin inventar totales a partir de la página actual.
  cifras(state) {
    if (!state.datos) return [];
    const d = state.datos;
    return [
      { rotulo: 'Préstamos', valor: d.total, tipo: 'normal' },
      { rotulo: 'Unidades fuera', valor: d.unidadesFuera, tipo: 'bien' },
      {
        rotulo: 'Atrasados',
        valor: d.atrasados,
        tipo: d.atrasados > 0 ? 'malo' : 'aviso',
      },
      {
        rotulo: 'En circulación',
        valor: d.valorEnCirculacion,
        tipo: 'aviso',
      },
    ];
  },
  usoPorEquipo(state) {
    // porEquipo trae usoPorcentaje, stockTotal, comprometidas, etc.
    return state.datos?.porEquipo || [];
  },
  prestamosPorCategoria(state) {
    // porCategoria es un objeto; se devuelve tal cual para que el componente
    // recorra claves y valores.
    return state.datos?.porCategoria || {};
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};