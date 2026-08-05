# Backend Educativo Node.js + TypeScript

Este es un backend sencillo diseñado para practicar el consumo de APIs RESTful, manejo de tokens JWT y todos los métodos HTTP.

## 🚀 Cómo empezar

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```
   El servidor correrá en `http://localhost:3001`.

## 🔐 Autenticación

Para realizar acciones de escritura (POST, PUT, PATCH, DELETE), necesitas un token.

- **Endpoint**: `POST /api/login`
- **Credenciales**:
  - `username`: `admin`
  - `password`: `admin123`
- **Respuesta**: Recibirás un `token`. Debes enviarlo en todos los demás requests en el header:
  `Authorization: Bearer <TU_TOKEN>`

## 🚀 Postman

Para importar rápidamente en Postman, puedes crear una nueva solicitud con estos detalles o usar la exportación de cURL:

### 1. Login (Obtener Token)
```bash
curl --location 'http://localhost:3001/api/login' \
--header 'Content-Type: application/json' \
--data '{
    "username": "admin",
    "password": "admin123"
}'
```

### 2. Crear Item (Requiere Bearer Token)
```bash
curl --location 'http://localhost:3001/api/items' \
--header 'Authorization: Bearer <COPIA_EL_TOKEN_AQUI>' \
--header 'Content-Type: application/json' \
--data '{
    "name": "Laptop Pro",
    "price": 2500,
    "description": "MacBook Pro M3",
    "category": "Computación"
}'
```

> [!TIP]
> En Postman, puedes ir a **Import** -> **Raw text** y pegar los comandos cURL anteriores para que se generen automáticamente las peticiones con sus headers.

## ⚓ API Endpoints (Recurso: Items)

| Método | Endpoint | Descripción | Protegido |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/items` | Listar todos los items | No |
| **GET** | `/api/items/:id` | Ver un item por ID | No |
| **POST** | `/api/items` | Crear un nuevo item | **Sí** |
| **PUT** | `/api/items/:id` | Reemplazar item completo | **Sí** |
| **PATCH** | `/api/items/:id` | Actualización parcial | **Sí** |
| **DELETE** | `/api/items/:id` | Eliminar un item | **Sí** |

### Ejemplo de Body para POST/PUT:
```json
{
  "name": "Nuevo Producto",
  "price": 1500,
  "description": "Una descripción opcional",
  "category": "Electrónica"
}
```

## 🛠 Tecnologías usadas
- Node.js & TypeScript
- Express
- JSON Web Token (JWT)
- CORS (Habilitado para todos los origenes por defecto)
- dotenv

---

# 🎫 Recursos v2 — Tickets, Notas cifradas y Roles

Estos recursos se agregaron para la **actividad práctica** de la Lección 2.
Los endpoints de `/api/items` siguen intactos para los ejercicios de clase.

## 👥 Usuarios

| Usuario | Contraseña | Rol | Puede eliminar tickets |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | `admin` | Sí |
| `operador` | `operador123` | `operador` | **No (403)** |

### Token de corta duración (para probar la expiración)

`POST /api/login` acepta un campo opcional `duracionMinutos`. Acepta decimales,
así que puedes pedir un token de 30 segundos y ver expirar la sesión en clase
sin esperar una hora:

```bash
curl -X POST http://localhost:3001/api/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123","duracionMinutos":0.5}'
```

## 🔑 Autenticación

| Método | Endpoint | Descripción | Protegido |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/login` | Devuelve `{ token, duracionMinutos, usuario }` | No |
| **GET** | `/api/perfil` | Datos de la sesión y segundos restantes | **Sí** |
| **POST** | `/api/refresh` | Entrega un token nuevo | **Sí** |

> `GET /api/perfil` es una **lectura protegida**: sirve para comprobar que el
> interceptor del cliente adjunta el token también en los GET, no sólo al escribir.

## 🎫 Tickets

| Método | Endpoint | Descripción | Protegido |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/tickets` | Lista con filtros, orden y paginación | No |
| **GET** | `/api/tickets/resumen` | Estadísticas agregadas (**límite: 5 cada 30 s**) | No |
| **GET** | `/api/tickets/:id` | Detalle de un ticket | No |
| **POST** | `/api/tickets` | Crear (valida y responde **422** por campo) | **Sí** |
| **PUT** | `/api/tickets/:id` | **Reemplazo total** (**422** si falta un campo, **409** si está cerrado) | **Sí** |
| **PATCH** | `/api/tickets/:id` | Actualización parcial (**409** si está cerrado) | **Sí** |
| **POST** | `/api/tickets/:id/cerrar` | Cerrar, exige `solucion` | **Sí** |
| **POST** | `/api/tickets/:id/reabrir` | Reabrir (**409** si no estaba cerrado) | **Sí** |
| **PUT** | `/api/tickets/:id/seguro` | Guardar/rotar el dato sensible **ya cifrado en el cliente** | **Sí** |
| **DELETE** | `/api/tickets/:id/seguro` | Olvidar el dato sensible sin tocar el ticket | **Sí** |
| **DELETE** | `/api/tickets/:id` | Eliminar — **sólo rol `admin`** | **Sí** |

### PUT contra PATCH — la diferencia que hay que ver, no memorizar

`PUT /api/tickets/:id` **reemplaza** el recurso completo. Lo que no envíes en el
cuerpo NO se conserva: vuelve a su valor por defecto. Sólo sobreviven `id`,
`codigo` y `creadoEn`, porque eso es identidad del recurso, no contenido.

Para que la lección se vea, la respuesta incluye un campo `aviso` que enumera
qué campos se perdieron por no haberlos reenviado:

```json
{
  "ticket": { "...": "..." },
  "aviso": "PUT reemplazó el recurso completo. Se perdieron estos campos porque no los enviaste: solucion, datoSeguro."
}
```

`PATCH` en cambio sólo toca los campos presentes en el cuerpo. Mismo ticket,
mismos datos, dos verbos, dos resultados distintos.

### 🔒 `datoSeguro` — cifrado en el cliente dentro del flujo de negocio

Un ticket puede llevar un dato sensible del solicitante (RUT, teléfono de
contacto, credencial temporal). Ese dato **se cifra en el navegador** con
Web Crypto antes de salir, y el servidor lo guarda sin poder leerlo jamás.

Cuerpo de `PUT /api/tickets/:id/seguro`:

```json
{
  "etiqueta": "RUT del solicitante",
  "paquete": { "salt": "…Base64…", "iv": "…Base64…", "dato": "…Base64…" }
}
```

- `etiqueta` viaja **en claro a propósito**: es lo único que la interfaz puede
  mostrar sin descifrar. Dice *qué* hay guardado, nunca *cuál* es el valor.
- El servidor valida sólo la **forma** (tres campos, Base64, largo mínimo).
  Si mandas texto plano lo detecta y responde **422**.
- `PUT /api/tickets/:id` **borra** el `datoSeguro`. No es un descuido: es la
  demostración de qué significa "reemplazo total".

### Parámetros de `GET /api/tickets`

`estado`, `prioridad`, `buscar`, `orden` (`recientes` | `antiguos` | `prioridad`),
`pagina`, `porPagina` (máximo 50).

**La respuesta NO es un arreglo pelado:**

```json
{
  "datos": [ /* tickets */ ],
  "meta": { "pagina": 1, "porPagina": 5, "total": 12,
            "totalPaginas": 3, "hayAnterior": false, "haySiguiente": true }
}
```

Además envía la cabecera `X-Total-Registros`, legible desde JavaScript porque
el servidor la expone vía `Access-Control-Expose-Headers`.

## 👤 Personas — CRUD completo con los cinco verbos

Recurso pensado para la **actividad práctica de CRUD**. A propósito **no se
comporta igual que `/api/tickets`**: obliga a leer la respuesta real en vez de
copiar el código de otro recurso.

| Método | Endpoint | Descripción | Protegido |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/personas` | Lista con filtros, orden y paginación | No |
| **GET** | `/api/personas/departamentos` | Valores válidos para el selector | No |
| **GET** | `/api/personas/:id` | Detalle — objeto directo, sin envoltorio | No |
| **POST** | `/api/personas` | Crear — **201** + cabecera `Location` | **Sí** |
| **PUT** | `/api/personas/:id` | **Reemplazo total** (**422** si falta un campo) | **Sí** |
| **PATCH** | `/api/personas/:id` | Actualización parcial (**422** si el cuerpo va vacío) | **Sí** |
| **DELETE** | `/api/personas/:id` | Eliminar — **204 sin cuerpo**, sólo rol `admin` | **Sí** |

### Diferencias deliberadas respecto de `/api/tickets`

| | Tickets | Personas |
| :--- | :--- | :--- |
| Envoltorio del listado | `{ datos, meta }` | **`{ resultados, paginacion }`** |
| Respuesta al crear | 201 con el objeto | 201 + **cabecera `Location`** |
| Respuesta al eliminar | 200 con `message` | **204 sin cuerpo** |
| Duplicados | no aplica | **409**, no 422 |

### Forma de una persona

```json
{
  "id": 1,
  "rut": "15782394-9",
  "nombre": "Camila",
  "apellido": "Rojas Fuentes",
  "email": "camila.rojas@empresa.cl",
  "telefono": "+56912345678",
  "cargo": "Analista de Soporte",
  "departamento": "informatica",
  "activo": true,
  "creadoEn": "2026-03-04T13:20:00.000Z",
  "actualizadoEn": "2026-03-04T13:20:00.000Z"
}
```

### Reglas de validación (responden **422** con detalle por campo)

| Campo | Regla |
| :--- | :--- |
| `rut` | Obligatorio. Se valida con el **algoritmo módulo 11**: el dígito verificador tiene que corresponder. Se acepta con o sin puntos y se guarda normalizado (`15782394-9`) |
| `nombre` | Obligatorio, 2 a 40 caracteres |
| `apellido` | Obligatorio, 2 a 60 caracteres |
| `email` | Obligatorio, formato válido **y** del dominio `@empresa.cl`. Se guarda en minúsculas |
| `telefono` | Opcional. Si viene, formato `+56912345678` |
| `cargo` | Obligatorio, mínimo 3 caracteres |
| `departamento` | Uno de: `administracion`, `operaciones`, `informatica`, `ventas`, `recursos_humanos` |
| `activo` | Booleano de verdad, no la cadena `"true"` |

> [!TIP]
> El RUT `12.345.678-9` que todo el mundo usa de ejemplo **es inválido**. Su
> dígito verificador correcto es `5`. Sirve perfecto para provocar el 422 en clase.

### Conflictos (responden **409**)

- **RUT o correo duplicado** — el dato está bien escrito, pero ya pertenece a otra persona. Por eso es 409 (conflicto de estado) y no 422 (error de formato).
- **Eliminar a alguien todavía activo** — regla de negocio: primero se desactiva con `PATCH { "activo": false }` y después se elimina. Obliga a encadenar dos verbos, como en un sistema real. La respuesta incluye un campo `sugerencia` con la petición exacta que falta.

### Parámetros de `GET /api/personas`

`buscar`, `departamento`, `activo` (`true` | `false`), `orden`
(`apellido` | `nombre` | `antiguedad` | `departamento`), `pagina`,
`porPagina` (máximo 50). También envía la cabecera `X-Total-Registros`.

```json
{
  "resultados": [ /* personas */ ],
  "paginacion": {
    "paginaActual": 1, "porPagina": 6, "totalRegistros": 12,
    "totalPaginas": 2, "hayAnterior": false, "haySiguiente": true
  }
}
```

## 🔐 Notas cifradas (conocimiento cero)

El servidor guarda el paquete cifrado **tal cual llega y nunca puede leerlo**:
la frase de paso jamás sale del navegador. Sólo valida la *forma* del paquete.

| Método | Endpoint | Descripción | Protegido |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/notas` | Lista sólo las notas del usuario autenticado | **Sí** |
| **POST** | `/api/notas` | Recibe `{ titulo, paquete: { salt, iv, dato } }` | **Sí** |
| **DELETE** | `/api/notas/:id` | Sólo el autor puede borrar la suya | **Sí** |

Los tres campos del paquete deben venir en **Base64**. Si mandas texto plano,
el servidor lo detecta y responde **422**.

## 📊 Códigos de estado que devuelve esta API

| Código | Cuándo aparece |
| :--- | :--- |
| **400** | Filtro con un valor no permitido |
| **401** | Falta el token o las credenciales son incorrectas |
| **403** | Token inválido/expirado, **o rol sin permiso** |
| **404** | El recurso no existe |
| **409** | Conflicto de estado (cerrar algo ya cerrado, RUT duplicado, eliminar a alguien activo) |
| **422** | Validación fallida, con detalle **por campo** en `errores` |
| **429** | Demasiadas peticiones, con cabecera `Retry-After` |

Y de los que **sí** son éxito:

| Código | Cuándo aparece |
| :--- | :--- |
| **200** | Lectura o actualización correcta, con cuerpo |
| **201** | Recurso creado. En `/api/personas` incluye la cabecera `Location` |
| **204** | Operación correcta y **sin nada que devolver** — el DELETE de personas |

---

# 🔓 Rutas libres — mismos recursos, sin token (Lección 3 · Vuex)

En la Lección 2 el tema **era** la autenticación. En la Lección 3 el tema es
**Vuex**, y pedir que se resuelva el manejo del estado *y* el del token al mismo
tiempo es cargar dos problemas para enseñar uno.

Por eso los mismos recursos están montados bajo `/api/libre`, **sin exigir
credencial**. Las rutas originales (`/api/tickets`, `/api/personas`,
`/api/items`, `/api/perfil`) **quedaron intactas** y siguen pidiendo su token:
el material de la Lección 2 funciona exactamente igual que antes.

```bash
curl http://localhost:3001/api/libre          # índice de lo disponible
```

## Equivalencias

| Con token (Lección 2) | Sin token (Lección 3) |
| :--- | :--- |
| `/api/tickets` | `/api/libre/tickets` |
| `/api/personas` | `/api/libre/personas` |
| `/api/items` | `/api/libre/items` |
| `/api/canchas` | `/api/libre/canchas` |
| `/api/reservas` | `/api/libre/reservas` |
| `/api/equipos` | `/api/libre/equipos` |
| `/api/prestamos` | `/api/libre/prestamos` |

Todos los verbos y sub-rutas se conservan: `/api/libre/tickets/resumen`,
`/api/libre/tickets/:id/cerrar`, `/api/libre/tickets/:id/reabrir`,
`/api/libre/personas/departamentos`, `/api/libre/reservas/bloques`,
`/api/libre/prestamos/resumen`, etc.

```bash
# Crear un ticket sin ninguna cabecera de autorización
curl -X POST http://localhost:3001/api/libre/tickets \
  -H 'Content-Type: application/json' \
  -d '{"asunto":"Ticket creado sin token alguno",
       "descripcion":"Descripcion larga suficiente para validar",
       "prioridad":"alta",
       "solicitante":"Camila Rojas"}'
```

## Qué se conserva y qué desaparece

Lo único que se quitó es la puerta del token. **Toda la validación de negocio
sigue en pie**, que es justamente lo que le da sentido a las *actions* de Vuex:

| Código | ¿Sigue apareciendo en `/api/libre`? |
| :--- | :--- |
| **400** | Sí — filtro con un valor no permitido |
| **404** | Sí — el recurso no existe |
| **409** | Sí — cerrar algo ya cerrado, RUT duplicado, eliminar a alguien activo, cancha ya tomada a esa hora, stock insuficiente |
| **422** | Sí — validación fallida, con detalle **por campo** en `errores` |
| **429** | Sí — más de 5 llamadas a `/tickets/resumen` en 30 s, con `Retry-After` |
| **401** | **No** — no se pide credencial |
| **403** | **No** — no hay roles que comprobar |

> [!IMPORTANT]
> Los datos son **los mismos**: una sola base en memoria. Si eliminas un ticket
> desde `/api/libre/tickets/:id`, también desaparece de `/api/tickets/:id`.
> Reinicia el servidor para volver a los 12 tickets, 12 personas, 2 items,
> 6 canchas, 14 reservas, 8 equipos y 15 préstamos de origen.

## Cómo está implementado

`src/routes/libre.routes.ts` **no duplica ni una línea de lógica**. Reutiliza
los routers que ya existen y les antepone un middleware que inyecta una
credencial de invitado en el header. Cuando `authenticateJWT` revisa la
petición más adelante, encuentra un token válido y deja pasar.

Ese invitado tiene rol `admin` a propósito: sin eso, `DELETE` seguiría
devolviendo 403 y volveríamos a mezclar el tema de permisos con el de estado.

---

# ⚽ Recinto deportivo — Canchas y Reservas (Lección 3 · módulos de Vuex)

Un par de recursos **relacionados**, agregados para practicar módulos de Vuex,
Vue Router y axios sobre un CRUD sencillo con estadísticas.

Son dos entidades a propósito. Una sola no justifica partir un store en módulos:
se resuelve en un archivo y el alumno se queda pensando que los módulos son un
capricho. Acá **una reserva no existe sin su cancha**, y esa dependencia es la
que obliga a que los dos módulos se comuniquen.

## 🏟 Canchas — catálogo de sólo lectura

No hay `POST`, `PUT` ni `DELETE`: construir o demoler una cancha no es algo que
se haga desde una aplicación web.

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/canchas` | Arreglo directo. Filtros `activa` y `superficie` |
| `GET` | `/api/canchas/:id` | Una cancha |

```jsonc
{
  "id": 1,
  "nombre": "Cancha 1 · Techada",
  "superficie": "pasto_sintetico",   // pasto_sintetico | pasto_natural | cemento
  "jugadores": 7,                    // por lado: 5, 7 u 11
  "valorHora": 32000,
  "techada": true,
  "activa": true
}
```

Vienen **6 canchas**. La número 6 tiene `activa: false` — sirve para provocar el
`422` al intentar reservarla.

## 📅 Reservas — CRUD completo

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/reservas` | `{ datos, meta }` con filtros y paginación |
| `GET` | `/api/reservas/bloques` | Horarios y estados válidos, para los `<select>` |
| `GET` | `/api/reservas/resumen` | Estadísticas del recinto |
| `GET` | `/api/reservas/:id` | Una reserva |
| `POST` | `/api/reservas` | 🔒 `201` + cabecera `Location` |
| `PUT` | `/api/reservas/:id` | 🔒 Reemplazo total |
| `PATCH` | `/api/reservas/:id` | 🔒 Confirmar o cancelar |
| `DELETE` | `/api/reservas/:id` | 🔒 Elimina. **No exige rol admin** |

A diferencia de tickets y personas, el `DELETE` no pide rol `admin`: en la
Lección 3 el tema es el estado en el cliente, no los permisos.

### Forma de una reserva

```jsonc
{
  "id": 1,
  "codigo": "RES-0001",
  "canchaId": 1,
  "cliente": "Los Cracks del Barrio",
  "telefono": "+56912345678",
  "fecha": "2026-08-05",             // AAAA-MM-DD
  "bloque": "20:00",                 // una hora exacta
  "jugadores": 14,
  "estado": "confirmada",            // pendiente | confirmada | cancelada
  "comentario": "Piden pechera de color.",
  "creadoEn": "2026-07-28T18:00:00.000Z",
  "actualizadoEn": "2026-07-29T10:15:00.000Z",
  "canchaNombre": "Cancha 1 · Techada"   // resuelto por el servidor
}
```

> [!TIP]
> `canchaNombre` viene resuelto a propósito. Así la **tabla** puede pintarse sin
> cruzar el módulo de canchas, mientras que el **selector del formulario** sí lo
> necesita. Esa diferencia enseña cuándo un módulo de Vuex debe pedirle datos a
> otro y cuándo no hace falta.

### Bloques horarios

`16:00` · `17:00` · `18:00` · `19:00` · `20:00` · `21:00` · `22:00` · `23:00`

Se sirven por HTTP en `GET /api/reservas/bloques` para que el `<select>` no los
tenga escritos a mano.

### Reglas de validación (responden **422** con detalle por campo)

| Campo | Regla |
| :--- | :--- |
| `canchaId` | Obligatorio. La cancha debe **existir** y estar **activa** |
| `cliente` | Obligatorio, 3 a 60 caracteres |
| `telefono` | Obligatorio, formato `+56912345678` |
| `fecha` | Obligatorio, `AAAA-MM-DD` y **fecha real** — `2026-02-31` se rechaza |
| `bloque` | Uno de los ocho bloques |
| `jugadores` | Entero entre 2 y 22 |
| `comentario` | Opcional, máximo 200 caracteres |

No se valida que la fecha sea futura, a propósito: sería razonable en un sistema
real, pero dejaría este material inservible el día que las fechas de ejemplo
queden en el pasado.

### El conflicto de horario (**409**) — la razón de ser de este recurso

```bash
# Cancha 1, 5 de agosto, 20:00 ya está tomada por RES-0001
curl -X POST http://localhost:3001/api/libre/reservas \
  -H 'Content-Type: application/json' \
  -d '{"canchaId":1,"cliente":"Los Nuevos","telefono":"+56911112222",
       "fecha":"2026-08-05","bloque":"20:00","jugadores":10}'
```

```jsonc
// 409 Conflict
{
  "message": "Cancha 1 · Techada ya está tomada el 2026-08-05 a las 20:00. Elige otro bloque u otra cancha.",
  "conflicto": {
    "codigo": "RES-0001",
    "cliente": "Los Cracks del Barrio",
    "fecha": "2026-08-05",
    "bloque": "20:00",
    "estado": "confirmada"
  }
}
```

> [!IMPORTANT]
> **Los seis campos de esa petición son válidos.** Formato correcto, cancha
> activa, fecha real, teléfono bien escrito. Ninguna validación de navegador
> habría dicho nada — y el servidor la rechaza igual.
>
> Eso depende del estado del servidor en el instante exacto del envío. Es la
> prueba de que la validación de cliente **nunca** reemplaza a la del servidor:
> la del cliente es cortesía, la del servidor es la verdad.
>
> Por eso el `409` no se pinta debajo de un campo: no hay ningún campo culpable.
> Va aparte, con el detalle de quién tiene tomado el bloque.

**Cancelar libera el horario.** Una reserva `cancelada` no compite por su bloque:

```bash
curl -X PATCH http://localhost:3001/api/libre/reservas/1 \
  -H 'Content-Type: application/json' -d '{"estado":"cancelada"}'
# Ahora la Cancha 1 del 5 de agosto a las 20:00 vuelve a estar disponible
```

Otros `409` de este recurso: modificar una reserva cancelada (sólo admite un
cambio de estado).

### Parámetros de `GET /api/reservas`

| Parámetro | Valores | Por defecto |
| :--- | :--- | :--- |
| `estado` | `pendiente` · `confirmada` · `cancelada` | — |
| `canchaId` | Id de una cancha existente | — |
| `fecha` | `AAAA-MM-DD`, fecha real | — |
| `buscar` | Cliente, código, teléfono o nombre de cancha | — |
| `orden` | `fecha` · `cliente` · `recientes` | `fecha` |
| `pagina` | Número ≥ 1 | `1` |
| `porPagina` | 1 a 50 | `6` |

Un valor no permitido en `estado`, `canchaId` o `fecha` responde **400**.
Devuelve además la cabecera `X-Total-Registros`.

### Estadísticas — `GET /api/reservas/resumen`

```jsonc
{
  "total": 14,
  "porEstado": { "pendiente": 4, "confirmada": 8, "cancelada": 2 },
  "porCancha": [
    { "canchaId": 1, "nombre": "Cancha 1 · Techada", "reservas": 3, "ingreso": 96000 }
  ],
  "porBloque": { "16:00": 0, "18:00": 2, "20:00": 4 },
  "bloqueMasPedido": "20:00",
  "ingresoConfirmado": 333000,
  "ocupacion": 6,
  "diasConReservas": 5,
  "generadoEn": "2026-08-04T21:37:04.744Z"
}
```

> [!NOTE]
> Estas cifras las calcula el servidor sobre **todas** las reservas. No las
> confundas con lo que puedes derivar en un *getter* de Vuex: un getter sólo ve
> lo que tienes cargado en el estado, que normalmente es una página de seis
> resultados, no las catorce.
>
> Un getter que cuente `state.lista` y se presente como total del recinto no
> produce un error: produce un número que se ve bien y miente. Eso es peor.
>
> **No le preguntes a la red lo que ya tienes en memoria, y no inventes con tu
> memoria lo que sólo sabe la base de datos.**

### Archivos

| Archivo | Contenido |
| :--- | :--- |
| `src/models/reserva.model.ts` | Tipos, `BLOQUES`, `SUPERFICIES`, `ESTADOS_RESERVA` |
| `src/routes/cancha.routes.ts` | Catálogo de sólo lectura |
| `src/routes/reserva.routes.ts` | CRUD, validación, conflicto de horario y resumen |
| `src/data/store.ts` | Las 6 canchas y las 14 reservas de origen |

---

# 🧰 El Pañol — Equipos y Préstamos (Lección 3 · actividad práctica)

Recurso **gemelo** de canchas/reservas: misma estructura —un catálogo de sólo
lectura del que depende un CRUD— y **reglas de negocio distintas**.

Existe para la actividad que los estudiantes resuelven **después** de la clase
en vivo del recinto. Si las reglas fueran las mismas, se resolvería copiando
código sin entender nada.

| | Recinto (clase en vivo) | Pañol (actividad) |
| :--- | :--- | :--- |
| El `409` es por | Colisión exacta | Capacidad agregada |
| Depende de | Esa cancha, ese día, esa hora | La suma de todo lo que está fuera |
| Es una pregunta de | ¿Está tomado? | ¿Cuántos quedan? |

Un problema de sí-o-no contra un problema de cuántos-quedan. El alumno no puede
transferir el código: tiene que transferir la idea.

## 🧰 Equipos — catálogo de sólo lectura

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/equipos` | Arreglo directo. Filtros `categoria`, `operativo`, `conStock` |
| `GET` | `/api/equipos/categorias` | Valores del selector |
| `GET` | `/api/equipos/:id` | Un equipo |

```jsonc
{
  "id": 1,
  "nombre": "Notebook Lenovo ThinkPad",
  "categoria": "computacion",   // computacion | audiovisual | redes | medicion | mobiliario
  "marca": "Lenovo",
  "stockTotal": 12,             // unidades que EXISTEN
  "valorUnitario": 620000,
  "operativo": true,            // si es false, no se puede prestar

  // Estos dos NO están guardados: se calculan en cada consulta.
  "comprometidas": 9,           // unidades fuera del pañol ahora mismo
  "disponibles": 3              // stockTotal - comprometidas
}
```

> [!IMPORTANT]
> El cálculo de `disponibles` **tiene que vivir en el servidor**. El navegador de
> un usuario no conoce los préstamos que están pidiendo los demás en este mismo
> instante: puede mostrar el número que le dieron, pero no puede garantizar que
> siga siendo cierto medio segundo después.

Vienen **8 equipos**. El número 8 (Osciloscopio) está `operativo: false`, para
provocar el `422`.

## 📋 Préstamos — CRUD completo

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/prestamos` | `{ datos, meta }` con filtros y paginación |
| `GET` | `/api/prestamos/opciones` | Estados y categorías para los `<select>` |
| `GET` | `/api/prestamos/resumen` | Estadísticas del pañol |
| `GET` | `/api/prestamos/:id` | Un préstamo |
| `POST` | `/api/prestamos` | 🔒 `201` + cabecera `Location` |
| `PUT` | `/api/prestamos/:id` | 🔒 Reemplazo total |
| `PATCH` | `/api/prestamos/:id` | 🔒 Entregar o devolver |
| `DELETE` | `/api/prestamos/:id` | 🔒 Elimina. No exige rol admin |

### Forma de un préstamo

```jsonc
{
  "id": 4,
  "codigo": "PR-0004",
  "equipoId": 3,
  "solicitante": "Marcelo Vera",
  "area": "Registro Audiovisual",
  "cantidad": 2,
  "fechaRetiro": "2026-07-20",
  "fechaDevolucion": "2026-07-31",
  "estado": "entregado",             // pendiente | entregado | devuelto
  "observacion": "Cobertura de la ceremonia.",

  // Calculados por el servidor en cada consulta:
  "equipoNombre": "Cámara de video",
  "equipoCategoria": "audiovisual",
  "atrasado": true,                  // entregado Y con la fecha vencida
  "diasAtraso": 4,
  "valorComprometido": 1780000       // valorUnitario x cantidad
}
```

`atrasado` no se guarda: se deduce comparando con el día de hoy según el
servidor. Guardarlo obligaría a tener un proceso que recorra la base todas las
noches cambiando estados.

### Los tres estados y el stock

| Estado | Qué pasó | ¿Ocupa unidades? |
| :--- | :--- | :--- |
| `pendiente` | Reservado, todavía no lo retiran | **Sí** |
| `entregado` | Está en manos del solicitante | **Sí** |
| `devuelto` | Volvió al pañol | **No** — libera stock |

### Reglas de validación (responden **422** con detalle por campo)

| Campo | Regla |
| :--- | :--- |
| `equipoId` | Obligatorio. Debe existir **y estar operativo** |
| `solicitante` | Obligatorio, 3 a 60 caracteres |
| `area` | Obligatorio, mínimo 3 caracteres |
| `cantidad` | Entero entre 1 y 20 |
| `fechaRetiro` | Obligatorio, `AAAA-MM-DD` y fecha real |
| `fechaDevolucion` | Obligatorio, y **nunca anterior al retiro** |
| `observacion` | Opcional, máximo 200 caracteres |

La regla de las fechas cruza **dos campos**, y sólo se evalúa si las dos son
válidas por separado: no tiene sentido decir "la devolución es anterior al
retiro" cuando el retiro ni siquiera es una fecha.

El equipo en mantención devuelve **422 y no 409**, a propósito: el arreglo es
elegir otra opción del selector, así que el mensaje va debajo del `<select>`.

### El conflicto por stock (**409**)

```bash
# Hay 3 cámaras y las 3 están fuera
curl -X POST http://localhost:3001/api/libre/prestamos \
  -H 'Content-Type: application/json' \
  -d '{"equipoId":3,"solicitante":"Curso de Cine","area":"Audiovisual",
       "cantidad":1,"fechaRetiro":"2026-08-10","fechaDevolucion":"2026-08-15"}'
```

```jsonc
// 409 Conflict
{
  "message": "No hay unidades suficientes de Cámara de video. Pediste 1 y no queda ninguna.",
  "stock": {
    "equipo": "Cámara de video",
    "solicitadas": 1,
    "disponibles": 0,
    "comprometidas": 3,
    "stockTotal": 3
  }
}
```

> [!TIP]
> El servidor no sólo dice que no: **dice cuántas hay**. Con esos números la
> interfaz puede ofrecer algo útil ("quedan 3, ¿las pides?") en vez de un error
> seco.

**Devolver libera el stock:**

```bash
curl -X PATCH http://localhost:3001/api/libre/prestamos/4 \
  -H 'Content-Type: application/json' -d '{"estado":"devuelto"}'
# Ahora sí hay cámaras disponibles
```

Un préstamo `devuelto` está **cerrado** y no admite ningún cambio — ni siquiera
reabrirse. Es una diferencia deliberada con las reservas, donde cancelar sí se
puede deshacer. Si el equipo vuelve a salir, es un préstamo nuevo.

Al editar, el cálculo de stock **excluye al propio préstamo**. Sin eso, subir de
2 a 3 unidades compararía contra un stock que ya descuenta las 2 que ese mismo
préstamo tiene tomadas, y nunca alcanzaría.

### Parámetros de `GET /api/prestamos`

| Parámetro | Valores | Por defecto |
| :--- | :--- | :--- |
| `estado` | `pendiente` · `entregado` · `devuelto` | — |
| `equipoId` | Id de un equipo existente | — |
| `categoria` | Una de las cinco categorías | — |
| `atrasados` | `true` · `false` | — |
| `buscar` | Solicitante, área, código o equipo | — |
| `orden` | `recientes` · `solicitante` · `devolucion` · `cantidad` | `recientes` |
| `pagina` · `porPagina` | Números. `porPagina` máximo 50 | `1` · `6` |

### Estadísticas — `GET /api/prestamos/resumen`

Trae `total`, `porEstado`, `porEquipo` (con `usoPorcentaje`), `porCategoria`,
`unidadesFuera`, `atrasados`, `valorEnCirculacion` y `equipoMasPedido`.

### Datos precargados

**15 préstamos** sobre 8 equipos. Dos detalles preparados a propósito:

- Las **3 cámaras** están todas fuera → cualquier petición de cámara da `409` de
  inmediato, sin tener que preparar nada.
- Hay **2 préstamos atrasados** (PR-0004 y PR-0008) para que el filtro
  `atrasados=true` y la cifra del panel tengan algo que mostrar.

### Archivos

| Archivo | Contenido |
| :--- | :--- |
| `src/models/prestamo.model.ts` | Tipos, `CATEGORIAS_EQUIPO`, `ESTADOS_PRESTAMO`, `ESTADOS_VIVOS` |
| `src/routes/equipo.routes.ts` | Catálogo y el cálculo de disponibilidad |
| `src/routes/prestamo.routes.ts` | CRUD, validación, conflicto de stock y resumen |
| `src/data/store.ts` | Los 8 equipos y los 15 préstamos de origen |
