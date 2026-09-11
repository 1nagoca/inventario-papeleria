import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";

const backendDir = path.resolve(__dirname, "..");
const testDbFiles = ["test.db", "test.db-journal", "test.db-wal", "test.db-shm"].map((f) =>
  path.join(backendDir, f),
);

function limpiarArchivosDePrueba() {
  for (const archivo of testDbFiles) {
    if (existsSync(archivo)) unlinkSync(archivo);
  }
}

export default function setup() {
  limpiarArchivosDePrueba();
  execSync("npx prisma migrate deploy", {
    cwd: backendDir,
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "inherit",
  });

  return limpiarArchivosDePrueba;
}
