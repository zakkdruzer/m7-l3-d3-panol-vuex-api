// src/store/modules/equipos.js
import { fetchEquipos, fetchCategoriasEquipos } from '../../api/equipos';

// El state es una función para evitar compartir estado entre instancias.
const state = () => ({
  lista: [],        // Arreglo con todos los equipos
  categorias: [],   // Opciones del selector de categorías
  cargando: false,  // Indicador de carga para la pantalla de inventario
  error: null,      // Mensaje de error si la petición falla
  filtros: {        // Filtros aplicados al inventario
    categoria: '',
    operativo: null,
    conStock: null,
  },
});

const mutations = {
  // Asigna la lista completa de equipos
  SET_EQUIPOS(state, equipos) {
    state.lista = equipos;
  },
  // Asigna las categorías para el selector
  SET_CATEGORIAS(state, categorias) {
    state.categorias = categorias;
  },
  // Marca que se está cargando o no
  SET_CARGANDO(state, valor) {
    state.cargando = valor;
  },
  // Guarda un mensaje de error
  SET_ERROR(state, mensaje) {
    state.error = mensaje;
  },
  // Actualiza los filtros del inventario
  SET_FILTROS(state, filtros) {
    state.filtros = { ...state.filtros, ...filtros };
  },
};

const actions = {
  // Carga el inventario desde el servidor, respetando los filtros aplicados.
  // Aquí vive axios (a través de las funciones de api), tal como pide el PDF.
  async cargar({ commit, state }) {
    commit('SET_CARGANDO', true);
    commit('SET_ERROR', null);
    try {
      // Se prepara el objeto de filtros sólo con los campos que tienen valor.
      const params = {};
      if (state.filtros.categoria) params.categoria = state.filtros.categoria;
      if (state.filtros.operativo !== null) params.operativo = state.filtros.operativo;
      if (state.filtros.conStock !== null) params.conStock = state.filtros.conStock;

      const respuesta = await fetchEquipos(params);
      commit('SET_EQUIPOS', respuesta.data);
    } catch (err) {
      // Si la petición falla, se guarda un mensaje genérico.
      commit('SET_ERROR', 'No se pudo cargar el inventario.');
    } finally {
      // El finally asegura que se apague el indicador de carga,
      // incluso si la petición falla.
      commit('SET_CARGANDO', false);
    }
  },

  // Carga las categorías para los filtros del inventario.
  async cargarCategorias({ commit }) {
    try {
      const respuesta = await fetchCategoriasEquipos();
      // La respuesta es un objeto { categorias: [...] }
      commit('SET_CATEGORIAS', respuesta.data.categorias);
    } catch (err) {
      // En este caso se deja las categorías vacías si hay error.
      commit('SET_CATEGORIAS', []);
    }
  },

  // Permite actualizar los filtros desde los componentes
  // y relanzar la carga de equipos.
  async aplicarFiltros({ commit, dispatch }, filtros) {
    commit('SET_FILTROS', filtros);
    // Se vuelve a llamar a cargar para refrescar la lista con los nuevos filtros
    await dispatch('cargar');
  },
};

const getters = {
  // Devuelve la lista tal cual viene del servidor; el campo "disponibles"
  // ya está calculado en el backend, no se recalcula aquí.
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
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};