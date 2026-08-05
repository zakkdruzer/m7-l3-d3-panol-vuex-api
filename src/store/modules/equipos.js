import { fetchEquipos, fetchCategoriasEquipos } from '../../api/equipos';

// state como función, con lista, cargando, error y marca de caché.
const state = () => ({
  lista: [],
  categorias: [],
  cargando: false,
  error: null,
  filtros: {
    categoria: '',
    operativo: null,
    conStock: null,
  },
  ultimaCarga: null, // para saber si ya se pidió el catálogo
});

const mutations = {
  SET_EQUIPOS(state, equipos) {
    state.lista = equipos;
  },
  SET_CATEGORIAS(state, categorias) {
    state.categorias = categorias;
  },
  SET_CARGANDO(state, valor) {
    state.cargando = valor;
  },
  SET_ERROR(state, mensaje) {
    state.error = mensaje;
  },
  SET_FILTROS(state, filtros) {
    state.filtros = { ...state.filtros, ...filtros };
  },
  SET_ULTIMA_CARGA(state, fecha) {
    state.ultimaCarga = fecha;
  },
};

const actions = {
  // Carga el inventario. Si ya se cargó y no se pide forzar, NO vuelve a llamar al backend.
  async cargar({ state, commit }, { forzar = false } = {}) {
    // si ya se cargó una vez y no se pide forzar, se sale rápido
    if (state.lista.length > 0 && !forzar) {
      return;
    }

    commit('SET_CARGANDO', true);
    commit('SET_ERROR', null);

    try {
      const params = {};
      if (state.filtros.categoria) params.categoria = state.filtros.categoria;
      if (state.filtros.operativo !== null) params.operativo = state.filtros.operativo;
      if (state.filtros.conStock !== null) params.conStock = state.filtros.conStock;

      const respuesta = await fetchEquipos(params);
      commit('SET_EQUIPOS', respuesta.data);
      commit('SET_ULTIMA_CARGA', new Date());
    } catch (err) {
      commit('SET_ERROR', 'No se pudo cargar el inventario.');
    } finally {
      commit('SET_CARGANDO', false);
    }
  },

  async cargarCategorias({ commit, state }) {
    // si ya tenemos categorías, no recargamos salvo que quisieras luego un forzar aquí
    if (state.categorias.length > 0) {
      return;
    }
    try {
      const respuesta = await fetchCategoriasEquipos();
      commit('SET_CATEGORIAS', respuesta.data.categorias);
    } catch (err) {
      commit('SET_CATEGORIAS', []);
    }
  },

  // Actualiza filtros y fuerza recarga (porque cambió lo que se está pidiendo)
  async aplicarFiltros({ commit, dispatch }, filtros) {
    commit('SET_FILTROS', filtros);
    await dispatch('cargar', { forzar: true });
  },
};

const getters = {
  equipos(state) {
    return state.lista;
  },
  categorias(state) {
    return state.categorias;
  },
  inventarioCargando(state) {
    return state.cargando;
  },
  inventarioError(state) {
    return state.error;
  },
  // Índice por id para usar en otros módulos sin hacer find() cada vez
  equipoPorId(state) {
    const mapa = new Map();
    state.lista.forEach((eq) => {
      mapa.set(eq.id, eq);
    });
    return mapa;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};