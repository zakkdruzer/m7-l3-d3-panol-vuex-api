<!-- src/App.vue -->
<template>
  <div>
    <header class="barra">
      <h1>El Pañol</h1>
      <nav class="menu">
        <!-- Usar :to con objeto y name -->
        <RouterLink :to="{ name: 'panel' }">Panel</RouterLink>
        <RouterLink :to="{ name: 'prestamos' }">Préstamos</RouterLink>
        <RouterLink :to="{ name: 'inventario' }">Inventario</RouterLink>
        <RouterLink :to="{ name: 'prestamo-nuevo' }" class="btn">
          Registrar préstamo
        </RouterLink>
      </nav>
    </header>

    <main class="contenido">
      <RouterView />
    </main>
  </div>
</template>