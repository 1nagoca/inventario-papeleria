import { prisma } from "../db/prisma";
import { TipoMovimiento } from "../generated/prisma/client";

export class ProductoNoEncontradoError extends Error {
  constructor() {
    super("Producto no encontrado.");
    this.name = "ProductoNoEncontradoError";
  }
}

export class StockInsuficienteError extends Error {
  readonly disponibles: number;

  constructor(disponibles: number) {
    super("No hay suficientes unidades disponibles.");
    this.name = "StockInsuficienteError";
    this.disponibles = disponibles;
  }
}

export class CantidadInvalidaError extends Error {
  constructor() {
    super("La cantidad debe ser un número entero mayor a 0.");
    this.name = "CantidadInvalidaError";
  }
}

export class MovimientoNoEncontradoError extends Error {
  constructor() {
    super("Movimiento no encontrado.");
    this.name = "MovimientoNoEncontradoError";
  }
}

export class MovimientoNoEsVentaError extends Error {
  constructor() {
    super("Solo se pueden anular ventas.");
    this.name = "MovimientoNoEsVentaError";
  }
}

export class MovimientoYaCanceladoError extends Error {
  constructor() {
    super("Esta venta ya estaba anulada.");
    this.name = "MovimientoYaCanceladoError";
  }
}

interface RegistrarMovimientoInput {
  productoId: number;
  cantidad: number;
}

/**
 * Núcleo de la regla de negocio: stock y movimiento SIEMPRE se actualizan
 * juntos, dentro de la misma transacción. Si algo falla, no se aplica nada.
 * No exportar: usar registrarVenta / registrarEntrada.
 */
async function aplicarMovimiento(
  tipo: TipoMovimiento,
  { productoId, cantidad }: RegistrarMovimientoInput,
) {
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new CantidadInvalidaError();
  }

  return prisma.$transaction(async (tx) => {
    const producto = await tx.product.findUnique({ where: { id: productoId } });
    if (!producto) {
      throw new ProductoNoEncontradoError();
    }

    if (tipo === TipoMovimiento.VENTA && producto.stock < cantidad) {
      throw new StockInsuficienteError(producto.stock);
    }

    const delta = tipo === TipoMovimiento.VENTA ? -cantidad : cantidad;

    const productoActualizado = await tx.product.update({
      where: { id: productoId },
      data: { stock: { increment: delta } },
    });

    const movimiento = await tx.movimiento.create({
      data: {
        productoId,
        tipo,
        cantidad,
        precioUnitario: producto.precio,
        total: producto.precio * cantidad,
      },
    });

    return { producto: productoActualizado, movimiento };
  });
}

export function registrarVenta(input: RegistrarMovimientoInput) {
  return aplicarMovimiento(TipoMovimiento.VENTA, input);
}

export function registrarEntrada(input: RegistrarMovimientoInput) {
  return aplicarMovimiento(TipoMovimiento.ENTRADA, input);
}

/**
 * Anular una venta no borra el movimiento (regla del proyecto: nunca perder
 * un registro de inventario) — lo marca `cancelado` y devuelve las unidades
 * al stock, dentro de la misma transacción. Una venta cancelada deja de
 * contar en `obtenerResumenVentas`, pero sigue visible en el historial.
 */
export async function anularVenta(movimientoId: number) {
  return prisma.$transaction(async (tx) => {
    const movimiento = await tx.movimiento.findUnique({ where: { id: movimientoId } });
    if (!movimiento) {
      throw new MovimientoNoEncontradoError();
    }
    if (movimiento.tipo !== TipoMovimiento.VENTA) {
      throw new MovimientoNoEsVentaError();
    }
    if (movimiento.cancelado) {
      throw new MovimientoYaCanceladoError();
    }

    const movimientoActualizado = await tx.movimiento.update({
      where: { id: movimientoId },
      data: { cancelado: true },
    });

    const productoActualizado = await tx.product.update({
      where: { id: movimiento.productoId },
      data: { stock: { increment: movimiento.cantidad } },
    });

    return { producto: productoActualizado, movimiento: movimientoActualizado };
  });
}

export interface TotalPeriodo {
  pesos: number;
  unidades: number;
}

export interface ResumenVentas {
  ultimos15Dias: TotalPeriodo;
  esteMes: TotalPeriodo;
}

async function totalVentasDesde(fecha: Date): Promise<TotalPeriodo> {
  const resultado = await prisma.movimiento.aggregate({
    where: { tipo: TipoMovimiento.VENTA, cancelado: false, fecha: { gte: fecha } },
    _sum: { total: true, cantidad: true },
  });

  return {
    pesos: resultado._sum.total ?? 0,
    unidades: resultado._sum.cantidad ?? 0,
  };
}

/**
 * "Últimos 15 días" es una ventana móvil (ahora - 15 días), no una quincena
 * de calendario (1-15 / 16-fin de mes). "Este mes" sí es de calendario: desde
 * el día 1 del mes actual.
 */
export async function obtenerResumenVentas(): Promise<ResumenVentas> {
  const ahora = new Date();

  const hace15Dias = new Date(ahora);
  hace15Dias.setDate(hace15Dias.getDate() - 15);

  const inicioDeMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

  const [ultimos15Dias, esteMes] = await Promise.all([
    totalVentasDesde(hace15Dias),
    totalVentasDesde(inicioDeMes),
  ]);

  return { ultimos15Dias, esteMes };
}
