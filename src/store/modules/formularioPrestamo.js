// Módulo Vuex para el formulario de préstamos:
// - mismo formulario sirve para crear y editar
// - maneja errores 422 por campo y conflictos 409 de stock en propiedades separadas
// - al guardar bien, refresca la planilla y dispara el aviso de éxito

import {
  crearPrestamo,
  fetchPrestamoPorId,
  actualizarPrestamo,
} from '../../api/prestamos';

// Función que genera el objeto inicial del formulario.
// Se usa en state y al reiniciar el formulario para no arrastrar datos viejos.
const estadoInicial = () => ({
  equipoId: '',
  solicitante: '',
  area: '',
  cantidad: 1,
  fechaRetiro: '',
  fechaDevolucion: '',
  observacion: '',
});

const state = () => ({
  modelo: estadoInicial(),  // campos del formulario
  erroresCampos: {},        // 422: errores por campo
  conflictoStock: null,     // 409: { message, stock }
  enviando: false,          // indicador de guardando
  modo: 'crear',            // 'crear' | 'editar'
  idActual: null,           // id del préstamo que se está editando
});

const mutations = {
  SET_CAMPO(state, { campo, valor }) {
    state.modelo[campo] = valor;
  },
  SET_ERRORES_CAMPOS(state, errores) {
    state.erroresCampos = errores || {};
  },
  SET_CONFLICTO_STOCK(state, conflicto) {
    state.conflictoStock = conflicto;
  },
  SET_ENVIANDO(state, valor) {
    state.enviando = valor;
  },
  SET_MODO(state, { modo, id }) {
    state.modo = modo;
    state.idActual = id ?? null;
  },
  REINICIAR_FORMULARIO(state) {
    state.modelo = estadoInicial();
    state.erroresCampos = {};
    state.conflictoStock = null;
  },
  CARGAR_PRESTAMO_EN_FORMULARIO(state, prestamo) {
    // Carga los datos del préstamo en el formulario de edición.
    state.modelo = {
      equipoId: String(prestamo.equipoId),
      solicitante: prestamo.solicitante,
      area: prestamo.area,
      cantidad: prestamo.cantidad,
      fechaRetiro: prestamo.fechaRetiro,
      fechaDevolucion: prestamo.fechaDevolucion,
      observacion: prestamo.observacion ?? '',
    };
  },
};

const actions = {
  // Preparar formulario para /prestamos/nuevo (modo crear).
  prepararNuevo({ commit }) {
    commit('SET_MODO', { modo: 'crear', id: null });
    commit('REINICIAR_FORMULARIO');
  },

  // Preparar formulario para /prestamos/:id (modo editar).
  async prepararEdicion({ commit }, id) {
    commit('SET_MODO', { modo: 'editar', id });
    commit('REINICIAR_FORMULARIO');
    try {
      const respuesta = await fetchPrestamoPorId(id);
      commit('CARGAR_PRESTAMO_EN_FORMULARIO', respuesta.data);
    } catch (err) {
      // Aquí podrías manejar el caso de id inexistente (404) con un redirect o aviso.
    }
  },

  // Guardar formulario: si modo es 'crear' usa POST; si es 'editar' usa PUT.
  async guardar({ state, commit, dispatch }) {
    commit('SET_ENVIANDO', true);
    commit('SET_ERRORES_CAMPOS', {});
    commit('SET_CONFLICTO_STOCK', null);

    try {
      let respuesta;
      if (state.modo === 'crear') {
        respuesta = await crearPrestamo(state.modelo);
      } else {
        respuesta = await actualizarPrestamo(state.idActual, state.modelo);
      }

      // Éxito: limpiar formulario, refrescar planilla y disparar aviso verde.
      commit('REINICIAR_FORMULARIO');

      // Recargar la planilla de préstamos para que refleje el cambio.
      await dispatch('prestamos/cargar', null, { root: true });

      // Disparar un aviso de éxito en la planilla. Si tu API devuelve código,
      // puedes usar respuesta.data.codigo aquí.
      await dispatch(
        'prestamos/mostrarAvisoExito',
        'Préstamo guardado correctamente.',
        { root: true }
      );

      // Devolver resultado para que el componente decida si navegar o no.
      return { ok: true, tipo: 'exito', data: respuesta.data };
    } catch (err) {
      const resp = err.response;
      if (resp && resp.status === 422) {
        // Errores de validación por campo: se guardan en erroresCampos.
        commit('SET_ERRORES_CAMPOS', resp.data?.errores || {});
        return { ok: false, tipo: '422' };
      } else if (resp && resp.status === 409) {
        // Conflicto de stock: se guarda en conflictoStock con message y stock.
        commit('SET_CONFLICTO_STOCK', {
          message: resp.data?.message,
          stock: resp.data?.stock,
        });
        return { ok: false, tipo: '409' };
      }
      // Otros errores (network, 500, etc.)
      return { ok: false, tipo: 'otro' };
    } finally {
      commit('SET_ENVIANDO', false);
    }
  },

  // Actualizar un campo y, si tenía error 422, limpiar solo ese mensaje.
  actualizarCampo({ commit, state }, { campo, valor }) {
    commit('SET_CAMPO', { campo, valor });
    if (state.erroresCampos[campo]) {
      const nuevosErrores = { ...state.erroresCampos };
      delete nuevosErrores[campo];
      commit('SET_ERRORES_CAMPOS', nuevosErrores);
    }
  },
};

const getters = {
  modelo(state) {
    return state.modelo;
  },
  erroresCampos(state) {
    return state.erroresCampos;
  },
  conflictoStock(state) {
    return state.conflictoStock;
  },
  enviando(state) {
    return state.enviando;
  },
  modo(state) {
    return state.modo;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};