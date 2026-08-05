// Módulo Vuex para la planilla de préstamos:
// - carga lista paginada desde GET /prestamos
// - maneja filtros, paginación, acciones PATCH/DELETE por fila
// - guarda aviso de éxito para mostrar una franja verde en la vista

import {
  fetchPrestamos,
  fetchOpcionesPrestamos,
  patchPrestamo,
  eliminarPrestamo,
} from '../../api/prestamos';

const state = () => ({
  datos: [],          // préstamos de la página actual
  meta: null,         // información de paginación { pagina, porPagina, total, totalPaginas, hayAnterior, haySiguiente }
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
  cargando: false,    // indicador de carga global de la tabla
  error: null,        // mensaje de error general
  filaOcupadaId: null,// id de la fila que está esperando respuesta del servidor
  avisoExito: null,   // mensaje de éxito (por ejemplo, al crear un préstamo)
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
    // Reemplaza sólo la fila cuyo id coincide con el que devolvió el servidor.
    state.datos = state.datos.map((p) =>
      p.id === prestamoActualizado.id ? prestamoActualizado : p
    );
  },
  SET_AVISO_EXITO(state, mensaje) {
    state.avisoExito = mensaje;
  },
};

const actions = {
  // Carga la planilla con los filtros y paginación actuales.
  async cargar({ state, commit }) {
    commit('SET_CARGANDO', true);
    commit('SET_ERROR', null);

    try {
      const params = {};

      // Sólo se envían filtros que tienen valor, para evitar 400 por filtros vacíos.
      if (state.filtros.estado) params.estado = state.filtros.estado;
      if (state.filtros.equipoId) params.equipoId = state.filtros.equipoId;
      if (state.filtros.categoria) params.categoria = state.filtros.categoria;
      if (state.filtros.atrasados) params.atrasados = state.filtros.atrasados;
      if (state.filtros.buscar) params.buscar = state.filtros.buscar;
      if (state.filtros.orden) params.orden = state.filtros.orden;

      params.pagina = state.filtros.pagina;
      params.porPagina = state.filtros.porPagina;

      const respuesta = await fetchPrestamos(params);
      // La API devuelve { datos, meta }.
      commit('SET_DATOS', respuesta.data.datos);
      commit('SET_META', respuesta.data.meta);
    } catch (err) {
      commit('SET_ERROR', 'No se pudo cargar la planilla de préstamos.');
    } finally {
      commit('SET_CARGANDO', false);
    }
  },

  // Carga opciones para los filtros (estados, categorías).
  async cargarOpciones({ commit }) {
    try {
      const respuesta = await fetchOpcionesPrestamos();
      commit('SET_OPCIONES', respuesta.data);
    } catch (err) {
      commit('SET_OPCIONES', { estados: [], estadosVivos: [], categorias: [] });
    }
  },

  // Aplica cambios de filtros y vuelve a la página 1.
  async aplicarFiltros({ commit, dispatch, state }, cambios) {
    const nuevosFiltros = { ...state.filtros, ...cambios, pagina: 1 };
    commit('SET_FILTROS', nuevosFiltros);
    await dispatch('cargar');
  },

  // Cambia página usando meta.hayAnterior / meta.haySiguiente.
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

  // Marca un préstamo como entregado (PATCH estado: 'entregado').
  async marcarEntregado({ commit }, prestamo) {
    commit('SET_FILA_OCUPADA', prestamo.id);
    try {
      // El servidor devuelve el préstamo ya actualizado, con todos los campos derivados.
      const respuesta = await patchPrestamo(prestamo.id, { estado: 'entregado' });
      commit('REEMPLAZAR_PRESTAMO', respuesta.data);
    } catch (err) {
      // Aquí podrías manejar errores específicos si quisieras.
    } finally {
      // Siempre se limpia la marca de fila ocupada, incluso en caso de error.
      commit('SET_FILA_OCUPADA', null);
    }
  },

  // Marca un préstamo como devuelto (PATCH estado: 'devuelto').
  async marcarDevuelto({ commit }, prestamo) {
    commit('SET_FILA_OCUPADA', prestamo.id);
    try {
      const respuesta = await patchPrestamo(prestamo.id, { estado: 'devuelto' });
      commit('REEMPLAZAR_PRESTAMO', respuesta.data);
    } catch (err) {
      // Manejo de errores opcional.
    } finally {
      commit('SET_FILA_OCUPADA', null);
    }
  },

  // Elimina un préstamo tras confirmación en el componente.
  async borrar({ commit, dispatch }, id) {
    commit('SET_FILA_OCUPADA', id);
    try {
      await eliminarPrestamo(id);
      // Después de borrar se recarga la planilla; el servidor ajusta meta y datos.
      await dispatch('cargar');
    } catch (err) {
      commit('SET_ERROR', 'No se pudo eliminar el préstamo.');
    } finally {
      commit('SET_FILA_OCUPADA', null);
    }
  },

  // Muestra un aviso verde de éxito en la planilla y lo limpia automáticamente
  // a los 4 segundos.
  mostrarAvisoExito({ commit }, mensaje) {
    commit('SET_AVISO_EXITO', mensaje);
    setTimeout(() => {
      commit('SET_AVISO_EXITO', null);
    }, 4000);
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
  avisoExito(state) {
    return state.avisoExito;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};