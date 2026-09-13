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

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(cors());
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
