# El Pañol

Aplicación frontend hecha con Vue 3, Vite, Vuex y Vue Router para gestionar el préstamo de equipos en el pañol de una institución. Permite ver el inventario, registrar nuevos préstamos, marcar entregas y devoluciones, y mostrarle al encargado un panel con cifras agregadas.

## Tecnologías

- Vue 3 con `<script setup>`
- Vite como bundler
- Vuex 4 para manejo de estado global
- Vue Router 4 para navegación entre pantallas
- Axios para consumir la API del backend
- Backend Node incluido en el proyecto para simular la API real

## Backend: requisito para ver el ejercicio

Dentro del proyecto se incluye una carpeta de backend (por ejemplo `node-backend-node`) que expone la API que consume el frontend.  
Es **obligatorio** tener este servidor levantado para que la aplicación funcione correctamente.

### Cómo instalar y levantar el backend

1. Abrir una terminal en la carpeta del backend:

   ```bash
   cd node-backend-node
   ```

2. Instalar las dependencias del backend:

   ```bash
   npm install
   ```

3. Levantar el servidor:

   ```bash
   npm run dev
   ```

4. El servidor quedará escuchando en `http://localhost:3001/api/libre` y la aplicación frontend usará ese endpoint para:
   - Obtener el inventario de equipos.
   - Consultar la planilla de préstamos con filtros y paginación.
   - Crear, editar, entregar, devolver y eliminar préstamos.
   - Obtener el resumen para el panel del pañol.

Mientras estés desarrollando o probando El Pañol, deja esta terminal abierta con el backend corriendo.

## Puesta en marcha del frontend

En otra terminal, en la carpeta raíz del proyecto:

```bash
npm install
npm run dev
```

Con el backend activo y el servidor de Vite levantado, podrás entrar a la app desde el navegador y usar todas las pantallas.

## Funcionalidades principales

### 1. Panel del pañol

Pantalla pensada para el encargado.

- Muestra cuatro cifras grandes:
  - Total de préstamos registrados.
  - Unidades fuera del pañol.
  - Préstamos atrasados (en rojo si hay al menos uno).
  - Valor en circulación formateado como pesos chilenos.
- Incluye dos bloques de detalle:
  - Uso del inventario por equipo, con barras de porcentaje.
  - Préstamos vivos por categoría.
- Usa un módulo Vuex separado (`resumen`) que consulta sólo el endpoint de resumen.
- Implementa caché simple de 30 segundos y un botón “Actualizar” que fuerza la recarga.

### 2. Inventario de equipos

Pantalla de catálogo de equipos.

- Tarjetas con:
  - Nombre del equipo.
  - Marca y categoría.
  - Unidades disponibles de un total.
  - Precio por unidad.
- Los equipos en mantención se muestran apagados y con una etiqueta.
- El inventario se carga una vez y se reutiliza en:
  - Inventario.
  - Selector de equipo del formulario.
  - Filtros de la planilla.
- Módulo Vuex `equipos`:
  - Guarda lista, estado de carga y error.
  - Usa Axios sólo dentro de las actions.
  - Maneja estados de cargando, error y vacío en la vista.

### 3. Planilla de préstamos

Pantalla principal del mesón.

- Tabla paginada con:
  - Código de préstamo.
  - Solicitante y área.
  - Equipo y categoría.
  - Cantidad.
  - Fecha de devolución y días de atraso.
  - Estado (pendiente, entregado, devuelto).
- Filtros:
  - Texto libre (solicitante, área, código).
  - Estado.
  - Equipo.
  - Sólo atrasados / sólo al día.
- Acciones por fila:
  - Entregar (PATCH estado entregado).
  - Devolver (PATCH estado devuelto).
  - Editar.
  - Eliminar con confirmación.
- Detalles de implementación:
  - Los filtros viven en el state del módulo `prestamos`, no en refs locales.
  - Cambiar cualquier filtro vuelve a la página 1.
  - Los filtros vacíos no se envían como parámetros.
  - Entregar o devolver no recarga toda la lista: se reemplaza sólo la fila que devuelve el servidor.
  - Hay un indicador de fila ocupada que deshabilita sólo esa fila y se limpia en `finally`.

### 4. Formulario de préstamo

Formulario compartido para crear y editar.

- Campos:
  - Equipo (select).
  - Cantidad.
  - Quién retira.
  - Área o asignatura.
  - Fecha de retiro.
  - Fecha de devolución.
  - Observación (opcional).
- Estado en Vuex:
  - El formulario vive en el módulo `formularioPrestamo`.
  - Se usa una función para generar el formulario en blanco y evitar arrastrar datos anteriores.
  - No se usa `v-model` directo contra el store: cada cambio dispara una mutation vía action.
- Manejo de errores:
  - 422 (validación por campo):
    - Se guarda en `erroresCampos`.
    - El input culpable recibe la clase `.malo`.
    - El mensaje aparece debajo con `.malo-txt`.
    - Corregir un campo borra sólo su mensaje.
  - 409 (conflicto de stock):
    - Se guarda en `conflictoStock`.
    - Se muestra en una caja `.conflicto` arriba del formulario.
    - Incluye las cifras de stock, comprometidas y disponibles.
- Flujo de guardado:
  - En modo “crear” usa POST.
  - En modo “editar” usa PUT.
  - Al guardar bien:
    - Limpia el formulario.
    - Recarga la planilla.
    - Dispara un aviso verde de éxito en la vista de Préstamos.
  - Al guardar mal no navega: el usuario ve el problema y corrige.

### 5. Aviso de éxito

Extra de experiencia de usuario.

- Al crear o editar un préstamo exitosamente:
  - El módulo `formularioPrestamo` llama a `prestamos/mostrarAvisoExito`.
  - El módulo `prestamos` guarda el mensaje en `avisoExito`.
- La vista de Préstamos:
  - Muestra una franja verde arriba de los filtros cuando `avisoExito` tiene contenido.
  - `mostrarAvisoExito` limpia el mensaje automáticamente a los 4 segundos.

## Estructura de rutas

El router define las siguientes rutas con nombres:

- `/` → `panel`  
- `/prestamos` → `prestamos`  
- `/inventario` → `inventario`  
- `/prestamos/nuevo` → `prestamo-nuevo`  
- `/prestamos/:id` → `prestamo-editar`  

Existe una ruta comodín que redirige cualquier ruta desconocida al panel.

Para despliegue en hosting estático se usa `createWebHashHistory` con `import.meta.env.BASE_URL`.

## Estado global

El store se organiza en módulos:

- `equipos`:
  - Lista de equipos.
  - Estados de carga y error.
  - Getters para índices y recuentos.
- `prestamos`:
  - Lista paginada de préstamos.
  - Meta de paginación.
  - Filtros.
  - Estado de carga, error, fila ocupada y aviso de éxito.
- `formularioPrestamo`:
  - Modelo del formulario.
  - Errores por campo.
  - Conflicto de stock.
  - Indicador de guardando y modo (crear/editar).
- `resumen`:
  - Datos agregados para el panel.
  - Estado de carga, error y último fetch.

## Estilos

La app usa una hoja de estilos global que:

- Define layout general (barra superior y contenedor de contenido).
- Estiliza tarjetas, tablas, filtros, chips de estado y el formulario.
- Incluye clases específicas para:
  - Estados de filas (`.ocupada`, `.atrasada`).
  - Errores de campo (clases `.malo` y `.malo-txt`).
  - Caja de conflicto de stock (`.conflicto`).
  - Cifras del panel (`.cifra`, `.cifra--bien`, `.cifra--aviso`, `.cifra--malo`).
  - Barras de uso (`.riel`, `.riel--lleno`).

## Scripts habituales

En la carpeta raíz del proyecto:

- `npm run dev`  
  Inicia el servidor de desarrollo del frontend (requiere backend activo).

- `npm run build`  
  Compila la aplicación frontend a producción en la carpeta de salida.

- `npm run preview`  
  Levanta un servidor de vista previa sobre la carpeta compilada.

- `npm run deploy`  
  Construye y publica la carpeta compilada en el entorno de hosting estático configurado.

En la carpeta del backend (`node-backend-node`):

- `npm run dev`  
  Levanta el servidor de la API del pañol en `localhost:3001`.

Ambos servidores deben estar activos para poder usar la aplicación completa.

---

## Para ver el resultado debes lanzar el backend específico, pero también puedes ver el resultado parcial en:

https://zakkdruzer.github.io/m7-l3-d3-panol-vuex-api
