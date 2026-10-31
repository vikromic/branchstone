import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Deliberately independent of vite.config.js: that file owns the MPA build and
// dev document routing (exercised end-to-end by tests/dev-routing.test.js).
export default defineConfig({
  plugins: [react()],
  test: {
    include: ["tests/**/*.test.{js,jsx}"],
    environment: "node",
    setupFiles: ["tests/support/setup.js"],
  },
});
