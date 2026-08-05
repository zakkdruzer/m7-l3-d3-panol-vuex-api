<template>
    <section>
        <header class="cabecera">
            <div>
                <h2>Inventario</h2>
                <p class="sub">
                    {{ resumenInventario }}
                </p>
            </div>
            <div>
                <button class="btn" @click="recargar">
                    Recargar
                </button>
            </div>
        </header>

        <!-- Estado: cargando -->
        <div v-if="cargando" class="aviso">
            Consultando el inventario...
        </div>

        <!-- Estado: error -->
        <div v-else-if="error" class="aviso aviso--error">
            <p>{{ error }}</p>
            <button class="btn btn--fino" @click="reintentar">
                Reintentar
            </button>
        </div>

        <!-- Estado: vacío (sin equipos) -->
        <div v-else-if="equipos.length === 0" class="aviso">
            No hay equipos registrados.
        </div>

        <!-- Estado: con datos -->
        <div v-else class="grilla">
            <article v-for="equipo in equipos" :key="equipo.id" class="tarjeta"
                :style="equipo.operativo ? undefined : { opacity: 0.6 }">
                <h3>{{ equipo.nombre }}</h3>
                <p class="sub">
                    {{ equipo.marca }} · {{ etiquetaCategoria(equipo.categoria) }}
                </p>

                <div style="margin-top:.75rem;">
                    <p class="sub" style="margin:0 0 .35rem;">
                        <strong>{{ equipo.disponibles }}</strong>
                        de {{ equipo.stockTotal }} disponibles
                    </p>
                    <span class="riel" :class="{ 'riel--lleno': porcentajeOcupado(equipo) === 100 }">
                        <i :style="{ width: `${porcentajeOcupado(equipo)}%` }"></i>
                    </span>
                </div>

                <p class="sub" style="margin-top:.75rem;">
                    {{ formatoMoneda(equipo.valorUnitario) }} por unidad
                </p>

                <!-- Etiqueta de equipo en mantención cuando no es operativo -->
                <p v-if="!equipo.operativo" style="margin:.5rem 0 0;">
                    <span class="chip chip--atraso">En mantención</span>
                </p>
            </article>
        </div>
    </section>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// Leer del módulo equipos
const equipos = computed(() => store.getters['equipos/equipos']);
const cargando = computed(() => store.getters['equipos/inventarioCargando']);
const error = computed(() => store.getters['equipos/inventarioError']);

// Texto de resumen (ejemplo: "8 equipos, 6 con unidades disponibles")
const resumenInventario = computed(() => {
    const total = equipos.value.length;
    const conUnidades = equipos.value.filter((e) => e.disponibles > 0).length;
    return `${total} equipos, ${conUnidades} con unidades disponibles`;
});

// Cargar catálogo y categorías al montar.
// No se volverá a pedir el catálogo si ya existe en el store.
onMounted(() => {
    store.dispatch('equipos/cargar');
    store.dispatch('equipos/cargarCategorias');
});

// Forzar recarga desde el botón "Recargar".
function recargar() {
    store.dispatch('equipos/cargar', { forzar: true });
}

// Reintentar en caso de error (también fuerza).
function reintentar() {
    store.dispatch('equipos/cargar', { forzar: true });
}

// Formateo de moneda chilena.
function formatoMoneda(valor) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0,
    }).format(valor);
}

// Nombres legibles de categorías, usando el mapa sugerido en el PDF.
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

// Porcentaje de unidades ocupadas: comprometidas / stockTotal * 100.
// La barra se pinta con ese ancho y se marca riel--lleno cuando llega al 100%.
function porcentajeOcupado(equipo) {
    if (!equipo.stockTotal) return 0;
    const porcentaje = (equipo.comprometidas / equipo.stockTotal) * 100;
    return Math.round(porcentaje);
}
</script>