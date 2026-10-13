import { defineConfig } from "vitest/config";

// Pruebas del bot de WhatsApp: no usan base de datos ni red (intérprete y
// registrarVenta simulados), así que no necesitan el globalSetup de la base.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/whatsappBot.test.ts"],
  },
});
