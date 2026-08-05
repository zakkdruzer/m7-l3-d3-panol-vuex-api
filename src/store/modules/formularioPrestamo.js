import { crearPrestamo } from '../../api/prestamos';

const state = () => ({
  // Estado del formulario de nuevo préstamo
  modelo: {
    equipoId: '',
    solicitante: '',
    area: '',
    cantidad: 1,
    fechaRetiro: '',
    fechaDevolucion: '',
    observacion: '',
  },
  erroresCampos: {},   // Errores por campo devueltos en el 422
  conflictoStock: null,// Datos del 409: { message, stock }
  enviando: false,     // Indicador de envío
  exito: null,         // Opcional: mensaje de éxito con código de préstamo
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
  SET_EXITO(state, mensaje) {
    state.exito = mensaje;
  },
  REINICIAR_FORMULARIO(state) {
    state.modelo = {
      equipoId: '',
      solicitante: '',
      area: '',
      cantidad: 1,
      fechaRetiro: '',
      fechaDevolucion: '',
      observacion: '',
    };
    state.erroresCampos = {};
    state.conflictoStock = null;
    state.exito = null;
  },
};

const actions = {
  // Envía el formulario al servidor manejando 422 y 409 de forma diferenciada.
  async enviar({ state, commit, dispatch }) {
    commit('SET_ENVIANDO', true);
    commit('SET_ERRORES_CAMPOS', {});
    commit('SET_CONFLICTO_STOCK', null);
    commit('SET_EXITO', null);

    try {
      const respuesta = await crearPrestamo(state.modelo);

      // Si llega aquí es porque el servidor aceptó el préstamo (201 Created).
      // Se puede obtener el código desde Location o el cuerpo, según cómo
      // esté configurado el backend educativo.
      commit('SET_EXITO', 'Préstamo creado correctamente.');
      // Opcional: recargar planilla y resumen después de éxito.
      await dispatch('prestamos/cargar', null, { root: true });
      await dispatch('resumen/cargar', { forzar: true }, { root: true });
    } catch (err) {
      // Se distingue entre 422 y 409 usando el status de la respuesta.
      const respuesta = err.response;
      if (respuesta && respuesta.status === 422) {
        // El backend devuelve detalle por campo; aquí se guarda tal cual
        // para que el componente pueda mostrarlo bajo cada input.
        commit('SET_ERRORES_CAMPOS', respuesta.data?.errores || {});
      } else if (respuesta && respuesta.status === 409) {
        // El 409 por stock trae { message, stock } con las cifras completas.
        commit('SET_CONFLICTO_STOCK', {
          message: respuesta.data?.message,
          stock: respuesta.data?.stock,
        });
      } else {
        // Otros errores se podrían manejar con un mensaje genérico.
        commit('SET_EXITO', null);
      }
    } finally {
      commit('SET_ENVIANDO', false);
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
  exito(state) {
    return state.exito;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};