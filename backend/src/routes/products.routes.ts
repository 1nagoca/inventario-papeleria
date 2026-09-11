import { Router } from "express";
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  listarProductos,
} from "../controllers/products.controller";
import { asyncHandler } from "../middleware/asyncHandler";

export const productsRouter = Router();

productsRouter.get("/", asyncHandler(listarProductos));
productsRouter.post("/", asyncHandler(crearProducto));
productsRouter.put("/:id", asyncHandler(actualizarProducto));
productsRouter.delete("/:id", asyncHandler(eliminarProducto));
