import "dotenv/config";
import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import { requireAppPassword } from "./middleware/requireAppPassword";
import { authRouter } from "./routes/auth.routes";
import {
  entriesRouter,
  movementsRouter,
  salesRouter,
} from "./routes/movimientos.routes";
import { productsRouter } from "./routes/products.routes";
import { whatsappRouter } from "./routes/whatsapp.routes";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(cors());

// Webhook de WhatsApp: va ANTES de express.json() porque la firma de Meta se
// comprueba sobre el cuerpo crudo, y sin requireAppPassword porque Meta no
// tiene la clave (lo protegen la firma y la lista de números autorizados).
app.use("/api/whatsapp", whatsappRouter);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", requireAppPassword, authRouter);
app.use("/api/products", requireAppPassword, productsRouter);
app.use("/api/sales", requireAppPassword, salesRouter);
app.use("/api/entries", requireAppPassword, entriesRouter);
app.use("/api/movements", requireAppPassword, movementsRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Backend escuchando en http://localhost:${port}`);
});
