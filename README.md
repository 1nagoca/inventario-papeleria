# Inventario de Papelería

Aplicación web de inventario para una papelería pequeña. MVP pensado para que
lo use una persona sin experiencia previa con software de inventario:
interfaz sencilla, botones grandes, navegación mínima.

La especificación funcional completa está en `inventario_papeleria_prompt.md`.
Las reglas técnicas y de diseño que rigen el proyecto están en `CLAUDE.md`.

## Arquitectura

```
Frontend (React + Vite + TS)  <-- REST/JSON -->  Backend (Express + TS)  <-->  SQLite (Prisma)
     puerto 5173 (dev)                                puerto 3000 (dev)          archivo local .db
```

- `backend/` — API REST en Node.js + TypeScript + Express + Prisma + SQLite.
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
cp .env.example .env   # si no existe aún
npx prisma migrate dev # crea backend/prisma/dev.db y aplica el esquema
npx prisma db seed     # crea los 5 productos iniciales
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
- ✅ FASE 2 — Base de datos (esquema Prisma: `Product` y `Movimiento`, SQLite, migración inicial).
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
