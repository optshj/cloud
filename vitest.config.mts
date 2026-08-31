import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    // e2e/는 Playwright 전용 — vitest 기본 include(`*.spec.ts`)와 겹쳐서 명시적으로 제외한다.
    // Route Handler(app/api/**/route.ts)는 src/ 밖에 있어 app/도 함께 포함한다.
    include: ["src/**/*.test.{ts,tsx}", "app/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
