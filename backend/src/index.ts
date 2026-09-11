import "dotenv/config";
import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
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

app.use("/api/products", productsRouter);
app.use("/api/sales", salesRouter);
app.use("/api/entries", entriesRouter);
app.use("/api/movements", movementsRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Backend escuchando en http://localhost:${port}`);
});
