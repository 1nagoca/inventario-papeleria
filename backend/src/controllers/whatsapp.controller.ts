import type { Request, Response } from "express";
import { z } from "zod";
import { bot } from "../services/whatsappBot.service";
import { enviarTexto } from "../services/whatsappCliente";

const VARIABLES_NECESARIAS = [
  "WHATSAPP_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_NUMEROS_AUTORIZADOS",
  "ANTHROPIC_API_KEY",
];

// Meta envía muchos más campos (y otros tipos de aviso, como "entregado" o
// "leído", que llegan sin `messages`); solo se valida lo que se usa.
const webhookSchema = z.object({
  entry: z.array(
    z.object({
      changes: z.array(
        z.object({
          value: z.object({
            messages: z
              .array(
                z.object({
                  id: z.string(),
                  from: z.string(),
                  timestamp: z.string(),
                  type: z.string(),
                  text: z.object({ body: z.string() }).optional(),
                }),
              )
              .optional(),
          }),
        }),
      ),
    }),
  ),
});

const TIPOS_NO_ESCRITOS = new Set([
  "audio",
  "image",
  "video",
  "document",
  "sticker",
  "location",
  "contacts",
]);

// Meta reintenta un mensaje si la respuesta tarda (por ejemplo cuando Render
// estaba dormido), así que el mismo mensaje puede llegar más de una vez.
const MAXIMO_IDS_RECORDADOS = 500;
const mensajesYaAtendidos = new Set<string>();

function yaFueAtendido(id: string): boolean {
  if (mensajesYaAtendidos.has(id)) return true;
  mensajesYaAtendidos.add(id);
  if (mensajesYaAtendidos.size > MAXIMO_IDS_RECORDADOS) {
    const masAntiguo = mensajesYaAtendidos.values().next().value!;
    mensajesYaAtendidos.delete(masAntiguo);
  }
  return false;
}

function numerosAutorizados(): Set<string> {
  return new Set(
    (process.env.WHATSAPP_NUMEROS_AUTORIZADOS ?? "")
      .split(",")
      .map((numero) => numero.replace(/\D/g, ""))
      .filter((numero) => numero.length > 0),
  );
}

/** Verificación inicial: Meta llama una vez por GET al configurar el webhook. */
export function verificarWebhook(req: Request, res: Response) {
  const tokenEsperado = process.env.WHATSAPP_VERIFY_TOKEN;
  const reto = req.query["hub.challenge"];

  if (
    !tokenEsperado ||
    req.query["hub.mode"] !== "subscribe" ||
    req.query["hub.verify_token"] !== tokenEsperado ||
    typeof reto !== "string"
  ) {
    res.sendStatus(403);
    return;
  }
  res.type("text/plain").send(reto);
}

export async function recibirWebhook(req: Request, res: Response) {
  const faltantes = VARIABLES_NECESARIAS.filter((nombre) => !process.env[nombre]);
  if (faltantes.length > 0) {
    console.error(`WhatsApp: faltan variables de entorno: ${faltantes.join(", ")}`);
    res.sendStatus(503);
    return;
  }

  const datos = webhookSchema.safeParse(req.body);
  if (!datos.success) {
    // Aviso de Meta con otra forma: se da por recibido y no se hace nada.
    res.sendStatus(200);
    return;
  }

  const autorizados = numerosAutorizados();
  const mensajes = datos.data.entry
    .flatMap((entrada) => entrada.changes)
    .flatMap((cambio) => cambio.value.messages ?? []);

  for (const mensaje of mensajes) {
    if (!autorizados.has(mensaje.from)) {
      console.warn(`WhatsApp: mensaje ignorado de un número no autorizado (${mensaje.from}).`);
      continue;
    }
    if (yaFueAtendido(mensaje.id)) continue;

    try {
      if (mensaje.type === "text" && mensaje.text) {
        const respuesta = await bot.procesarMensaje({
          telefono: mensaje.from,
          texto: mensaje.text.body,
          fecha: new Date(Number(mensaje.timestamp) * 1000),
        });
        await enviarTexto(mensaje.from, respuesta);
      } else if (TIPOS_NO_ESCRITOS.has(mensaje.type)) {
        await enviarTexto(
          mensaje.from,
          'Por ahora solo entiendo mensajes escritos. Escríbeme algo como: "vendí 3 lápices y 1 cuaderno".',
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Siempre 200: si se respondiera con error, Meta reenviaría el mensaje.
  res.sendStatus(200);
}
