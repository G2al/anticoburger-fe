import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.{ts,tsx}"],
    // Il dispositivo dei test è volutamente in un fuso diverso da Europe/Rome.
    env: {
      TZ: "America/Los_Angeles",
      NEXT_PUBLIC_API_BASE_URL: "http://api.test/api/v1",
    },
    restoreMocks: true,
  },
});
