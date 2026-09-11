import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: "./tests/globalSetup.ts",
    env: {
      DATABASE_URL: "file:./test.db",
    },
  },
});
