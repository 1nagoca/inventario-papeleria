import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/db/prisma";
import {
  CantidadInvalidaError,
  ProductoNoEncontradoError,
  StockInsuficienteError,
  registrarEntrada,
  registrarVenta,
} from "../src/services/movimientos.service";

function crearProductoDePrueba(stock = 10) {
  return prisma.product.create({
    data: {
      nombre: `Producto de prueba ${Date.now()}-${Math.random()}`,
      precio: 1000,
      stock,
      stockMinimo: 5,
    },
  });
}

beforeEach(async () => {
  await prisma.movimiento.deleteMany();
  await prisma.product.deleteMany();
});

describe("registrarVenta", () => {
  it("descuenta el stock y crea un movimiento de tipo VENTA", async () => {
    const producto = await crearProductoDePrueba(10);

    const { producto: actualizado, movimiento } = await registrarVenta({
      productoId: producto.id,
      cantidad: 3,
    });

    expect(actualizado.stock).toBe(7);
    expect(movimiento.tipo).toBe("VENTA");
    expect(movimiento.cantidad).toBe(3);
    expect(movimiento.total).toBe(3000);
  });

  it("nunca deja el stock en negativo: rechaza una venta mayor al stock disponible y no cambia nada", async () => {
    const producto = await crearProductoDePrueba(5);

    await expect(registrarVenta({ productoId: producto.id, cantidad: 6 })).rejects.toThrow(
      StockInsuficienteError,
    );

    const sinCambios = await prisma.product.findUniqueOrThrow({ where: { id: producto.id } });
    expect(sinCambios.stock).toBe(5);

    const movimientos = await prisma.movimiento.findMany({ where: { productoId: producto.id } });
    expect(movimientos).toHaveLength(0);
  });

  it("permite vender exactamente el stock disponible, dejándolo en cero", async () => {
    const producto = await crearProductoDePrueba(4);

    const { producto: actualizado } = await registrarVenta({
      productoId: producto.id,
      cantidad: 4,
    });

    expect(actualizado.stock).toBe(0);
  });

  it("rechaza cantidades inválidas sin modificar el stock", async () => {
    const producto = await crearProductoDePrueba(10);

    await expect(registrarVenta({ productoId: producto.id, cantidad: 0 })).rejects.toThrow(
      CantidadInvalidaError,
    );
    await expect(registrarVenta({ productoId: producto.id, cantidad: -1 })).rejects.toThrow(
      CantidadInvalidaError,
    );
    await expect(registrarVenta({ productoId: producto.id, cantidad: 1.5 })).rejects.toThrow(
      CantidadInvalidaError,
    );

    const sinCambios = await prisma.product.findUniqueOrThrow({ where: { id: producto.id } });
    expect(sinCambios.stock).toBe(10);
  });

  it("rechaza un producto inexistente", async () => {
    await expect(registrarVenta({ productoId: 999999, cantidad: 1 })).rejects.toThrow(
      ProductoNoEncontradoError,
    );
  });
});

describe("registrarEntrada", () => {
  it("aumenta el stock y crea un movimiento de tipo ENTRADA", async () => {
    const producto = await crearProductoDePrueba(10);

    const { producto: actualizado, movimiento } = await registrarEntrada({
      productoId: producto.id,
      cantidad: 20,
    });

    expect(actualizado.stock).toBe(30);
    expect(movimiento.tipo).toBe("ENTRADA");
    expect(movimiento.cantidad).toBe(20);
  });

  it("no tiene un tope superior de cantidad", async () => {
    const producto = await crearProductoDePrueba(0);

    const { producto: actualizado } = await registrarEntrada({
      productoId: producto.id,
      cantidad: 1000,
    });

    expect(actualizado.stock).toBe(1000);
  });

  it("rechaza cantidades inválidas sin modificar el stock", async () => {
    const producto = await crearProductoDePrueba(10);

    await expect(registrarEntrada({ productoId: producto.id, cantidad: 0 })).rejects.toThrow(
      CantidadInvalidaError,
    );

    const sinCambios = await prisma.product.findUniqueOrThrow({ where: { id: producto.id } });
    expect(sinCambios.stock).toBe(10);
  });
});
