# Inventario de Papelería

Aplicación web de inventario para una papelería pequeña. MVP pensado para que
lo use una persona sin experiencia previa con software de inventario:
interfaz sencilla, botones grandes, navegación mínima.

La especificación funcional completa está en `inventario_papeleria_prompt.md`.
Las reglas técnicas y de diseño que rigen el proyecto están en `CLAUDE.md`.

## Arquitectura

```
Frontend (React + Vite + TS)  <-- REST/JSON -->  Backend (Express + TS)  <-->  PostgreSQL (Supabase, vía Prisma)
     puerto 5173 (dev)                                puerto 3000 (dev)          base de datos remota
```

- `backend/` — API REST en Node.js + TypeScript + Express + Prisma + PostgreSQL (Supabase).
- `frontend/` — Interfaz en React + Vite + TypeScript.

Frontend y backend están completamente desacoplados: solo se comunican por
HTTP/JSON. El bot de WhatsApp (ver "Bot de WhatsApp" más abajo) vive dentro
del backend y usa la misma capa de servicios que la API, sin tocar el frontend.

## Requisitos

- Node.js 20+ y npm.

## Instalación y arranque (desarrollo)

En dos terminales distintas:

```bash
# Terminal 1: backend (http://localhost:3000)
cd backend
npm install
cp .env.example .env   # si no existe aún — completar DATABASE_URL con la
                        # cadena de conexión de Supabase (Project Settings →
                        # Database → Connection String → "Session pooler")
                        # y elegir una clave para APP_PASSWORD (ver abajo)
npx prisma migrate dev # aplica el esquema a la base indicada en DATABASE_URL
npx prisma db seed     # crea los 5 productos iniciales (solo la primera vez)
npm run dev
```

```bash
# Terminal 2: frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Abrir `http://localhost:5173` en el navegador. El frontend usa un proxy de
Vite (`/api` → `http://localhost:3000`) para hablar con el backend en
desarrollo.

**Clave de acceso (`APP_PASSWORD`):** todas las rutas de `/api` (salvo
`/api/health`) están protegidas por una clave compartida — ver
"Protección con clave compartida" más abajo. Sin `APP_PASSWORD` configurado
en `backend/.env`, la app pide la clave en el navegador pero el backend
rechaza cualquier intento con 401. En desarrollo, usa cualquier valor que
elijas en `.env` y escríbelo en la pantalla de acceso al abrir
`http://localhost:5173`.

## Endpoints disponibles

Todas las rutas, excepto `/api/health` y `/api/auth/verify`, requieren el
header `x-app-password` con el valor de `APP_PASSWORD` — ver "Protección con
clave compartida" más abajo. Sin ese header (o con uno incorrecto), la API
responde `401`.

La única otra excepción es `/api/whatsapp/webhook` (`GET` para la
verificación de Meta, `POST` para recibir mensajes): no usa `APP_PASSWORD`
porque quien la llama es Meta, y se protege con la firma de Meta y la lista
de números autorizados — ver "Bot de WhatsApp" más abajo.

```
GET    /api/health
GET    /api/auth/verify       (revisa si la clave enviada es correcta)

GET    /api/products          (?incluirDescontinuados=true para verlos todos)
POST   /api/products
PUT    /api/products/:id      (nombre, precio, stockMinimo, descontinuado — nunca stock)
DELETE /api/products/:id      (rechazado si el producto tiene movimientos)

POST   /api/sales               { productoId | producto, cantidad }
POST   /api/entries             { productoId | producto, cantidad }
GET    /api/movements           (?tipo=VENTA|ENTRADA&productoId=&antesDe=&limite=, máx. 15 por página)
GET    /api/movements/resumen   (totales de venta: últimos 15 días y mes actual — pesos y unidades)
POST   /api/movements/:id/anular  (solo ventas; no se puede anular dos veces)
```

`GET /api/movements` trae como mucho 15 movimientos por página (15 si no se
pasa `limite`, hasta 200 si se pide más). Para pedir los siguientes más
antiguos, se manda `antesDe` con la fecha del último movimiento ya recibido
— así funciona el botón "Ver más antiguos" del Historial.

## Estado actual

El plan de trabajo sigue el orden de fases definido en
`inventario_papeleria_prompt.md`.

**Completado:**

- ✅ FASE 1 — Configuración y estructura base (backend Express+TS, frontend React+Vite+TS, desacoplados vía REST/proxy).
- ✅ FASE 2 — Base de datos (esquema Prisma: `Product` y `Movimiento`, migración inicial; migrado de SQLite a PostgreSQL/Supabase el 2026-09-13, ver sección de despliegue).
- ✅ FASE 3 — Modelo de productos (seed con los 5 productos iniciales, idempotente).
- ✅ FASE 4 — Modelo de movimientos (`registrarVenta` / `registrarEntrada`: stock + movimiento en una sola transacción, sin excepciones).
- ✅ FASE 5 — API de productos (`GET/POST/PUT/DELETE /api/products`, validación con zod, protección del historial al eliminar).
- ✅ FASE 6 — API de ventas/entradas/movimientos (`POST /api/sales`, `POST /api/entries`, `GET /api/movements` con filtros).
- ✅ FASE 7 — Interfaz de inventario (pantalla principal con tarjetas de producto, estado Disponible/Pocas unidades/Agotado, navegación inferior).
- ✅ FASE 8 — Interfaz para registrar ventas (selector de producto, cantidad con stepper, precio/total en vivo, confirmación, manejo de stock insuficiente).
- ✅ FASE 9 — Interfaz para registrar entradas de productos (selector de producto, cantidad con stepper, stock actual visible, confirmación).
- ✅ FASE 10 — Historial de movimientos (tarjetas por movimiento con fecha, tipo y cantidad; filtro simple Todos/Ventas/Entradas).
- ✅ FASE 11 — Dashboard (resumen en la pantalla de Inventario: total de productos, unidades totales, ventas de hoy, y alerta de productos con pocas unidades/agotados).
- ✅ FASE 12 — Pruebas y corrección de errores:
  - Pruebas automatizadas (Vitest) sobre la regla de negocio no negociable del proyecto: `registrarVenta`/`registrarEntrada` en `backend/tests/movimientos.service.test.ts` (stock nunca negativo, atomicidad venta+movimiento, cantidades inválidas, producto inexistente). Correr con `npm test` dentro de `backend/`.
  - Ronda manual de casos límite sobre la API (cantidades inválidas, producto duplicado, edición de `stock` bloqueada, eliminación de producto con historial, filtros inválidos) y sobre la interfaz (producto agotado deshabilitado en el selector de venta).
  - Bug encontrado y corregido: cuando una petición tenía un campo no reconocido, la API respondía `{"error":"Datos inválidos.","detalles":{}}` sin explicar el problema (zod no incluía los errores "de forma" en `fieldErrors`). Corregido en `backend/src/middleware/errorHandler.ts`.
  - ⚠️ **Estado actual de `npm test` (backend):** roto desde la migración a PostgreSQL. `backend/tests/globalSetup.ts` sigue apuntando `DATABASE_URL` a un archivo SQLite (`file:./test.db`) para aislar los datos de prueba, pero `backend/prisma/schema.prisma` ahora fija el `datasource` a `provider = "postgresql"`, así que `prisma migrate deploy` falla con `P1013` antes de correr ninguna prueba. Las pruebas en sí (`backend/tests/movimientos.service.test.ts`) no cambiaron y siguen siendo válidas — falta darle al harness una base Postgres de pruebas aislada (no la misma de Supabase que usa producción, para no arrastrar/borrar datos reales con los `deleteMany()` de `beforeEach`).
- ✅ Sección "Productos" (agregar/editar/descontinuar desde la interfaz) — pantalla con lista de productos, formulario para crear producto nuevo (nombre, precio, cantidad inicial, stock mínimo) y edición inline (nombre, precio, stock mínimo — nunca `stock`). No es una fase numerada del enunciado, pero es uno de los requisitos originales y una de las 5 pantallas fijadas en `CLAUDE.md`.
- ✅ **Protección con clave compartida** (2026-09-13) — todas las rutas de `/api` salvo `/api/health` requieren el header `x-app-password` con el valor de `APP_PASSWORD` (middleware `backend/src/middleware/requireAppPassword.ts`). El frontend pide la clave una sola vez por navegador (componente `AccesoGate`, `GET /api/auth/verify` para validarla) y la guarda en `localStorage`. Se agregó porque tanto el sitio público en Netlify como la API en Render quedaban abiertos a cualquiera con el link.
- ✅ **Totales de venta por período** en Historial — resumen de "Últimos 15 días" (ventana móvil) y "Este mes" (mes de calendario en curso), en pesos y en unidades, calculado en `backend/src/services/movimientos.service.ts` (`obtenerResumenVentas`) vía `GET /api/movements/resumen` y mostrado arriba de la lista de movimientos (`ResumenVentasPeriodo`).
- ✅ **Anular una venta** desde Historial — no borra el movimiento (regla del proyecto: nunca perder un registro de inventario), lo marca `cancelado` y devuelve las unidades al stock, en una sola transacción (`anularVenta` en `movimientos.service.ts`, `POST /api/movements/:id/anular`). Solo aplica a ventas y no se puede anular dos veces; una venta cancelada sigue visible en el historial (marcada) pero deja de contar en los totales por período y en "ventas hoy" del Dashboard. Botón "Anular esta venta" con confirmación inline en cada tarjeta de venta.
- ✅ **Paginación del Historial** — `GET /api/movements` trae como mucho 15 movimientos por página en vez de la lista completa (para que no se vuelva eterna a medida que se registran más ventas). Botón "Ver más antiguos" al final de la lista para pedir la siguiente página con el cursor `antesDe`.
- ✅ **Descontinuar un producto** — en vez de destrabar el `DELETE` real (que sigue rechazado si el producto tiene movimientos, para no romper la regla de nunca perder un registro), la pantalla "Productos" tiene un botón "Descontinuar" que marca el producto (`descontinuado = true`) sin borrar nada: deja de aparecer en Vender, Agregar y en el Dashboard, y el backend rechaza registrarle ventas o entradas (`ProductoDescontinuadoError`), pero conserva su stock e historial intactos. `GET /api/products` excluye los descontinuados por defecto — la pantalla "Productos" pide `?incluirDescontinuados=true` para poder verlos (marcados) y ofrecer "Reactivar".

- ✅ **Bot de WhatsApp para registrar ventas** (2026-10-12) — webhook de la WhatsApp Cloud API de Meta dentro del backend (`/api/whatsapp/webhook`), interpretación del mensaje con Claude Haiku y confirmación obligatoria ("¿Confirmas? (sí/no)") antes de llamar a `registrarVenta`. Solo ventas por texto y solo para números autorizados. Pruebas automáticas propias (`npm run test:bot`, sin base de datos) y dos simuladores para probar sin WhatsApp. Detalle y configuración en la sección "Bot de WhatsApp".

El MVP definido en `inventario_papeleria_prompt.md` está completo: las 5 pantallas (Inicio/Dashboard, Vender, Agregar, Historial, Productos) funcionan de punta a punta sobre la API REST, con la regla de negocio de stock/movimientos protegida por pruebas automatizadas (ver nota sobre `npm test` arriba).

## Despliegue en producción

### Frontend (Netlify) — ✅ hecho

El frontend está desplegado en `inventario-papeleria.netlify.app`, conectado
al repo de GitHub (`main`), con auto-deploy en cada push. Configuración usada
en Netlify (Project configuration → Build & deploy → Build settings), porque
el proyecto es un monorepo y por defecto Netlify no sabe dónde está el
frontend:

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `frontend/dist`

Además existe `frontend/public/_redirects` con `/* /index.html 200` para que
las rutas de React Router (`/vender`, `/historial`, etc.) no den "Page not
found" al entrar directo o recargar la página — sin ese archivo, Netlify
busca un archivo físico en esa ruta y no lo encuentra.

### Backend (Render + Supabase) — ✅ hecho, confirmado en vivo el 2026-09-13

El backend está desplegado como Web Service en Render, con la base de datos
en Supabase Postgres. El sitio de Netlify habla con él vía `VITE_API_URL` y
todo el flujo (vender, registrar entrada, ver historial, rechazo de venta
sin stock) fue probado de punta a punta contra el sitio en producción.

**Por qué PostgreSQL (Supabase) en vez de SQLite:** el disco de Render (plan
gratis) es efímero — se borra en cada redeploy y el servicio se duerme tras
~15 min sin uso. Si el inventario viviera en un archivo SQLite dentro de ese
disco, cualquier redeploy borraría productos y movimientos, rompiendo la
regla central del proyecto de no perder nunca un registro de inventario. La
solución fue sacar los datos del disco del servidor: ahora viven en una base
PostgreSQL gestionada por Supabase (plan gratis, persistente, independiente
del ciclo de vida del backend).

**Configuración usada:**

- Backend migrado de SQLite a PostgreSQL (`backend/prisma/schema.prisma`,
  `backend/src/db/prisma.ts` con el adaptador `@prisma/adapter-pg`).
- Base de datos creada en Supabase, migración inicial aplicada y los 5
  productos sembrados (`npx prisma db seed`).
- Web Service en Render — **Root Directory**: `backend` (el repo es un
  monorepo); **Build Command**: `npm install && npm run build` (el script
  `build` corre `prisma generate`, `prisma migrate deploy` y `tsc`, en ese
  orden, así cada deploy aplica migraciones pendientes automáticamente);
  **Start Command**: `npm start`.
- **Variable de entorno `DATABASE_URL`** en Render: la cadena de conexión
  **"Session pooler"** de Supabase (Project Settings → Database →
  Connection String), no la conexión directa — Render solo tiene salida
  IPv4 y el host directo de Supabase suele resolver solo por IPv6.
- **Variable de entorno `APP_PASSWORD`** en Render — ver "Protección con
  clave compartida" en la sección "Estado actual".
- **Frontend conectado al backend real:** `frontend/src/api/client.ts` y
  `AccesoGate` leen `import.meta.env.VITE_API_URL` como base de las
  peticiones (con fallback a ruta relativa para el proxy de Vite en
  desarrollo). En Netlify, la variable de entorno `VITE_API_URL` apunta a la
  URL del backend en Render (Site configuration → Environment variables).
- **CORS** habilitado en el backend (`cors()` en Express, sin restricción de
  origin) para que Netlify pueda llamar a Render.

**Cosas a tener en cuenta, no son bugs:**

- El plan gratis de Render duerme el servicio tras ~15 min sin tráfico: la
  primera petición después de eso tarda entre 20 y 50 segundos en responder.
- Si el servicio de Render se recrea alguna vez, su URL cambia — hay que
  actualizar `VITE_API_URL` en Netlify y volver a desplegar.

**Nota sobre el bot de WhatsApp:** el plan anterior (Baileys) se descartó
porque necesitaba un proceso siempre encendido. El bot actual usa la API
oficial de Meta por webhook, que sí funciona en el plan gratis de Render —
ver la sección siguiente.

## Bot de WhatsApp

Permite registrar ventas escribiéndole a un número de WhatsApp:

> **Abuela:** hoy vendí 3 lápices y un cuaderno
> **Bot:** Voy a registrar: 3 Lápiz, 1 Cuaderno. ¿Confirmas? (sí/no)
> **Abuela:** sí
> **Bot:** Listo, registré la venta: 3 Lápiz, 1 Cuaderno. Total: $6.500.

**Qué hace y qué no (versión actual):**

- Solo registra **ventas** y solo a partir de **mensajes escritos**. No
  entiende audios, ni registra entradas de mercancía, ni anula ventas, ni
  responde consultas. Una venta registrada por error se anula desde la
  pantalla Historial de la app.
- **Nunca registra sin un "sí".** Si la respuesta es "no", o pasan más de 10
  minutos, no se registra nada.
- Solo atiende a los números de `WHATSAPP_NUMEROS_AUTORIZADOS`. A los demás
  no les responde.
- Si un producto no existe, está descontinuado o no hay unidades suficientes,
  lo dice y no registra nada.
- La venta queda con la fecha del momento en que se confirma (un "ayer
  vendí…" se registra con fecha de hoy), y el Historial no distingue si la
  venta se hizo por WhatsApp o por la app.

**Cómo funciona por dentro:** Meta envía cada mensaje a
`POST /api/whatsapp/webhook`. El backend comprueba la firma de Meta y que el
número esté autorizado; Claude Haiku (`claude-haiku-5-5`) convierte el texto
en productos y cantidades; el backend valida contra el inventario real y
pregunta; con el "sí" llama a `registrarVenta`, la misma función que usa la
app. La IA solo interpreta: nunca registra ni decide.

**Costo:** Meta no cobra por responder mensajes que la persona inicia. Claude
Haiku cuesta fracciones de centavo de dólar por mensaje (centavos al mes con
el uso de una papelería). Render sigue en el plan gratis.

### Variables de entorno

Van en `backend/.env` para probar en tu computador y en Render (Environment)
para producción. **Nunca en el código ni en git.** Si falta alguna, el
webhook rechaza todos los mensajes.

| Variable | Qué es | De dónde sale |
|---|---|---|
| `WHATSAPP_VERIFY_TOKEN` | Frase que inventas tú | Te la inventas (paso 6) |
| `META_APP_SECRET` | Clave con la que Meta firma cada mensaje | Meta, paso 3 |
| `WHATSAPP_TOKEN` | Permiso para responder mensajes | Meta, paso 4 |
| `WHATSAPP_PHONE_NUMBER_ID` | Identificador del número del bot (no es el número) | Meta, paso 2 |
| `WHATSAPP_NUMEROS_AUTORIZADOS` | Números que el bot atiende: código de país + número, sin `+` ni espacios, separados por coma. Ej.: `573001234567,573109876543` | Los celulares de la familia |
| `ANTHROPIC_API_KEY` | Clave de la API de Claude | Anthropic, paso 5 |

### Probar sin WhatsApp

Todo desde la carpeta `backend/`:

```bash
npm run test:bot              # pruebas automáticas del bot (sin base de datos ni internet)
npm run bot:simular           # chat en la terminal; NO registra nada aunque digas "sí"
npm run bot:simular -- --registrar   # igual, pero SÍ registra ventas de verdad
npm run bot:simular-webhook   # prueba la seguridad del webhook (firma, números, repetidos)
```

- `bot:simular` necesita `ANTHROPIC_API_KEY` y `DATABASE_URL` en
  `backend/.env`: usa la IA real y los productos reales. **Ojo:** si
  `DATABASE_URL` apunta a la base de producción, con `--registrar` las ventas
  quedan en el inventario real (se pueden anular desde Historial).
- `bot:simular-webhook` nunca responde "sí" ni envía nada a WhatsApp.

### Configuración paso a paso (primera vez)

Los nombres de los menús de Meta cambian con frecuencia; si alguno no
coincide exactamente, busca el que más se le parezca.

**1. Crear la app en Meta**

1. Entra a <https://developers.facebook.com> con tu cuenta de Facebook y
   acepta registrarte como desarrollador.
2. "My Apps" → "Create App". Cuando pregunte para qué es, elige la opción
   relacionada con WhatsApp / "Business". Si te pide un "portafolio
   comercial" (Business portfolio) y no tienes, créalo ahí mismo con el
   nombre de la papelería.

**2. Activar WhatsApp y el número de prueba**

1. En el panel de la app, agrega el producto **WhatsApp** y entra a
   "API Setup" (Configuración de la API).
2. Meta te da un **número de prueba**. Copia su **Phone number ID** →
   `WHATSAPP_PHONE_NUMBER_ID`.
3. En "To" (Para), agrega tu celular como destinatario y confírmalo con el
   código que te llega por WhatsApp. El número de prueba solo puede hablar
   con los números agregados ahí (máximo 5).

**3. Copiar el App Secret**

"App settings" → "Basic" → "App Secret" → "Show" → `META_APP_SECRET`.

**4. Crear un token que no venza**

El token que aparece en "API Setup" sirve para una prueba rápida pero vence
en 24 horas. Para uno permanente:

1. Entra a <https://business.facebook.com/settings> → "Users" → "System
   users" → "Add". Crea uno con rol de administrador.
2. "Assign assets": asígnale la app (control total) y la cuenta de WhatsApp.
3. "Generate token": elige la app, vencimiento "Never", y marca los permisos
   `whatsapp_business_messaging` y `whatsapp_business_management`.
4. Copia el token (solo se muestra una vez) → `WHATSAPP_TOKEN`.

**5. Crear la clave de Claude**

1. Entra a <https://console.anthropic.com>, crea una cuenta y en "Billing"
   carga saldo (el mínimo alcanza para muchísimo tiempo).
2. "API Keys" → "Create Key" → `ANTHROPIC_API_KEY`.

**6. Poner las variables en Render**

En el servicio del backend → "Environment", agrega las 6 variables de la
tabla. Para `WHATSAPP_VERIFY_TOKEN` inventa una frase larga cualquiera. En
`WHATSAPP_NUMEROS_AUTORIZADOS` pon por ahora solo tu celular. Guarda y espera
a que Render termine de desplegar.

**7. Conectar el webhook**

1. En Meta: WhatsApp → "Configuration" → "Webhook" → "Edit".
2. **Callback URL:** `https://TU-SERVICIO.onrender.com/api/whatsapp/webhook`
3. **Verify token:** la misma frase de `WHATSAPP_VERIFY_TOKEN`.
4. "Verify and save". Si Render estaba dormido puede fallar la primera vez:
   abre `https://TU-SERVICIO.onrender.com/api/health` en el navegador, espera
   a que responda y vuelve a intentar.
5. En "Webhook fields", suscríbete a **`messages`**.

**8. Probar**

Desde tu celular, escríbele al número de prueba: `vendí 1 lápiz`. Debe
preguntarte si confirmas. Responde `no` para no registrar nada, o `sí` y
luego anula esa venta desde Historial.

**9. Mantener despierto el servidor (recomendado)**

El plan gratis de Render se duerme tras ~15 minutos sin uso. Los mensajes no
se pierden (Meta los reintenta), pero la primera respuesta puede tardar uno o
varios minutos. Para evitarlo, crea una cuenta gratis en
<https://uptimerobot.com> y agrega un monitor HTTP a
`https://TU-SERVICIO.onrender.com/api/health` cada 10 minutos.

**10. Pasar al número definitivo**

1. En Meta: WhatsApp → "API Setup" → "Add phone number". El número no puede
   estar en uso en la app de WhatsApp normal; se verifica por SMS o llamada.
2. Cambia en Render `WHATSAPP_PHONE_NUMBER_ID` por el del número nuevo (y
   `WHATSAPP_TOKEN` si generaste otro).
3. Pon en `WHATSAPP_NUMEROS_AUTORIZADOS` los celulares de la abuela y la
   mamá.
4. Es probable que Meta pida pasar la app a modo "Live" (necesita la
   dirección de una política de privacidad) y registrar un medio de pago.

No hay que cambiar nada en el código.

### Si el bot no responde

Revisa en este orden (los mensajes de error aparecen en Render → "Logs"):

1. **¿Render está despierto?** Abre `/api/health` en el navegador.
2. **`mensaje ignorado de un número no autorizado (57…)`** en los logs: el
   número no está en `WHATSAPP_NUMEROS_AUTORIZADOS`, o está escrito distinto.
   Copia el número tal como aparece en ese mensaje.
3. **`faltan variables de entorno: …`**: falta alguna de las 6 en Render.
4. **`Meta rechazó el envío (401)`**: el `WHATSAPP_TOKEN` venció (era el de
   24 horas) o no tiene permisos — repite el paso 4.
5. **`Meta rechazó el envío`** con otro código, usando el número de prueba:
   el celular no está en la lista de destinatarios del paso 2.
6. **`AuthenticationError`** o error de saldo: revisa `ANTHROPIC_API_KEY` y
   el saldo en Anthropic. El bot responde "Tuve un problema y no registré
   nada".
7. **No llega nada a los logs**: el webhook no quedó suscrito a `messages`
   (paso 7), o `META_APP_SECRET` no coincide (Meta recibe un 401).

## Ideas para el futuro

Pedidas por Camilo el 2026-09-14, no implementadas todavía — quedan aquí
anotadas para retomarlas más adelante, no son parte del MVP actual.

- **Elegir el período de los totales de venta (con calendario).** Hoy
  `GET /api/movements/resumen` solo calcula dos ventanas fijas: "Últimos 15
  días" (rolling, desde hoy hacia atrás) y "Este mes" (mes de calendario en
  curso) — no hay forma de pedir un período distinto. La idea es poder
  elegir el mes (ej. ver los totales de septiembre o de agosto, no solo el
  mes actual) y también poder elegir cuáles 15 días (no solo los últimos 15
  desde hoy), con algo tipo selector de mes / calendario en la interfaz.
  Habría que generalizar `obtenerResumenVentas` para aceptar un rango de
  fechas (`desde`/`hasta`) en vez de tener las dos ventanas fijas
  hardcodeadas, y agregar en el Historial un control para elegir mes o rango
  de fechas.
- **Ganancia por producto (costo de compra vs. precio de venta).** Hoy
  `Product` solo guarda `precio` (precio de venta) — no hay ningún campo
  para lo que costó comprar/producir ese producto, así que la app no puede
  calcular cuánto se gana. Ejemplo de Camilo: se compra una caja de 20
  borradores por $50.000 (o sea, $2.500 la unidad) y cada borrador se vende
  a $500 — la idea es guardar ese costo unitario de compra en cada producto
  para poder mostrar la ganancia (precio de venta − costo) por unidad, por
  venta y, idealmente, totalizada por período (conectando con el punto
  anterior). Nota: con los números exactos del ejemplo la cuenta da negativa
  ($500 − $2.500), probablemente los números reales que Camilo tiene en
  mente son otros — lo importante es la idea, no el ejemplo. Punto a decidir
  antes de implementar: el costo puede cambiar entre una compra (entrada) y
  la siguiente (ej. el próximo lote de borradores puede costar distinto) —
  habría que definir si se guarda un solo costo unitario "actual" por
  producto (simple, se actualiza al registrar una entrada) o un costo por
  lote/entrada (más preciso pero más complejo, ej. costo promedio
  ponderado).

