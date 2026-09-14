# CLAUDE.md — Inventario de Papelería

Memoria persistente del proyecto. Estas reglas tienen prioridad sobre cualquier
comportamiento por defecto al trabajar en este repositorio.

## Propósito del proyecto

Aplicación web de inventario para una papelería pequeña. Es un MVP: administra
inicialmente 5 productos (Lápiz, Lapicero, Cuaderno, Borrador, Resma de papel),
pero la estructura debe permitir agregar más productos sin límite.

El usuario final es **una persona de ~60 años sin experiencia previa con
software de inventario**. Todo el diseño de interfaz debe partir de esa
premisa, no de lo que sería cómodo para un usuario técnico.

La especificación funcional completa vive en `inventario_papeleria_prompt.md`
(raíz del repo) — es la fuente de verdad de requisitos. Este archivo fija las
reglas técnicas y de diseño que se derivan de ella.

## Reglas de UX/UI (prioridad alta)

- **Botones grandes y táctiles.** Área de toque amplia, pensada para dedos y
  para pantallas pequeñas, no para precisión de mouse.
- **Texto claro y en español simple.** Nada de jerga técnica ("stock crítico",
  "SKU", etc.) — usar palabras como "pocas unidades", "producto".
- **Navegación mínima y plana.** Pantallas: Dashboard, Registrar venta,
  Agregar productos, Historial, Productos. Sin menús anidados ni breadcrumbs
  complejos.
- **Pocos pasos para registrar una venta**: producto → cantidad → confirmar.
  No agregar pasos intermedios "por si acaso".
- **Sin animaciones ni adornos innecesarios.** La información clave (stock
  actual, alertas de bajo inventario) debe estar siempre visible, no detrás de
  un clic.
- **Responsive real**: debe verse y usarse bien en celular, tablet y
  computador — diseñar mobile-first.
- **Alto contraste y tamaños de fuente generosos** por legibilidad.

## Regla de negocio estricta (no negociable)

**Prohibido actualizar `stock` de un producto sin crear su registro
correspondiente en `Movimiento`.**

- Ninguna ruta, controlador o script debe llamar a
  `prisma.product.update({ data: { stock: ... } })` directamente. Toda
  modificación de stock pasa por la capa `backend/src/services/`
  (`registrarVenta`, `registrarEntrada`), que actualiza stock **y** crea el
  movimiento dentro de una misma transacción Prisma (`prisma.$transaction`).
  Si una de las dos operaciones falla, ninguna se aplica.
- Una venta **nunca** puede dejar el stock en negativo. Si la cantidad
  solicitada supera el stock disponible, no se modifica nada y se responde con
  el mensaje: `"No hay suficientes unidades disponibles."`
- Fórmulas:
  - Venta: `stock_nuevo = stock_actual - cantidad`
  - Entrada: `stock_nuevo = stock_actual + cantidad`
- Toda validación (cantidades positivas, producto existente, stock
  suficiente, precios válidos) se hace **en el backend**, sin confiar
  únicamente en lo que valide el frontend.
- **Anular una venta nunca borra el `Movimiento`.** Una venta registrada por
  error se anula (`anularVenta` en `movimientos.service.ts`,
  `POST /api/movements/:id/anular`), no se elimina: el registro se marca
  `cancelado = true` y las unidades vuelven al stock, dentro de la misma
  transacción Prisma. Ninguna ruta, controlador o script debe borrar filas de
  `Movimiento` ni tocar `stock` para "deshacer" una venta fuera de esa
  función. Solo aplica a ventas (no a entradas) y no se puede anular una
  venta ya anulada. Las ventas anuladas se excluyen de los totales
  (`obtenerResumenVentas`) pero siguen visibles en el Historial — nunca se
  pierde el registro de que existieron.

## Arquitectura (fijada, no renegociar sin motivo fuerte)

```
Frontend (React + Vite + TS)  <-- REST/JSON -->  Backend (Express + TS)  <-->  PostgreSQL (Supabase, vía Prisma)
```

- **Backend**: Node.js + TypeScript + Express + Prisma + PostgreSQL (Supabase).
  Migrado de SQLite el 2026-09-13 porque el disco de Render (plan gratis) es
  efímero — ver README, sección "Despliegue en producción", para el detalle.
- **Frontend**: React + Vite + TypeScript.
- **Comunicación exclusivamente vía API REST/JSON.** El frontend no conoce
  Prisma ni la base de datos; solo hace `fetch`/`axios` contra `/api/...`.
- **Capa de servicios reutilizable**: la lógica de negocio (`services/`) debe
  ser invocable directamente desde código (no solo a través de un
  controlador HTTP). Esto es lo que deja el proyecto **preparado para la
  futura integración con WhatsApp**: un webhook podrá llamar a
  `ventasService.registrarVenta()` reutilizando exactamente la misma lógica
  que usa la API REST, sin duplicarla.
- **No implementar todavía** la integración real con WhatsApp ni
  transcripción de audio — solo mantener la arquitectura desacoplada para que
  sea posible después.
- La base de datos vive en Supabase (Postgres gestionado), no en un archivo
  local; el esquema y las migraciones de Prisma sí se versionan en git.

## Convenciones de desarrollo

- Sin sobre-ingeniería: no agregar features, capas o abstracciones que la
  especificación no pida. Preferir código simple y directo sobre patrones
  "por si escala".
- Seguir el orden de FASES ya definido en `inventario_papeleria_prompt.md`
  (FASE 1: estructura → FASE 2: BD → ... → FASE 12: pruebas). No saltar a una
  arquitectura más compleja de la necesaria para el MVP.
- Después de cada fase importante, verificar que el código corre (backend y
  frontend arrancan sin errores) antes de continuar.
