// vitest.config.ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["__tests__/helpers/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        ".next/**",
        "coverage/**",
        "**/*.d.ts",
        "**/*.config.*",
        "prisma/**",
        "__tests__/**",
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
      },
    },
    include: ["__tests__/unit/**/*.test.ts", "__tests__/integration/**/*.test.ts"],
    exclude: ["node_modules", ".next", "__tests__/e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
