const VERSION_API_META = "v23.0";

/** Envía un mensaje de texto por la WhatsApp Cloud API de Meta. */
export async function enviarTexto(telefono: string, texto: string): Promise<void> {
  const url = `https://graph.facebook.com/${VERSION_API_META}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const respuesta = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: telefono,
      type: "text",
      text: { body: texto },
    }),
  });

  if (!respuesta.ok) {
    throw new Error(`Meta rechazó el envío (${respuesta.status}): ${await respuesta.text()}`);
  }
}
