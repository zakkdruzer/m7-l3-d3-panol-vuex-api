<template>
  <section>
    <header class="cabecera">
      <div>
        <h2>Préstamos</h2>
        <p class="sub">
          <!-- contador usando meta -->
          Mostrando {{ prestamos.length }} de {{ meta?.total ?? 0 }}
        </p>
      </div>
      <div>
        <RouterLink :to="{ name: 'prestamo-nuevo' }" class="btn">
          Registrar préstamo
        </RouterLink>
      </div>
    </header>

    <!-- Barra de filtros -->
    <div class="filtros">
      <!-- Buscar -->
      <input
        type="search"
        placeholder="Buscar por solicitante, área o código"
        :value="filtros.buscar"
        @input="onBuscar($event.target.value)"
      />

      <!-- Estado -->
      <select :value="filtros.estado" @change="onEstado($event.target.value)">
        <option value="">Todos los estados</option>
        <option
          v-for="estado in opciones.estados"
          :key="estado"
          :value="estado"
        >
          {{ estado }}
        </option>
      </select>

      <!-- Equipo (selector alimentado por módulo equipos) -->
      <select :value="filtros.equipoId" @change="onEquipo($event.target.value)">
        <option value="">Todos los equipos</option>
        <option
          v-for="equipo in equipos"
          :key="equipo.id"
          :value="equipo.id"
        >
          {{ equipo.nombre }}
        </option>
      </select>

      <!-- Atrasados -->
      <select :value="filtros.atrasados" @change="onAtrasados($event.target.value)">
        <option value="">Atrasados y al día</option>
        <option value="true">Sólo atrasados</option>
        <option value="false">Sólo al día</option>
      </select>

      <button class="btn btn--gris" @click="limpiarFiltros">
        Limpiar
      </button>
    </div>

    <!-- Estado: cargando -->
    <div v-if="cargando" class="aviso">
      Cargando préstamos...
    </div>

    <!-- Estado: error -->
    <div v-else-if="error" class="aviso aviso--error">
      <p>{{ error }}</p>
      <button class="btn btn--fino" @click="reintentar">
        Reintentar
      </button>
    </div>

    <!-- Estado: vacío (con o sin filtros) -->
    <div v-else-if="prestamos.length === 0" class="aviso">
      <p v-if="tieneFiltros">
        Nada calza con esos filtros.
      </p>
      <p v-else>
        Todavía no hay préstamos registrados.
      </p>
    </div>

    <!-- Tabla con datos -->
    <div v-else class="tabla-caja">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Solicitante</th>
            <th>Equipo</th>
            <th>Cant.</th>
            <th>Devolución</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="prestamo in prestamos"
            :key="prestamo.id"
            :class="{
              atrasada: prestamo.atrasado,
              ocupada: prestamo.id === filaOcupadaId,
            }"
          >
            <td class="mono">
              {{ prestamo.codigo }}
            </td>

            <td>
              <strong>{{ prestamo.solicitante }}</strong>
              <small>{{ prestamo.area }}</small>
            </td>

            <td>
              {{ prestamo.equipoNombre }}
              <small>{{ prestamo.equipoCategoria }}</small>
            </td>

            <td>
              {{ prestamo.cantidad }}
            </td>

            <td style="white-space: nowrap;">
              {{ fechaCorta(prestamo.fechaDevolucion) }}
              <small v-if="prestamo.atrasado">
                {{ prestamo.diasAtraso }} días de atraso
              </small>
            </td>

            <td>
              <span class="chip" :class="claseChip(prestamo.estado)">
                {{ prestamo.estado }}
              </span>
              <span
                v-if="prestamo.atrasado"
                class="chip chip--atraso"
              >
                Atrasado
              </span>
            </td>

            <td style="white-space: nowrap;">
              <!-- Botones según estado -->
              <button
                v-if="prestamo.estado === 'pendiente'"
                class="btn btn--fino"
                @click="entregar(prestamo)"
                :disabled="filaOcupadaId === prestamo.id"
              >
                Entregar
              </button>

              <button
                v-if="prestamo.estado === 'entregado'"
                class="btn btn--fino"
                @click="devolver(prestamo)"
                :disabled="filaOcupadaId === prestamo.id"
              >
                Devolver
              </button>

              <RouterLink
                :to="{ name: 'prestamo-editar', params: { id: prestamo.id } }"
                class="btn btn--fino btn--gris"
              >
                Editar
              </RouterLink>

              <button
                class="btn btn--fino btn--gris"
                @click="confirmarBorrado(prestamo.id)"
                :disabled="filaOcupadaId === prestamo.id"
              >
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    <nav
      v-if="meta"
      class="cabecera"
      style="margin-top: 1rem; justify-content: center; gap: 1rem;"
    >
      <button
        class="btn btn--gris"
        @click="paginaAnterior"
        :disabled="!meta.hayAnterior"
      >
        Anterior
      </button>
      <span class="sub">
        Página {{ meta.pagina }} de {{ meta.totalPaginas }}
      </span>
      <button
        class="btn btn--gris"
        @click="paginaSiguiente"
        :disabled="!meta.haySiguiente"
      >
        Siguiente
      </button>
    </nav>
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// Lectura del módulo prestamos
const prestamos = computed(() => store.getters['prestamos/prestamos']);
const meta = computed(() => store.getters['prestamos/metaPrestamos']);
const opciones = computed(() => store.getters['prestamos/opcionesPrestamos']);
const cargando = computed(() => store.getters['prestamos/prestamosCargando']);
const error = computed(() => store.getters['prestamos/prestamosError']);
const filaOcupadaId = computed(() => store.getters['prestamos/filaOcupadaId']);
const filtros = computed(() => store.state.prestamos.filtros);

// Lectura del módulo equipos para el selector de filtro por equipo
const equipos = computed(() => store.getters['equipos/equipos']);

const tieneFiltros = computed(() => {
  const f = filtros.value;
  return !!(f.estado || f.equipoId || f.categoria || f.atrasados || f.buscar);
});

// Carga inicial
onMounted(() => {
  store.dispatch('prestamos/cargar');
  store.dispatch('prestamos/cargarOpciones');
  store.dispatch('equipos/cargar');
});

// Handlers de filtros: leen value y escriben vía action (no v-model contra store)
function onBuscar(valor) {
  store.dispatch('prestamos/aplicarFiltros', { buscar: valor });
}

function onEstado(valor) {
  store.dispatch('prestamos/aplicarFiltros', { estado: valor || '' });
}

function onEquipo(valor) {
  store.dispatch('prestamos/aplicarFiltros', { equipoId: valor || '' });
}

function onAtrasados(valor) {
  store.dispatch('prestamos/aplicarFiltros', { atrasados: valor || '' });
}

function limpiarFiltros() {
  store.dispatch('prestamos/aplicarFiltros', {
    estado: '',
    equipoId: '',
    categoria: '',
    atrasados: '',
    buscar: '',
  });
}

function reintentar() {
  store.dispatch('prestamos/cargar');
}

// Acciones de fila
function entregar(prestamo) {
  store.dispatch('prestamos/marcarEntregado', prestamo);
}

function devolver(prestamo) {
  store.dispatch('prestamos/marcarDevuelto', prestamo);
}

function confirmarBorrado(id) {
  if (window.confirm('¿Seguro que quieres eliminar este préstamo?')) {
    store.dispatch('prestamos/borrar', id);
  }
}

// Paginación
function paginaAnterior() {
  store.dispatch('prestamos/cambiarPagina', 'anterior');
}

function paginaSiguiente() {
  store.dispatch('prestamos/cambiarPagina', 'siguiente');
}

// Chip de estado
function claseChip(estado) {
  return `chip--${estado}`;
}

// Formato de fecha corto (ayudante sugerido en el PDF)
function fechaCorta(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
  });
}
</script>