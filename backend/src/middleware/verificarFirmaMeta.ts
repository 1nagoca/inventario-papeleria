import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

/**
 * Protege el webhook de WhatsApp. Meta no conoce APP_PASSWORD, así que esta
 * ruta no usa requireAppPassword: en su lugar, Meta firma cada petición con el
 * App Secret (HMAC-SHA256 del cuerpo, en el header X-Hub-Signature-256) y aquí
 * se comprueba. Sin META_APP_SECRET configurado, o sin firma válida, se rechaza.
 *
 * Necesita el cuerpo crudo (express.raw), porque la firma se calcula sobre los
 * bytes exactos que envió Meta; si la firma es válida deja en req.body el JSON.
 */
export function verificarFirmaMeta(req: Request, res: Response, next: NextFunction) {
  const secreto = process.env.META_APP_SECRET;
  const firmaRecibida = req.header("x-hub-signature-256");

  if (!secreto || !firmaRecibida || !Buffer.isBuffer(req.body)) {
    res.status(401).json({ error: "Firma no válida." });
    return;
  }

  const firmaEsperada = `sha256=${createHmac("sha256", secreto).update(req.body).digest("hex")}`;
  const recibida = Buffer.from(firmaRecibida);
  const esperada = Buffer.from(firmaEsperada);

  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) {
    res.status(401).json({ error: "Firma no válida." });
    return;
  }

  try {
    req.body = JSON.parse(req.body.toString("utf8"));
  } catch {
    res.status(400).json({ error: "Datos inválidos." });
    return;
  }
  next();
}
