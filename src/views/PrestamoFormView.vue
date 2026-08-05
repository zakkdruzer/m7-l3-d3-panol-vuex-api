<template>
  <section class="tarjeta" style="max-width:640px;margin:0 auto;">
    <h2>
      {{ modo === 'crear' ? 'Registrar préstamo' : 'Editar préstamo' }}
    </h2>

    <!-- Caja del 409: conflicto de stock, arriba del formulario -->
    <div v-if="conflictoStock" class="conflicto">
      <strong>No alcanzan las unidades</strong>
      <p>{{ conflictoStock.message }}</p>
      <p>
        De {{ conflictoStock.stock.stockTotal }} unidades de
        <strong>{{ conflictoStock.stock.equipo }}</strong>,
        hay {{ conflictoStock.stock.comprometidas }} fuera y
        {{ conflictoStock.stock.disponibles }} disponibles.
      </p>
    </div>

    <form class="form" @submit.prevent="onSubmit">
      <div class="fila">
        <!-- Equipo -->
        <label>
          <span>Equipo</span>
          <select
            :class="claseCampo('equipoId')"
            :value="modelo.equipoId"
            @change="onCampo('equipoId', $event.target.value)"
          >
            <option value="">Elige un equipo</option>
            <option
              v-for="equipo in equipos"
              :key="equipo.id"
              :value="equipo.id"
            >
              {{ equipo.nombre }} quedan {{ equipo.disponibles }}
            </option>
          </select>
          <small
            v-if="errores.equipoId"
            class="malo-txt"
          >
            {{ errores.equipoId }}
          </small>
        </label>

        <!-- Cantidad -->
        <label>
          <span>Cantidad</span>
          <input
            type="number"
            min="1"
            max="20"
            :class="claseCampo('cantidad')"
            :value="modelo.cantidad"
            @input="onCampo('cantidad', $event.target.valueAsNumber || 0)"
          />
          <small
            v-if="errores.cantidad"
            class="malo-txt"
          >
            {{ errores.cantidad }}
          </small>
        </label>
      </div>

      <!-- Solicitante -->
      <label>
        <span>Quién retira</span>
        <input
          type="text"
          placeholder="Nombre de la persona o del curso"
          :class="claseCampo('solicitante')"
          :value="modelo.solicitante"
          @input="onCampo('solicitante', $event.target.value)"
        />
        <small
          v-if="errores.solicitante"
          class="malo-txt"
        >
          {{ errores.solicitante }}
        </small>
      </label>

      <!-- Área -->
      <label>
        <span>Área o asignatura</span>
        <input
          type="text"
          placeholder="Taller de Redes, Certificación G7"
          :class="claseCampo('area')"
          :value="modelo.area"
          @input="onCampo('area', $event.target.value)"
        />
        <small
          v-if="errores.area"
          class="malo-txt"
        >
          {{ errores.area }}
        </small>
      </label>

      <div class="fila">
        <!-- Fecha retiro -->
        <label>
          <span>Fecha de retiro</span>
          <input
            type="date"
            :class="claseCampo('fechaRetiro')"
            :value="modelo.fechaRetiro"
            @input="onCampo('fechaRetiro', $event.target.value)"
          />
          <small
            v-if="errores.fechaRetiro"
            class="malo-txt"
          >
            {{ errores.fechaRetiro }}
          </small>
        </label>

        <!-- Fecha devolución -->
        <label>
          <span>Fecha de devolución</span>
          <input
            type="date"
            :class="claseCampo('fechaDevolucion')"
            :value="modelo.fechaDevolucion"
            @input="onCampo('fechaDevolucion', $event.target.value)"
          />
          <small
            v-if="errores.fechaDevolucion"
            class="malo-txt"
          >
            {{ errores.fechaDevolucion }}
          </small>
        </label>
      </div>

      <!-- Observación -->
      <label>
        <span>
          Observación
          <em style="font-weight:400;color:#94a3b8;">(opcional)</em>
        </span>
        <textarea
          rows="2"
          maxlength="200"
          :value="modelo.observacion"
          @input="onCampo('observacion', $event.target.value)"
        ></textarea>
      </label>

      <footer class="cabecera" style="margin:0;justify-content:flex-end;gap:.6rem;">
        <RouterLink
          :to="{ name: 'prestamos' }"
          class="btn btn--gris"
        >
          Cancelar
        </RouterLink>
        <button
          type="submit"
          class="btn"
          :disabled="enviando"
        >
          {{ enviando ? 'Guardando...' : 'Registrar' }}
        </button>
      </footer>
    </form>
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

const store = useStore();
const route = useRoute();
const router = useRouter();

const modelo = computed(() => store.getters['formularioPrestamo/modelo']);
const errores = computed(() => store.getters['formularioPrestamo/erroresCampos']);
const conflictoStock = computed(() => store.getters['formularioPrestamo/conflictoStock']);
const enviando = computed(() => store.getters['formularioPrestamo/enviando']);
const modo = computed(() => store.getters['formularioPrestamo/modo']);
const equipos = computed(() => store.getters['equipos/equipos']);

onMounted(() => {
  // determinar si es nuevo o edición según la ruta
  if (route.params.id) {
    store.dispatch('formularioPrestamo/prepararEdicion', route.params.id);
  } else {
    store.dispatch('formularioPrestamo/prepararNuevo');
  }
  // aseguramos tener el catálogo de equipos para el select
  store.dispatch('equipos/cargar');
});

function onCampo(campo, valor) {
  store.dispatch('formularioPrestamo/actualizarCampo', { campo, valor });
}

function claseCampo(campo) {
  return errores.value[campo] ? 'malo' : '';
}

async function onSubmit() {
  const resultado = await store.dispatch('formularioPrestamo/guardar');
  if (resultado.ok) {
    // sólo navegar si guardó bien
    router.push({ name: 'prestamos' });
  }
}
</script>