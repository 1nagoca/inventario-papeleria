# Inventario de Papelería — MVP

Quiero desarrollar una aplicación web de inventario para una papelería pequeña y sencilla. Este proyecto es inicialmente para uso de mi abuela, por lo que la aplicación debe ser extremadamente sencilla, clara y fácil de utilizar.

> **IMPORTANTE:** No quiero construir todavía un sistema gigante. Quiero comenzar con un MVP funcional y bien estructurado que posteriormente pueda ampliarse.

## Objetivo del MVP

Crear una aplicación web de inventario que permita administrar inicialmente solamente 5 productos de una papelería.

La aplicación debe permitir:

1. Ver los productos disponibles.
2. Ver cuántas unidades hay de cada producto.
3. Registrar una venta.
4. Registrar una entrada de productos/compras.
5. Actualizar automáticamente el inventario.
6. Ver la fecha y hora de cada movimiento.
7. Ver un historial sencillo de movimientos.
8. Agregar, editar y eliminar productos.
9. Tener una interfaz muy sencilla y visual.

## Productos iniciales

Crear inicialmente estos 5 productos de ejemplo:

- Lápiz
- Lapicero
- Cuaderno
- Borrador
- Resma de papel

Los productos **no deben quedar limitados permanentemente a cinco**. La aplicación debe estar preparada para agregar más productos posteriormente.

## Interfaz

La interfaz debe ser limpia, moderna y muy sencilla.

Pensar en que la utilizará una persona de aproximadamente 60 años que no necesariamente tiene experiencia con aplicaciones de inventario.

Por eso:

- Botones grandes.
- Textos claros.
- Poco contenido innecesario.
- Navegación sencilla.
- Evitar menús complicados.
- Utilizar iconos cuando ayuden a entender una acción.
- Mostrar claramente la cantidad disponible.
- Utilizar lenguaje sencillo.
- La aplicación debe funcionar bien desde un celular, tablet y computador.

## Pantalla principal

Crear un dashboard sencillo donde se vea:

**INVENTARIO**

| Producto | Cantidad | Precio | Estado |
|---|---:|---:|---|
| Lápiz | 50 | $500 | Disponible |
| Lapicero | 30 | $1.000 | Disponible |
| Cuaderno | 20 | $5.000 | Disponible |
| Borrador | 25 | $500 | Disponible |
| Resma de papel | 10 | $15.000 | Disponible |

También mostrar:

- Total de productos diferentes.
- Total de unidades disponibles.
- Ventas realizadas hoy.
- Alertas de productos con poco inventario.

## Registrar una venta

Debe existir un botón grande:

**REGISTRAR VENTA**

Al pulsarlo:

1. Seleccionar producto.
2. Indicar cantidad vendida.
3. Mostrar el precio.
4. Mostrar el total.
5. Confirmar venta.

Ejemplo:

- Producto: Lápiz
- Cantidad: 3
- Precio unitario: $500
- Total: $1.500

Al confirmar:

- Restar 3 unidades del inventario.
- Crear un registro de movimiento.
- Guardar fecha y hora.
- Guardar el producto.
- Guardar la cantidad.
- Guardar el tipo de movimiento como `VENTA`.

## Registrar entrada

Crear otro botón:

**AGREGAR PRODUCTOS**

Debe permitir registrar cuando llegan nuevos productos a la papelería.

Ejemplo:

- Producto: Lápiz
- Cantidad: 20

Al confirmar:

- Sumar 20 unidades al inventario.
- Crear un registro.
- Guardar fecha y hora.
- Guardar el producto.
- Guardar la cantidad.
- Guardar el tipo de movimiento como `ENTRADA`.

## Historial

Crear una pantalla de historial donde se puedan visualizar los movimientos.

Ejemplo:

| Fecha | Producto | Tipo | Cantidad |
|---|---|---|---:|
| 11/09/2026 | Lápiz | Venta | -3 |
| 11/09/2026 | Cuaderno | Venta | -2 |
| 11/09/2026 | Lápiz | Entrada | +20 |

Permitir filtrar posteriormente por:

- Ventas
- Entradas
- Producto
- Fecha

Para el MVP puede ser un filtro sencillo.

## Productos

Crear una sección llamada **Productos**.

Debe permitir:

- Ver productos.
- Agregar producto.
- Editar producto.
- Eliminar producto.
- Definir precio.
- Definir cantidad inicial.
- Definir stock mínimo.

Cada producto debería tener al menos:

- `id`
- `nombre`
- `precio`
- `stock`
- `stock_minimo`
- `created_at`
- `updated_at`

## Base de datos

Utilizar una base de datos adecuada para un proyecto pequeño, pero estructurarla correctamente para que posteriormente pueda crecer.

Crear como mínimo estas entidades/tablas:

### PRODUCTOS

- `id`
- `nombre`
- `precio`
- `stock`
- `stock_minimo`
- `created_at`
- `updated_at`

### MOVIMIENTOS

- `id`
- `producto_id`
- `tipo`
- `cantidad`
- `precio_unitario`
- `total`
- `fecha`
- `created_at`

El campo `tipo` debe permitir inicialmente:

- `VENTA`
- `ENTRADA`

La relación debe ser:

**Producto 1 ---- N Movimientos**

Es decir, un producto puede tener muchos movimientos.

## Regla importante: stock y movimientos

**NO MODIFICAR EL STOCK SIN REGISTRAR EL MOVIMIENTO.**

Cuando se haga una venta o entrada, debe existir una operación consistente:

### Venta

`stock actual - cantidad vendida`

### Entrada

`stock actual + cantidad ingresada`

Siempre debe crearse el movimiento correspondiente.

Evitar que una venta pueda dejar el inventario en números negativos.

Si alguien intenta vender más unidades de las disponibles, mostrar un mensaje claro:

> "No hay suficientes unidades disponibles."

## Tecnología

Antes de comenzar a programar:

1. Analiza el proyecto y el entorno disponible.
2. Identifica qué tecnologías existen.
3. Si ya existe una estructura de proyecto, respétala.
4. Si no existe, propón una arquitectura sencilla.
5. Explica brevemente por qué escogiste cada tecnología.
6. No agregues tecnologías innecesarias.

Quiero utilizar tecnologías modernas, sencillas de mantener y adecuadas para un proyecto pequeño.

## Arquitectura

Quiero que el proyecto esté separado correctamente en:

- Frontend
- Backend/API
- Base de datos

Aunque sea un proyecto pequeño, quiero que esté preparado para futuras ampliaciones.

## Futura integración con WhatsApp

**IMPORTANTE: No implementar todavía la integración real con WhatsApp.**

Pero quiero que la arquitectura quede preparada para hacerlo posteriormente.

El objetivo futuro es que mi abuela pueda enviar un mensaje de WhatsApp como:

> "Hoy vendí tres lápices."

O un audio diciendo:

> "Hoy vendí tres lápices y dos cuadernos."

Posteriormente, un sistema de IA podrá:

1. Recibir el mensaje.
2. Si es audio, convertirlo a texto.
3. Entender qué producto se vendió.
4. Detectar la cantidad.
5. Consultar el inventario.
6. Crear una venta.
7. Actualizar el stock.
8. Responder por WhatsApp confirmando la operación.

Ejemplo futuro:

**Mi abuela:**
> "Hoy vendí tres lápices."

**Bot:**
> "Entendido. Registré la venta de 3 lápices. ¿Confirmas?"

**Mi abuela:**
> "Sí."

**Sistema:**

- Reduce 3 lápices del inventario.
- Registra el movimiento.
- Guarda fecha y hora.

**NO IMPLEMENTAR ESTA PARTE TODAVÍA.**

Solamente diseñar el backend/API de forma que posteriormente sea posible conectar un chatbot de WhatsApp.

## API

Crear endpoints claros para las operaciones principales.

Por ejemplo:

```text
GET /products
POST /products
PUT /products/:id
DELETE /products/:id

POST /sales
POST /entries

GET /movements
```

La API debe estar preparada para que en el futuro una integración externa, como WhatsApp, pueda utilizarla.

Por ejemplo, en el futuro debería ser posible enviar algo parecido a:

```json
{
  "product": "Lápiz",
  "quantity": 3
}
```

a un endpoint de venta y que el backend se encargue de:

- Validar el producto.
- Validar el stock.
- Registrar la venta.
- Actualizar el inventario.
- Registrar fecha y hora.
- Devolver una respuesta clara.

## Seguridad y validaciones

Aunque sea un MVP:

- Validar cantidades.
- No permitir cantidades negativas.
- No permitir ventas superiores al stock.
- Validar precios.
- Validar productos inexistentes.
- Manejar errores correctamente.
- No confiar únicamente en las validaciones del frontend.

## Diseño

Quiero una apariencia de aplicación de inventario moderna pero sencilla.

Priorizar:

- Legibilidad.
- Botones grandes.
- Buena experiencia móvil.
- Información importante visible.
- Pocos pasos para registrar una venta.

No quiero animaciones innecesarias ni un diseño excesivamente complejo.

## Desarrollo

Antes de escribir código:

1. Analiza el proyecto actual.
2. Identifica qué tecnologías existen.
3. Propón la estructura que vas a utilizar.
4. Explica brevemente las decisiones importantes.
5. Después comienza a implementar.

No quiero que solamente me entregues ejemplos de código.

Quiero que realmente construyas el proyecto funcional dentro del entorno disponible.

Después de cada etapa importante, verifica que el código funcione y corrige los errores que encuentres.

## Orden de implementación

Trabaja en este orden:

### FASE 1
Configuración y estructura del proyecto.

### FASE 2
Base de datos.

### FASE 3
Modelo de productos.

### FASE 4
Modelo de movimientos.

### FASE 5
API para productos.

### FASE 6
API para ventas y entradas.

### FASE 7
Interfaz de inventario.

### FASE 8
Interfaz para registrar ventas.

### FASE 9
Interfaz para registrar entradas.

### FASE 10
Historial de movimientos.

### FASE 11
Dashboard.

### FASE 12
Pruebas y corrección de errores.

**NO avances a una arquitectura innecesariamente compleja.**

El objetivo inicial es tener una aplicación pequeña, funcional, estable y fácil de usar.

## Resultado final del MVP

Al terminar, quiero poder abrir la aplicación y hacer algo como:

1. Ver que tengo 50 lápices.
2. Pulsar "Registrar venta".
3. Seleccionar "Lápiz".
4. Colocar cantidad "3".
5. Confirmar.
6. El inventario debe mostrar 47 lápices.
7. En el historial debe aparecer una venta de 3 lápices con fecha y hora.
8. El dashboard debe reflejar la venta.

Después quiero poder agregar otros productos y realizar el mismo proceso.

Una vez que este MVP funcione correctamente, detente y explícame:

- Qué partes quedaron preparadas para la futura integración con WhatsApp.
- Cómo está organizada la aplicación.
- Qué partes funcionan actualmente.
- Cuál sería el siguiente paso para implementar el chatbot.
- Cuál sería el siguiente paso para implementar mensajes de voz.
