<template>
  <section>
    <header class="cabecera">
      <h2>Panel del pañol</h2>
      <button class="btn" @click="actualizar">
        Actualizar
      </button>
    </header>

    <!-- Estado: cargando -->
    <div v-if="cargando" class="aviso">
      Cargando resumen...
    </div>

    <!-- Estado: error -->
    <div v-else-if="error" class="aviso aviso--error">
      {{ error }}
    </div>

    <!-- Estado: sin datos todavía -->
    <div v-else-if="!resumen" class="aviso">
      No hay datos de resumen disponibles.
    </div>

    <!-- Datos -->
    <div v-else>
      <!-- Cuatro cifras grandes -->
      <div class="cifras">
        <article
          v-for="cifra in cifras"
          :key="cifra.rotulo"
          class="cifra"
          :class="claseCifra(cifra.tipo)"
        >
          <span class="valor">
            {{ cifraEsMoneda(cifra.rotulo) ? formatoMoneda(cifra.valor) : cifra.valor }}
          </span>
          <span class="rotulo">{{ cifra.rotulo }}</span>
        </article>
      </div>

      <div class="grilla" style="grid-template-columns:1fr 1fr;">
        <!-- Bloque A: uso del inventario por equipo -->
        <article class="tarjeta">
          <h3>Uso del inventario</h3>
          <p class="sub">
            El más pedido es
            <strong>{{ resumen.equipoMasPedido?.nombre }}</strong>.
          </p>

          <div
            v-for="item in usoPorEquipo"
            :key="item.equipoId"
            style="margin-bottom:.7rem;"
          >
            <p class="sub" style="display:flex;justify-content:space-between;margin:0;">
              <span>{{ item.nombre }}</span>
              <strong>{{ item.comprometidas }} / {{ item.stockTotal }}</strong>
            </p>
            <span
              class="riel"
              :class="{ 'riel--lleno': item.usoPorcentaje === 100 }"
            >
              <i :style="{ width: `${item.usoPorcentaje}%` }"></i>
            </span>
          </div>
        </article>

        <!-- Bloque B: préstamos vivos por categoría -->
        <article class="tarjeta">
          <h3>Préstamos vivos por categoría</h3>
          <table>
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Préstamos</th>
              </tr>
            </thead>
            <tbody>
              <!-- porCategoria es un objeto; la directiva recorre clave/valor -->
              <tr
                v-for="(cantidad, categoria) in prestamosPorCategoria"
                :key="categoria"
              >
                <td>{{ etiquetaCategoria(categoria) }}</td>
                <td>{{ cantidad }}</td>
              </tr>
            </tbody>
          </table>

          <p class="sub" style="margin-top:1rem;">
            Valor en circulación
            <strong>{{ formatoMoneda(resumen.valorEnCirculacion) }}</strong>
          </p>
        </article>
      </div>

      <p class="sub" style="text-align:center;margin-top:1rem;">
        Cifras del servidor sobre los {{ resumen.total }} préstamos del pañol,
        no sobre la página que estás viendo en la planilla.
      </p>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

const resumen = computed(() => store.getters['resumen/resumen']);
const cargando = computed(() => store.getters['resumen/resumenCargando']);
const error = computed(() => store.getters['resumen/resumenError']);
const cifras = computed(() => store.getters['resumen/cifras']);
const usoPorEquipo = computed(() => store.getters['resumen/usoPorEquipo']);
const prestamosPorCategoria = computed(() => store.getters['resumen/prestamosPorCategoria']);

onMounted(() => {
  store.dispatch('resumen/cargar');
});

function actualizar() {
  store.dispatch('resumen/cargar', { forzar: true });
}

function claseCifra(tipo) {
  if (tipo === 'bien') return 'cifra--bien';
  if (tipo === 'malo') return 'cifra--malo';
  if (tipo === 'aviso') return 'cifra--aviso';
  return '';
}

function cifraEsMoneda(rotulo) {
  return rotulo === 'En circulación';
}

function formatoMoneda(valor) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(valor);
}

function etiquetaCategoria(codigo) {
  const etiquetas = {
    computacion: 'Computación',
    audiovisual: 'Audiovisual',
    redes: 'Redes',
    medicion: 'Medición',
    mobiliario: 'Mobiliario',
  };
  return etiquetas[codigo] || codigo;
}
</script>