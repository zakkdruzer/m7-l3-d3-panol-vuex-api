<template>
  <section>
    <div class="cabecera">
      <h2>Panel del encargado</h2>
      <p class="sub">
        Cifras del servidor sobre los préstamos, no sólo sobre la página actual.
      </p>
    </div>

    <div v-if="cargando" class="aviso">Cargando resumen...</div>

    <div v-else-if="error" class="aviso aviso--error">
      {{ error }}
    </div>

    <div v-else-if="!resumen" class="aviso">
      No hay datos de resumen disponibles.
    </div>

    <div v-else class="grilla">
      <!-- Ejemplo de cuatro tarjetas con diferentes modificadores -->
      <article class="tarjeta cifra">
        <h3>Total de préstamos</h3>
        <p>{{ resumen.total }}</p>
      </article>

      <article class="tarjeta cifra cifra--bien">
        <h3>Unidades fuera</h3>
        <p>{{ resumen.unidadesFuera }}</p>
      </article>

      <article
        class="tarjeta cifra"
        :class="resumen.atrasados > 0 ? 'cifra--malo' : 'cifra--aviso'"
      >
        <h3>Préstamos atrasados</h3>
        <p>{{ resumen.atrasados }}</p>
      </article>

      <article class="tarjeta cifra">
        <h3>Valor en circulación</h3>
        <p>{{ formatoMoneda(resumen.valorEnCirculacion) }}</p>
      </article>

      <!-- Aquí se podrían agregar barras de uso y tabla por categoría,
           usando porEstado, porEquipo (con usoPorcentaje), porCategoria, etc. -->
    </div>
  </section>
</template>

<script setup>
import { useStore } from 'vuex';
import { onMounted, computed } from 'vue';

const store = useStore();

const resumen = computed(() => store.getters['resumen/resumen']);
const cargando = computed(() => store.getters['resumen/resumenCargando']);
const error = computed(() => store.getters['resumen/resumenError']);

onMounted(() => {
  store.dispatch('resumen/cargar');
});

// Da formato de moneda a los montos numéricos usando Intl.NumberFormat.
function formatoMoneda(valor) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(valor);
}
</script>