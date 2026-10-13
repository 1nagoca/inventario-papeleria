import { prisma } from "../db/prisma";
import { type Interpretacion, interpretarMensaje } from "./interpreteVentas.service";
import {
  ProductoDescontinuadoError,
  ProductoNoEncontradoError,
  StockInsuficienteError,
  registrarVenta,
} from "./movimientos.service";

export interface ProductoBot {
  id: number;
  nombre: string;
  stock: number;
  descontinuado: boolean;
}

export interface MensajeEntrante {
  telefono: string;
  texto: string;
  /** Hora en que se envió el mensaje (no en la que llegó al servidor). */
  fecha: Date;
}

export interface DependenciasBot {
  listarProductos: () => Promise<ProductoBot[]>;
  interpretar: (texto: string, productos: ProductoBot[]) => Promise<Interpretacion>;
  registrarVenta: (input: {
    productoId: number;
    cantidad: number;
  }) => Promise<{ movimiento: { total: number } }>;
}

interface ItemVenta {
  productoId: number;
  nombre: string;
  cantidad: number;
}

interface VentaPendiente {
  items: ItemVenta[];
  creadaEn: Date;
}

const MINUTOS_PARA_CONFIRMAR = 10;
const LARGO_MAXIMO_MENSAJE = 500;

const AYUDA = 'Para registrar una venta escríbeme algo como: "vendí 3 lápices y 1 cuaderno".';
const NADA_PENDIENTE = `No tengo ninguna venta por confirmar. ${AYUDA}`;
const PROBLEMA = "Tuve un problema y no registré nada. Inténtalo de nuevo en un momento.";

const RESPUESTAS_SI = new Set([
  "si senor",
  "si senora",
  "confirmo",
  "correcto",
  "dale",
  "listo",
  "ok",
]);
const RESPUESTAS_NO = new Set(["no", "cancelar", "cancela"]);

// Solo cuentan respuestas cortas y exactas. Un texto más largo ("no, eran 2
// lápices") no es un "no": se interpreta como una venta nueva.
function clasificarRespuesta(texto: string): "si" | "no" | "otro" {
  const limpio = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (/^si+$/.test(limpio) || RESPUESTAS_SI.has(limpio)) return "si";
  if (RESPUESTAS_NO.has(limpio)) return "no";
  return "otro";
}

function describirItems(items: ItemVenta[]): string {
  return items.map((item) => `${item.cantidad} ${item.nombre}`).join(", ");
}

function preguntaDeConfirmacion(items: ItemVenta[]): string {
  return `Voy a registrar: ${describirItems(items)}. ¿Confirmas? (sí/no)`;
}

function formatearPesos(valor: number): string {
  return `$${valor.toLocaleString("es-CO")}`;
}

/**
 * Conversación del bot, sin nada de WhatsApp adentro: recibe un mensaje de
 * texto y devuelve el texto a responder. El webhook y el simulador de la
 * terminal usan esta misma función.
 *
 * Nunca registra una venta sin un "sí" previo, y solo la registra a través de
 * `registrarVenta` (regla de negocio de CLAUDE.md: stock y movimiento juntos).
 */
export function crearBot(deps: DependenciasBot) {
  // Una venta por confirmar por número. Vive en memoria: si el servidor se
  // reinicia se pierde, y la persona simplemente escribe la venta otra vez.
  const pendientes = new Map<string, VentaPendiente>();

  async function registrarPendiente(items: ItemVenta[]): Promise<string> {
    const registrados: ItemVenta[] = [];
    const fallidos: string[] = [];
    let total = 0;

    for (const item of items) {
      try {
        const { movimiento } = await deps.registrarVenta({
          productoId: item.productoId,
          cantidad: item.cantidad,
        });
        registrados.push(item);
        total += movimiento.total;
      } catch (error) {
        const descripcion = `${item.cantidad} ${item.nombre}`;
        if (error instanceof StockInsuficienteError) {
          fallidos.push(`${descripcion} (solo quedan ${error.disponibles})`);
        } else if (error instanceof ProductoDescontinuadoError) {
          fallidos.push(`${descripcion} (ya no se vende)`);
        } else if (error instanceof ProductoNoEncontradoError) {
          fallidos.push(`${descripcion} (ya no existe)`);
        } else {
          console.error(error);
          fallidos.push(`${descripcion} (hubo un problema)`);
        }
      }
    }

    if (fallidos.length === 0) {
      return `Listo, registré la venta: ${describirItems(registrados)}. Total: ${formatearPesos(total)}.`;
    }
    if (registrados.length === 0) {
      return `No registré nada. No pude registrar: ${fallidos.join(", ")}.`;
    }
    return `Registré solo una parte: ${describirItems(registrados)}. Total: ${formatearPesos(total)}. No pude registrar: ${fallidos.join(", ")}.`;
  }

  async function proponerVenta(mensaje: MensajeEntrante, pendiente?: VentaPendiente) {
    const productos = await deps.listarProductos();
    const { esVenta, items, noReconocidos } = await deps.interpretar(mensaje.texto, productos);

    if (!esVenta || (items.length === 0 && noReconocidos.length === 0)) {
      return pendiente
        ? `No te entendí. ${preguntaDeConfirmacion(pendiente.items)}`
        : `No te entendí. ${AYUDA}`;
    }

    // Desde aquí el mensaje es una venta nueva: reemplaza a la que estuviera
    // por confirmar, para que un "sí" posterior nunca registre la anterior.
    pendientes.delete(mensaje.telefono);

    const problemas = noReconocidos.map((nombre) => `No encontré "${nombre}" entre los productos.`);
    const cantidades = new Map<number, number>();
    for (const item of items) {
      const producto = productos.find((p) => p.id === item.productoId);
      if (!producto) {
        throw new Error(`La interpretación devolvió un producto inexistente: ${item.productoId}`);
      }
      if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
        problemas.push(`No entendí cuántas unidades de ${producto.nombre} vendiste.`);
        continue;
      }
      cantidades.set(producto.id, (cantidades.get(producto.id) ?? 0) + item.cantidad);
    }

    const propuesta: ItemVenta[] = [];
    for (const [productoId, cantidad] of cantidades) {
      const producto = productos.find((p) => p.id === productoId)!;
      if (producto.descontinuado) {
        problemas.push(`${producto.nombre} ya no se vende.`);
      } else if (producto.stock === 0) {
        problemas.push(`No quedan unidades de ${producto.nombre}.`);
      } else if (producto.stock < cantidad) {
        problemas.push(`Solo quedan ${producto.stock} de ${producto.nombre}.`);
      } else {
        propuesta.push({ productoId, nombre: producto.nombre, cantidad });
      }
    }

    if (problemas.length > 0) {
      return `${problemas.join(" ")} No registré nada. Escríbeme la venta otra vez.`;
    }

    pendientes.set(mensaje.telefono, { items: propuesta, creadaEn: mensaje.fecha });
    return preguntaDeConfirmacion(propuesta);
  }

  async function procesarMensaje(mensaje: MensajeEntrante): Promise<string> {
    const texto = mensaje.texto.trim();
    if (texto.length === 0) return AYUDA;
    if (texto.length > LARGO_MAXIMO_MENSAJE) {
      return `Ese mensaje es muy largo. ${AYUDA}`;
    }

    let pendiente = pendientes.get(mensaje.telefono);
    let vencida = false;
    if (pendiente) {
      const minutos = (mensaje.fecha.getTime() - pendiente.creadaEn.getTime()) / 60_000;
      if (minutos > MINUTOS_PARA_CONFIRMAR) {
        pendientes.delete(mensaje.telefono);
        pendiente = undefined;
        vencida = true;
      }
    }

    const respuesta = clasificarRespuesta(texto);

    if (respuesta === "si") {
      if (vencida) return "Pasó mucho tiempo y no registré nada. Escríbeme la venta otra vez.";
      if (!pendiente) return NADA_PENDIENTE;
      // Se quita ANTES de registrar: un segundo "sí" (o el mismo mensaje
      // entregado dos veces) ya no encuentra nada que registrar.
      pendientes.delete(mensaje.telefono);
      return registrarPendiente(pendiente.items);
    }

    if (respuesta === "no") {
      if (!pendiente && !vencida) return NADA_PENDIENTE;
      pendientes.delete(mensaje.telefono);
      return "Listo, no registré nada.";
    }

    try {
      return await proponerVenta({ ...mensaje, texto }, pendiente);
    } catch (error) {
      console.error(error);
      pendientes.delete(mensaje.telefono);
      return PROBLEMA;
    }
  }

  return { procesarMensaje };
}

/** Incluye descontinuados a propósito, para poder responder "ya no se vende". */
export function listarProductosParaBot(): Promise<ProductoBot[]> {
  return prisma.product.findMany({
    select: { id: true, nombre: true, stock: true, descontinuado: true },
    orderBy: { nombre: "asc" },
  });
}

export const bot = crearBot({
  listarProductos: listarProductosParaBot,
  interpretar: interpretarMensaje,
  registrarVenta,
});
