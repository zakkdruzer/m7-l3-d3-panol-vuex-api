<template>
  <section>
    <div class="cabecera">
      <h2>Nuevo préstamo</h2>
      <p class="sub">Completa los campos y envía. El servidor valida la capacidad.</p>
    </div>

    <!-- Mensaje de éxito -->
    <div v-if="exito" class="aviso">
      {{ exito }}
    </div>

    <!-- Conflicto de stock (409) con mensaje destacado -->
    <div v-if="conflictoStock" class="aviso aviso--error">
      <p>{{ conflictoStock.message }}</p>
      <p>
        Equipo: {{ conflictoStock.stock.equipo }}<br />
        Solicitadas: {{ conflictoStock.stock.solicitadas }}<br />
        Disponibles: {{ conflictoStock.stock.disponibles }}<br />
        Comprometidas: {{ conflictoStock.stock.comprometidas }}<br />
        Stock total: {{ conflictoStock.stock.stockTotal }}
      </p>
      <!-- Aquí se podría ofrecer un botón para pedir sólo las unidades disponibles -->
    </div>

    <form @submit.prevent="enviar">
      <!-- Cada campo se enlaza al store con v-model y actualiza vía mutation -->
      <div>
        <label>Equipo</label>
        <input
          type="number"
          v-model="modelo.equipoId"
        />
        <p v-if="erroresCampos.equipoId" class="sub aviso--error">
          {{ erroresCampos.equipoId }}
        </p>
      </div>

      <div>
        <label>Solicitante</label>
        <input
          type="text"
          v-model="modelo.solicitante"
        />
        <p v-if="erroresCampos.solicitante" class="sub aviso--error">
          {{ erroresCampos.solicitante }}
        </p>
      </div>

      <div>
        <label>Área</label>
        <input
          type="text"
          v-model="modelo.area"
        />
        <p v-if="erroresCampos.area" class="sub aviso--error">
          {{ erroresCampos.area }}
        </p>
      </div>

      <div>
        <label>Cantidad</label>
        <input
          type="number"
          v-model.number="modelo.cantidad"
          min="1"
        />
        <p v-if="erroresCampos.cantidad" class="sub aviso--error">
          {{ erroresCampos.cantidad }}
        </p>
      </div>

      <div>
        <label>Fecha de retiro</label>
        <input
          type="date"
          v-model="modelo.fechaRetiro"
        />
        <p v-if="erroresCampos.fechaRetiro" class="sub aviso--error">
          {{ erroresCampos.fechaRetiro }}
        </p>
      </div>

      <div>
        <label>Fecha de devolución</label>
        <input
          type="date"
          v-model="modelo.fechaDevolucion"
        />
        <p v-if="erroresCampos.fechaDevolucion" class="sub aviso--error">
          {{ erroresCampos.fechaDevolucion }}
        </p>
      </div>

      <div>
        <label>Observación (opcional)</label>
        <textarea v-model="modelo.observacion"></textarea>
        <p v-if="erroresCampos.observacion" class="sub aviso--error">
          {{ erroresCampos.observacion }}
        </p>
      </div>

      <button class="btn" type="submit" :disabled="enviando">
        {{ enviando ? 'Enviando...' : 'Registrar préstamo' }}
      </button>
    </form>
  </section>
</template>

<script setup>
import { useStore } from 'vuex';
import { computed } from 'vue';

const store = useStore();

// Se obtiene el modelo del formulario desde el módulo de Vuex
const modelo = computed(() => store.getters['formularioPrestamo/modelo']);
const erroresCampos = computed(() => store.getters['formularioPrestamo/erroresCampos']);
const conflictoStock = computed(() => store.getters['formularioPrestamo/conflictoStock']);
const exito = computed(() => store.getters['formularioPrestamo/exito']);
const enviando = computed(() => store.getters['formularioPrestamo/enviando']);

// Se envía el formulario delegando en la action del módulo.
function enviar() {
  store.dispatch('formularioPrestamo/enviar');
}
</script>