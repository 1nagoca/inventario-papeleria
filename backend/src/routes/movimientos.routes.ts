import { Router } from "express";
import {
  crearEntrada,
  crearVenta,
  listarMovimientos,
} from "../controllers/movimientos.controller";
import { asyncHandler } from "../middleware/asyncHandler";

export const salesRouter = Router();
salesRouter.post("/", asyncHandler(crearVenta));

export const entriesRouter = Router();
entriesRouter.post("/", asyncHandler(crearEntrada));

export const movementsRouter = Router();
movementsRouter.get("/", asyncHandler(listarMovimientos));
