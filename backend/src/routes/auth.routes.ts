import { Router } from "express";

export const authRouter = Router();

authRouter.get("/verify", (_req, res) => {
  res.json({ ok: true });
});
