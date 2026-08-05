import { crearPrestamo, fetchPrestamoPorId, actualizarPrestamo } from '../../api/prestamos';

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
  // Entrar a /prestamos/nuevo
  prepararNuevo({ commit }) {
    commit('SET_MODO', { modo: 'crear', id: null });
    commit('REINICIAR_FORMULARIO');
  },

  // Entrar a /prestamos/:id
  async prepararEdicion({ commit }, id) {
    commit('SET_MODO', { modo: 'editar', id });
    commit('REINICIAR_FORMULARIO');
    try {
      const respuesta = await fetchPrestamoPorId(id);
      commit('CARGAR_PRESTAMO_EN_FORMULARIO', respuesta.data);
    } catch (err) {
      // si el id no existe, aquí podrías manejar un redirect o mostrar un mensaje
    }
  },

  // Guardar: según modo, hace POST o PUT
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

      // éxito: limpiar formulario, refrescar planilla y recién ahí navegar
      commit('REINICIAR_FORMULARIO');
      await dispatch('prestamos/cargar', null, { root: true });
      // aquí también podrías invalidar el resumen con dispatch('resumen/cargar', { forzar: true }, { root: true })
      return { ok: true, tipo: 'exito', data: respuesta.data };
    } catch (err) {
      const resp = err.response;
      if (resp && resp.status === 422) {
        // errores por campo: se guardan en erroresCampos
        commit('SET_ERRORES_CAMPOS', resp.data?.errores || {});
        return { ok: false, tipo: '422' };
      } else if (resp && resp.status === 409) {
        // conflicto de stock: se guarda en conflictoStock
        commit('SET_CONFLICTO_STOCK', {
          message: resp.data?.message,
          stock: resp.data?.stock,
        });
        return { ok: false, tipo: '409' };
      }
      // otros errores (network, 500, etc.)
      return { ok: false, tipo: 'otro' };
    } finally {
      commit('SET_ENVIANDO', false);
    }
  },

  // Cambiar un campo y limpiar solo su error 422
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