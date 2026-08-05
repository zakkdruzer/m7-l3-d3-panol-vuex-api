import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './estilos.css'; // Se importa la hoja de estilos sugerida en la actividad

// Se crea la instancia principal de Vue, se le inyectan
// el router y el store de Vuex, y se monta en el DOM.
createApp(App)
  .use(router)
  .use(store)
  .mount('#app');