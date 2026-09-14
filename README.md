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

## Endpoints disponibles

```
GET    /api/health
GET    /api/products
POST   /api/products
PUT    /api/products/:id      (nombre, precio, stockMinimo — nunca stock)
DELETE /api/products/:id      (rechazado si el producto tiene movimientos)

POST   /api/sales             { productoId | producto, cantidad }
POST   /api/entries           { productoId | producto, cantidad }
GET    /api/movements         (filtros opcionales: ?tipo=VENTA|ENTRADA&productoId=)
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
- ✅ Sección "Productos" (agregar/editar/eliminar desde la interfaz) — pantalla con lista de productos, formulario para crear producto nuevo (nombre, precio, cantidad inicial, stock mínimo), edición inline (nombre, precio, stock mínimo — nunca `stock`) y confirmación inline antes de eliminar. No es una fase numerada del enunciado, pero es uno de los requisitos originales y una de las 5 pantallas fijadas en `CLAUDE.md`.

El MVP definido en `inventario_papeleria_prompt.md` está completo: las 5 pantallas (Inicio/Dashboard, Vender, Agregar, Historial, Productos) funcionan de punta a punta sobre la API REST, con la regla de negocio de stock/movimientos protegida por pruebas automatizadas.

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

### Backend (Render + Supabase) — código listo, falta crear el Web Service

El backend todavía no está alojado en ningún lado, por eso el sitio en
Netlify muestra "No se pudo cargar..." en todas las pantallas: no hay
ninguna API respondiendo en `/api/...`.

**Por qué PostgreSQL (Supabase) en vez de SQLite:** el disco de Render (plan
gratis) es efímero — se borra en cada redeploy y el servicio se duerme tras
~15 min sin uso. Si el inventario viviera en un archivo SQLite dentro de ese
disco, cualquier redeploy borraría productos y movimientos, rompiendo la
regla central del proyecto de no perder nunca un registro de inventario. La
solución fue sacar los datos del disco del servidor: ahora viven en una base
PostgreSQL gestionada por Supabase (plan gratis, persistente, independiente
del ciclo de vida del backend).

**Ya hecho (2026-09-13):**

- Backend migrado de SQLite a PostgreSQL (`backend/prisma/schema.prisma`,
  `backend/src/db/prisma.ts` con el adaptador `@prisma/adapter-pg`).
- Base de datos creada en Supabase, migración inicial aplicada y los 5
  productos sembrados (`npx prisma db seed`).
- Probado en local contra la base de Supabase: venta, entrada, historial y el
  rechazo de ventas sin stock suficiente funcionan igual que con SQLite.

**Pendiente — crear el Web Service en Render:**

1. En [render.com](https://render.com), crear un **Web Service** nuevo
   conectado al repo de GitHub.
2. **Root Directory**: `backend` (el repo es un monorepo).
3. **Build Command**: `npm install && npm run build` (el script `build`
   corre `prisma generate`, `prisma migrate deploy` y `tsc`, en ese orden,
   así cada deploy aplica migraciones pendientes automáticamente).
4. **Start Command**: `npm start`.
5. **Variable de entorno `DATABASE_URL`**: usar la cadena de conexión
   **"Session pooler"** de Supabase (Project Settings → Database →
   Connection String), no la conexión directa — Render solo tiene salida
   IPv4 y el host directo de Supabase suele resolver solo por IPv6.
6. **Conectar el frontend al backend real:**
   - En `frontend/src/api/client.ts` las peticiones van a `/api${path}`
     (ruta relativa, pensada para el proxy de Vite en desarrollo). Hay que
     cambiarlo para usar una URL absoluta configurable, ej.
     `import.meta.env.VITE_API_URL + path`.
   - En Netlify, agregar la variable de entorno `VITE_API_URL` con la URL
     del backend en Render (Site configuration → Environment variables) y
     volver a desplegar.
   - En el backend, configurar CORS (`cors()` en Express) para permitir el
     origin `https://inventario-papeleria.netlify.app`.

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

- **Totales de venta por período en el Historial.** Además de la lista de
  movimientos uno por uno, mostrar un resumen de cuánto se vendió en los
  últimos 15 días (quincenal) y en el mes (mensual) — un total en pesos y/o
  en unidades por período, no solo el detalle movimiento por movimiento que
  hay hoy.
- **Poder eliminar productos que ya no se venden**, aunque tengan historial
  de movimientos. Hoy `DELETE /api/products/:id` rechaza el borrado si el
  producto tiene movimientos asociados (ver sección "Endpoints disponibles"
  más arriba), precisamente para no romper la regla central del proyecto de
  nunca perder un registro de inventario. Habría que diseñar algo distinto a
  un borrado real — por ejemplo "archivar" o "descontinuar" un producto (que
  deje de aparecer para vender pero conserve su historial intacto) — en vez
  de simplemente destrabar el `DELETE` actual.
