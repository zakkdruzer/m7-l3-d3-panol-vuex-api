import { fetchPrestamos, fetchOpcionesPrestamos, eliminarPrestamo } from '../../api/prestamos';

const state = () => ({
  datos: [],         // Arreglo de préstamos de la página actual
  meta: null,        // Información de paginación { pagina, porPagina, total, ... }
  opciones: {        // Estados y categorías para filtros
    estados: [],
    estadosVivos: [],
    categorias: [],
  },
  filtros: {         // Filtros para GET /prestamos
    estado: '',
    equipoId: '',
    categoria: '',
    atrasados: '',
    buscar: '',
    orden: 'recientes',
    pagina: 1,
    porPagina: 6,
  },
  cargando: false,   // Indicador de carga para la planilla
  error: null,       // Mensaje de error http general
  avisoEliminacion: null, // Opcional: mensaje cuando se elimina un préstamo
});

const mutations = {
  SET_DATOS(state, datos) {
    state.datos = datos;
  },
  SET_META(state, meta) {
    state.meta = meta;
  },
  SET_OPCIONES(state, opciones) {
    state.opciones = opciones;
  },
  SET_FILTROS(state, filtros) {
    state.filtros = { ...state.filtros, ...filtros };
  },
  SET_CARGANDO(state, valor) {
    state.cargando = valor;
  },
  SET_ERROR(state, mensaje) {
    state.error = mensaje;
  },
  SET_AVISO_ELIMINACION(state, mensaje) {
    state.avisoEliminacion = mensaje;
  },
};

const actions = {
  // Carga la planilla desde el servidor con filtros y paginación.
  async cargar({ commit, state }) {
    commit('SET_CARGANDO', true);
    commit('SET_ERROR', null);
    try {
      const params = {};
      // Se incluyen sólo los filtros que tienen valor para evitar enviar vacíos.
      if (state.filtros.estado) params.estado = state.filtros.estado;
      if (state.filtros.equipoId) params.equipoId = state.filtros.equipoId;
      if (state.filtros.categoria) params.categoria = state.filtros.categoria;
      if (state.filtros.atrasados) params.atrasados = state.filtros.atrasados;
      if (state.filtros.buscar) params.buscar = state.filtros.buscar;
      if (state.filtros.orden) params.orden = state.filtros.orden;
      params.pagina = state.filtros.pagina;
      params.porPagina = state.filtros.porPagina;

      const respuesta = await fetchPrestamos(params);
      // respuesta.data tiene forma { datos, meta }
      commit('SET_DATOS', respuesta.data.datos);
      commit('SET_META', respuesta.data.meta);
    } catch (err) {
      commit('SET_ERROR', 'No se pudo cargar la planilla de préstamos.');
    } finally {
      commit('SET_CARGANDO', false);
    }
  },

  // Carga las opciones de estados y categorías.
  async cargarOpciones({ commit }) {
    try {
      const respuesta = await fetchOpcionesPrestamos();
      commit('SET_OPCIONES', respuesta.data);
    } catch (err) {
      // Si falla, las opciones se dejan en blanco.
      commit('SET_OPCIONES', { estados: [], estadosVivos: [], categorias: [] });
    }
  },

  // Actualiza filtros y recarga la planilla.
  async aplicarFiltros({ commit, dispatch }, filtros) {
    commit('SET_FILTROS', filtros);
    await dispatch('cargar');
  },

  // Cambia de página en la planilla.
  async cambiarPagina({ commit, dispatch }, pagina) {
    commit('SET_FILTROS', { pagina });
    await dispatch('cargar');
  },

  // Elimina un préstamo y vuelve a cargar la planilla,
  // mostrando un aviso opcional.
  async borrar({ commit, dispatch }, id) {
    commit('SET_ERROR', null);
    try {
      const respuesta = await eliminarPrestamo(id);
      commit('SET_AVISO_ELIMINACION', `Préstamo ${respuesta.data.id} eliminado correctamente.`);
      await dispatch('cargar');
    } catch (err) {
      commit('SET_ERROR', 'No se pudo eliminar el préstamo.');
    }
  },
};

const getters = {
  prestamos(state) {
    return state.datos;
  },
  metaPrestamos(state) {
    return state.meta;
  },
  opcionesPrestamos(state) {
    return state.opciones;
  },
  prestamosCargando(state) {
    return state.cargando;
  },
  prestamosError(state) {
    return state.error;
  },
  avisoEliminacion(state) {
    return state.avisoEliminacion;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};