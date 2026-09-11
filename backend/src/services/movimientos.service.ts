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
