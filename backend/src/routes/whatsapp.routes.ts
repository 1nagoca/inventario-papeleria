import express, { Router } from "express";
import { recibirWebhook, verificarWebhook } from "../controllers/whatsapp.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { verificarFirmaMeta } from "../middleware/verificarFirmaMeta";

export const whatsappRouter = Router();
whatsappRouter.get("/webhook", verificarWebhook);
whatsappRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  verificarFirmaMeta,
  asyncHandler(recibirWebhook),
);
