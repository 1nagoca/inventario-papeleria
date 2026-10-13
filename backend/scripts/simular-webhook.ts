// Prueba el webhook de WhatsApp sin WhatsApp: levanta la ruta en un puerto
// temporal y le envía mensajes con el mismo formato y la misma firma que usa
// Meta. Las respuestas del bot no salen a internet: se capturan y se muestran.
//
//   npm run bot:simular-webhook
//
// Nunca responde "sí", así que no registra ninguna venta. Para que la venta de
// ejemplo se interprete de verdad necesita ANTHROPIC_API_KEY y DATABASE_URL en
// .env; sin eso, la seguridad del webhook se prueba igual.
import "dotenv/config";
import { createHmac } from "node:crypto";
import type { AddressInfo } from "node:net";
import express from "express";
import { prisma } from "../src/db/prisma";
import { whatsappRouter } from "../src/routes/whatsapp.routes";

const AUTORIZADO = "573000000001";
const DESCONOCIDO = "573999999999";
const SECRETO = "secreto-de-prueba";
const TOKEN_DE_VERIFICACION = "token-de-prueba";

// Valores de prueba solo para este proceso: no se usa ningún dato real de Meta.
process.env.META_APP_SECRET = SECRETO;
process.env.WHATSAPP_VERIFY_TOKEN = TOKEN_DE_VERIFICACION;
process.env.WHATSAPP_TOKEN = "token-falso";
process.env.WHATSAPP_PHONE_NUMBER_ID = "000000000000000";
process.env.WHATSAPP_NUMEROS_AUTORIZADOS = "+57 300 000 0001, 573000000002";
const hayClaveDeClaude = Boolean(process.env.ANTHROPIC_API_KEY);
process.env.ANTHROPIC_API_KEY ??= "clave-falsa";

const respuestasDelBot: string[] = [];
const fetchOriginal = globalThis.fetch;
globalThis.fetch = async (entrada, opciones) => {
  const url = entrada instanceof Request ? entrada.url : String(entrada);
  if (!url.startsWith("https://graph.facebook.com/")) return fetchOriginal(entrada, opciones);
  respuestasDelBot.push(JSON.parse(String(opciones?.body)).text.body);
  return new Response("{}", { status: 200 });
};

let fallas = 0;
function comprobar(descripcion: string, correcto: boolean, detalle = "") {
  if (!correcto) fallas += 1;
  console.log(`${correcto ? "✅" : "❌"} ${descripcion}${detalle ? `\n     ${detalle}` : ""}`);
}

let contador = 0;
function mensajeDeMeta(from: string, contenido: object, id = `wamid.prueba-${++contador}`) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "0",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              messages: [{ from, id, timestamp: String(Math.floor(Date.now() / 1000)), ...contenido }],
            },
          },
        ],
      },
    ],
  };
}

const texto = (body: string) => ({ type: "text", text: { body } });

async function main() {
  const app = express();
  app.use("/api/whatsapp", whatsappRouter);
  const servidor = app.listen(0);
  const base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}/api/whatsapp/webhook`;

  async function enviar(cuerpo: object, firma?: string) {
    const crudo = JSON.stringify(cuerpo);
    const firmaValida = `sha256=${createHmac("sha256", SECRETO).update(crudo).digest("hex")}`;
    respuestasDelBot.length = 0;
    const respuesta = await fetchOriginal(base, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(firma === "ninguna" ? {} : { "X-Hub-Signature-256": firma ?? firmaValida }),
      },
      body: crudo,
    });
    return { status: respuesta.status, respuestas: [...respuestasDelBot] };
  }

  console.log("Verificación del webhook (GET)");
  let r = await fetchOriginal(
    `${base}?hub.mode=subscribe&hub.verify_token=${TOKEN_DE_VERIFICACION}&hub.challenge=12345`,
  );
  comprobar("con el token correcto devuelve el reto", r.status === 200 && (await r.text()) === "12345");
  r = await fetchOriginal(`${base}?hub.mode=subscribe&hub.verify_token=otro&hub.challenge=12345`);
  comprobar("con un token equivocado responde 403", r.status === 403);

  console.log("\nFirma de Meta (POST)");
  let resultado = await enviar(mensajeDeMeta(AUTORIZADO, texto("hola")), "ninguna");
  comprobar("sin firma responde 401 y el bot no contesta", resultado.status === 401 && resultado.respuestas.length === 0);
  resultado = await enviar(mensajeDeMeta(AUTORIZADO, texto("hola")), `sha256=${"0".repeat(64)}`);
  comprobar("con firma falsa responde 401 y el bot no contesta", resultado.status === 401 && resultado.respuestas.length === 0);

  console.log("\nQuién puede escribirle al bot");
  resultado = await enviar(mensajeDeMeta(DESCONOCIDO, texto("vendí 3 lápices")));
  comprobar("un número no autorizado se ignora en silencio", resultado.status === 200 && resultado.respuestas.length === 0);

  console.log("\nMensajes de un número autorizado");
  resultado = await enviar(mensajeDeMeta(AUTORIZADO, { type: "audio", audio: { id: "1" } }));
  comprobar(
    "a un audio responde que solo entiende texto",
    resultado.respuestas.length === 1 && resultado.respuestas[0].includes("solo entiendo mensajes escritos"),
    resultado.respuestas[0],
  );

  resultado = await enviar({
    object: "whatsapp_business_account",
    entry: [{ id: "0", changes: [{ field: "messages", value: { statuses: [{ id: "x", status: "read" }] } }] }],
  });
  comprobar('un aviso de "leído" no genera respuesta', resultado.status === 200 && resultado.respuestas.length === 0);

  const venta = mensajeDeMeta(AUTORIZADO, texto("hoy vendí 2 lápices"), "wamid.venta-de-prueba");
  resultado = await enviar(venta);
  const respuestaVenta = resultado.respuestas[0] ?? "";
  if (respuestaVenta.startsWith("Voy a registrar")) {
    comprobar('"hoy vendí 2 lápices" pide confirmación', true, respuestaVenta);
  } else {
    comprobar(
      '"hoy vendí 2 lápices" recibe una respuesta (sin pedir confirmación)',
      resultado.respuestas.length === 1,
      `${respuestaVenta}\n     ${hayClaveDeClaude ? "Revisa ANTHROPIC_API_KEY y DATABASE_URL en .env." : "Falta ANTHROPIC_API_KEY en .env: la IA no se probó."}`,
    );
  }

  resultado = await enviar(venta);
  comprobar("el mismo mensaje entregado dos veces no se atiende dos veces", resultado.status === 200 && resultado.respuestas.length === 0);

  resultado = await enviar(mensajeDeMeta(AUTORIZADO, texto("no")));
  comprobar('"no" recibe respuesta y no registra nada', resultado.respuestas.length === 1, resultado.respuestas[0]);

  servidor.close();
  console.log(fallas === 0 ? "\nTodo bien." : `\n${fallas} comprobación(es) fallaron.`);
  process.exitCode = fallas === 0 ? 0 : 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
