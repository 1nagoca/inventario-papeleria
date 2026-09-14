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
HTTP/JSON. Esto deja el backend listo para que, más adelante, una integración
externa (por ejemplo un bot de WhatsApp) pueda usar los mismos endpoints o la
misma capa de servicios sin tocar el frontend.

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

```
GET    /api/health
GET    /api/auth/verify       (revisa si la clave enviada es correcta)

GET    /api/products
POST   /api/products
PUT    /api/products/:id      (nombre, precio, stockMinimo — nunca stock)
DELETE /api/products/:id      (rechazado si el producto tiene movimientos)

POST   /api/sales              { productoId | producto, cantidad }
POST   /api/entries            { productoId | producto, cantidad }
GET    /api/movements          (filtros opcionales: ?tipo=VENTA|ENTRADA&productoId=)
GET    /api/movements/resumen  (totales de venta: últimos 15 días y mes actual — pesos y unidades)
```

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
- ✅ Sección "Productos" (agregar/editar/eliminar desde la interfaz) — pantalla con lista de productos, formulario para crear producto nuevo (nombre, precio, cantidad inicial, stock mínimo), edición inline (nombre, precio, stock mínimo — nunca `stock`) y confirmación inline antes de eliminar. No es una fase numerada del enunciado, pero es uno de los requisitos originales y una de las 5 pantallas fijadas en `CLAUDE.md`.
- ✅ **Protección con clave compartida** (2026-09-13) — todas las rutas de `/api` salvo `/api/health` requieren el header `x-app-password` con el valor de `APP_PASSWORD` (middleware `backend/src/middleware/requireAppPassword.ts`). El frontend pide la clave una sola vez por navegador (componente `AccesoGate`, `GET /api/auth/verify` para validarla) y la guarda en `localStorage`. Se agregó porque tanto el sitio público en Netlify como la API en Render quedaban abiertos a cualquiera con el link.
- ✅ **Totales de venta por período** en Historial — resumen de "Últimos 15 días" (ventana móvil) y "Este mes" (mes de calendario en curso), en pesos y en unidades, calculado en `backend/src/services/movimientos.service.ts` (`obtenerResumenVentas`) vía `GET /api/movements/resumen` y mostrado arriba de la lista de movimientos (`ResumenVentasPeriodo`).

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

**Nota sobre el bot de WhatsApp:** el plan pausado (Baileys, integración no
implementada aún) necesita un proceso siempre encendido con una conexión
WebSocket viva a WhatsApp, algo que el plan gratis de Render no garantiza —
el servicio se duerme sin tráfico. Mover la base de datos a Supabase
resuelve la pérdida de datos, pero no ese problema; el bot sigue pausado
hasta contar con un host que no se duerma (VM propia, plan pago de Render,
etc.).

## Ideas para el futuro

Pedidas por Camilo el 2026-09-13, no implementadas todavía — quedan aquí
anotadas para retomarlas más adelante, no son parte del MVP actual.
("Totales de venta por período" ya se implementó — ver "Estado actual".)

- **Poder eliminar productos que ya no se venden**, aunque tengan historial
  de movimientos. Hoy `DELETE /api/products/:id` rechaza el borrado si el
  producto tiene movimientos asociados (ver sección "Endpoints disponibles"
  más arriba), precisamente para no romper la regla central del proyecto de
  nunca perder un registro de inventario. Habría que diseñar algo distinto a
  un borrado real — por ejemplo "archivar" o "descontinuar" un producto (que
  deje de aparecer para vender pero conserve su historial intacto) — en vez
  de simplemente destrabar el `DELETE` actual.
