import type { NextFunction, Request, Response } from "express";

export function requireAppPassword(req: Request, res: Response, next: NextFunction) {
  const claveEsperada = process.env.APP_PASSWORD;
  const claveRecibida = req.header("x-app-password");

  if (!claveEsperada || claveRecibida !== claveEsperada) {
    res.status(401).json({ error: "Clave incorrecta o no proporcionada." });
    return;
  }

  next();
}
