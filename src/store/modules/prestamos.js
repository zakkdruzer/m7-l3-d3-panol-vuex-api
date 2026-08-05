import {
  fetchPrestamos,
  fetchOpcionesPrestamos,
  patchPrestamo,
  eliminarPrestamo,
} from '../../api/prestamos';

const state = () => ({
  datos: [],          // lista de préstamos de la página actual
  meta: null,         // { pagina, porPagina, total, totalPaginas, hayAnterior, haySiguiente }
  opciones: {         // opciones para filtros (estados, estados vivos, categorías)
    estados: [],
    estadosVivos: [],
    categorias: [],
  },
  filtros: {          // filtros de GET /prestamos
    estado: '',
    equipoId: '',
    categoria: '',
    atrasados: '',
    buscar: '',
    orden: 'recientes',
    pagina: 1,
    porPagina: 6,
  },
  cargando: false,    // estado de carga global de la tabla
  error: null,        // error general de la planilla
  filaOcupadaId: null,// id de la fila que está esperando al servidor (PATCH/DELETE)
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
  SET_FILA_OCUPADA(state, id) {
    state.filaOcupadaId = id;
  },
  REEMPLAZAR_PRESTAMO(state, prestamoActualizado) {
    // reemplaza solo la fila que el servidor devolvió actualizada
    state.datos = state.datos.map((p) =>
      p.id === prestamoActualizado.id ? prestamoActualizado : p
    );
  },
};

const actions = {
  // Cargar la planilla con filtros y paginación.
  async cargar({ state, commit }) {
    commit('SET_CARGANDO', true);
    commit('SET_ERROR', null);

    try {
      const params = {};
      if (state.filtros.estado) params.estado = state.filtros.estado;
      if (state.filtros.equipoId) params.equipoId = state.filtros.equipoId;
      if (state.filtros.categoria) params.categoria = state.filtros.categoria;
      if (state.filtros.atrasados) params.atrasados = state.filtros.atrasados;
      if (state.filtros.buscar) params.buscar = state.filtros.buscar;
      if (state.filtros.orden) params.orden = state.filtros.orden;

      params.pagina = state.filtros.pagina;
      params.porPagina = state.filtros.porPagina;

      const respuesta = await fetchPrestamos(params);
      commit('SET_DATOS', respuesta.data.datos);
      commit('SET_META', respuesta.data.meta);
    } catch (err) {
      commit('SET_ERROR', 'No se pudo cargar la planilla de préstamos.');
    } finally {
      commit('SET_CARGANDO', false);
    }
  },

  // Cargar opciones para filtros (estados y categorías).
  async cargarOpciones({ commit }) {
    try {
      const respuesta = await fetchOpcionesPrestamos();
      commit('SET_OPCIONES', respuesta.data);
    } catch (err) {
      commit('SET_OPCIONES', { estados: [], estadosVivos: [], categorias: [] });
    }
  },

  // Cambiar filtros: cualquier cambio vuelve a la página 1.
  async aplicarFiltros({ commit, dispatch, state }, cambios) {
    const nuevosFiltros = { ...state.filtros, ...cambios, pagina: 1 };
    // no enviar filtros vacíos para evitar 400
    commit('SET_FILTROS', nuevosFiltros);
    await dispatch('cargar');
  },

  // Cambiar página usando meta.hayAnterior / haySiguiente.
  async cambiarPagina({ commit, dispatch, state }, direccion) {
    const paginaActual = state.filtros.pagina;
    const meta = state.meta;
    if (!meta) return;

    let nuevaPagina = paginaActual;
    if (direccion === 'anterior' && meta.hayAnterior) {
      nuevaPagina = paginaActual - 1;
    } else if (direccion === 'siguiente' && meta.haySiguiente) {
      nuevaPagina = paginaActual + 1;
    }

    if (nuevaPagina !== paginaActual) {
      commit('SET_FILTROS', { ...state.filtros, pagina: nuevaPagina });
      await dispatch('cargar');
    }
  },

  // Marcar como entregado (PATCH estado: 'entregado').
  async marcarEntregado({ commit }, prestamo) {
    commit('SET_FILA_OCUPADA', prestamo.id);
    try {
      const respuesta = await patchPrestamo(prestamo.id, { estado: 'entregado' });
      // El servidor ya devuelve el préstamo actualizado: se reemplaza solo esa fila.
      commit('REEMPLAZAR_PRESTAMO', respuesta.data);
    } catch (err) {
      // aquí se podría guardar un error más detallado
    } finally {
      // muy importante: limpiar filaOcupada también cuando falla
      commit('SET_FILA_OCUPADA', null);
    }
  },

  // Marcar como devuelto (PATCH estado: 'devuelto').
  async marcarDevuelto({ commit }, prestamo) {
    commit('SET_FILA_OCUPADA', prestamo.id);
    try {
      const respuesta = await patchPrestamo(prestamo.id, { estado: 'devuelto' });
      commit('REEMPLAZAR_PRESTAMO', respuesta.data);
    } catch (err) {
      // manejo de error opcional
    } finally {
      commit('SET_FILA_OCUPADA', null);
    }
  },

  // Eliminar préstamo con confirmación desde el componente.
  async borrar({ commit, dispatch }, id) {
    commit('SET_FILA_OCUPADA', id);
    try {
      await eliminarPrestamo(id);
      // después de borrar, recargar la planilla.
      await dispatch('cargar');
    } catch (err) {
      commit('SET_ERROR', 'No se pudo eliminar el préstamo.');
    } finally {
      commit('SET_FILA_OCUPADA', null);
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
  filaOcupadaId(state) {
    return state.filaOcupadaId;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};