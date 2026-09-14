import { Router } from "express";
import {
  anularVentaController,
  crearEntrada,
  crearVenta,
  listarMovimientos,
  obtenerResumen,
} from "../controllers/movimientos.controller";
import { asyncHandler } from "../middleware/asyncHandler";

export const salesRouter = Router();
salesRouter.post("/", asyncHandler(crearVenta));

export const entriesRouter = Router();
entriesRouter.post("/", asyncHandler(crearEntrada));

export const movementsRouter = Router();
movementsRouter.get("/resumen", asyncHandler(obtenerResumen));
movementsRouter.post("/:id/anular", asyncHandler(anularVentaController));
movementsRouter.get("/", asyncHandler(listarMovimientos));
