// Chat de prueba en la terminal: escribes como si fueras la abuela y ves lo
// que respondería el bot, sin WhatsApp de por medio.
//
//   npm run bot:simular                  -> NO registra nada (modo de prueba)
//   npm run bot:simular -- --registrar   -> registra ventas de verdad
//
// Usa la IA real (necesita ANTHROPIC_API_KEY en .env) y los productos reales
// de la base de datos a la que apunte DATABASE_URL.
import "dotenv/config";
import { createInterface } from "node:readline";
import { prisma } from "../src/db/prisma";
import { interpretarMensaje } from "../src/services/interpreteVentas.service";
import { registrarVenta } from "../src/services/movimientos.service";
import { crearBot, listarProductosParaBot } from "../src/services/whatsappBot.service";

const registrarDeVerdad = process.argv.includes("--registrar");
const TELEFONO_DE_PRUEBA = "570000000000";

// En modo de prueba solo se lee la base (productos y precios): no se toca el
// stock ni se crea ningún movimiento.
async function registrarVentaSimulada({
  productoId,
  cantidad,
}: {
  productoId: number;
  cantidad: number;
}) {
  const producto = await prisma.product.findUniqueOrThrow({ where: { id: productoId } });
  console.log(`   [modo de prueba: aquí se registraría ${cantidad} x ${producto.nombre}]`);
  return { movimiento: { total: producto.precio * cantidad } };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Falta ANTHROPIC_API_KEY en backend/.env (ver README, sección del bot de WhatsApp).");
    process.exit(1);
  }

  const bot = crearBot({
    listarProductos: listarProductosParaBot,
    interpretar: interpretarMensaje,
    registrarVenta: registrarDeVerdad ? registrarVenta : registrarVentaSimulada,
  });

  const productos = (await listarProductosParaBot()).filter((p) => !p.descontinuado);
  console.log("Simulador del bot de WhatsApp");
  console.log(
    registrarDeVerdad
      ? "ATENCIÓN: las ventas que confirmes SÍ se registran en la base de datos."
      : "Modo de prueba: no se registra nada, aunque respondas sí.",
  );
  console.log(`Productos: ${productos.map((p) => `${p.nombre} (${p.stock})`).join(", ")}`);
  console.log('Escribe un mensaje y presiona Enter. Para terminar escribe "salir".\n');

  const terminal = createInterface({ input: process.stdin, output: process.stdout, prompt: "Tú: " });
  terminal.prompt();
  for await (const linea of terminal) {
    if (linea.trim().toLowerCase() === "salir") break;
    const respuesta = await bot.procesarMensaje({
      telefono: TELEFONO_DE_PRUEBA,
      texto: linea,
      fecha: new Date(),
    });
    console.log(`Bot: ${respuesta}\n`);
    terminal.prompt();
  }
  terminal.close();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
