import "dotenv/config";
import { prisma } from "../src/db/prisma";

const productosIniciales = [
  { nombre: "Lápiz", precio: 500, stock: 50 },
  { nombre: "Lapicero", precio: 1000, stock: 30 },
  { nombre: "Cuaderno", precio: 5000, stock: 20 },
  { nombre: "Borrador", precio: 500, stock: 25 },
  { nombre: "Resma de papel", precio: 15000, stock: 10 },
];

async function main() {
  for (const producto of productosIniciales) {
    await prisma.product.upsert({
      where: { nombre: producto.nombre },
      update: {},
      create: producto,
    });
  }
  console.log(`Seed completado: ${productosIniciales.length} productos.`);
}

main()
  .catch((error) => {
    console.error("Error en el seed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
