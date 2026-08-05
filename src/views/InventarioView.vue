<!-- src/views/InventarioView.vue -->
<template>
  <section>
    <div class="cabecera">
      <h2>Inventario de equipos</h2>
      <p class="sub">Usa los filtros para ver qué está disponible.</p>
    </div>

    <!-- Estado de carga -->
    <div v-if="cargando" class="aviso">Cargando inventario...</div>

    <!-- Error de carga -->
    <div v-else-if="error" class="aviso aviso--error">
      {{ error }}
    </div>

    <!-- Lista de equipos -->
    <div v-else class="grilla">
      <article v-for="equipo in equipos" :key="equipo.id" class="tarjeta">
        <h3>{{ equipo.nombre }}</h3>
        <p class="sub">
          {{ equipo.marca }} · {{ equipo.categoria }}
        </p>
        <p>
          Stock total: {{ equipo.stockTotal }}<br />
          Comprometidas: {{ equipo.comprometidas }}<br />
          Disponibles: <strong>{{ equipo.disponibles }}</strong>
        </p>
      </article>
    </div>
  </section>
</template>

<script setup>
// Se importa la función de ayuda de Vuex
import { useStore } from 'vuex';
import { computed, onMounted } from 'vue';

// Se obtiene la instancia del store
const store = useStore();

// Se crean propiedades reactivas que leen del módulo "equipos"
const equipos = computed(() => store.getters['equipos/equipos']);
const cargando = computed(() => store.getters['equipos/inventarioCargando']);
const error = computed(() => store.getters['equipos/inventarioError']);

// Al montar la vista, se dispara la acción para cargar el inventario.
onMounted(() => {
  store.dispatch('equipos/cargar');
  store.dispatch('equipos/cargarCategorias');
});
</script>