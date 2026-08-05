<template>
  <section>
    <div class="cabecera">
      <h2>Planilla de préstamos</h2>
      <button class="btn" @click="irANuevo">Nuevo préstamo</button>
    </div>

    <div v-if="cargando" class="aviso">Cargando préstamos...</div>

    <div v-else-if="error" class="aviso aviso--error">
      {{ error }}
    </div>

    <div v-else-if="prestamos.length === 0" class="aviso">
      No hay préstamos para los filtros actuales.
    </div>

    <div v-else class="tabla-caja">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Equipo</th>
            <th>Solicitante</th>
            <th>Área</th>
            <th>Estado</th>
            <th>Fechas</th>
            <th>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="prestamo in prestamos"
            :key="prestamo.id"
            :class="{ atrasada: prestamo.atrasado }"
          >
            <td class="mono">{{ prestamo.codigo }}</td>
            <td>
              {{ prestamo.equipoNombre }}
              <small>{{ prestamo.equipoCategoria }}</small>
            </td>
            <td>{{ prestamo.solicitante }}</td>
            <td>{{ prestamo.area }}</td>
            <td>
              <span class="chip" :class="`chip--${prestamo.estado}`">
                {{ prestamo.estado }}
              </span>
            </td>
            <td>
              Retiro: {{ prestamo.fechaRetiro }}<br />
              Devolución: {{ prestamo.fechaDevolucion }}
            </td>
            <td>{{ prestamo.cantidad }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { computed, onMounted } from 'vue';

const router = useRouter();
const store = useStore();

const prestamos = computed(() => store.getters['prestamos/prestamos']);
const cargando = computed(() => store.getters['prestamos/prestamosCargando']);
const error = computed(() => store.getters['prestamos/prestamosError']);

onMounted(() => {
  store.dispatch('prestamos/cargar');
  store.dispatch('prestamos/cargarOpciones');
});

function irANuevo() {
  router.push({ name: 'prestamo-nuevo' });
}
</script>