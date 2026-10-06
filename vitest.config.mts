import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws outside React Server Components; in tests it's a no-op.
      "server-only": fileURLToPath(new URL("./test/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      include: ["src/features/**/*.ts", "src/server/**/*.ts"],
      thresholds: {
        // CLAUDE.md §4: the grade engine must be fully covered by worked examples.
        "src/features/grades/engine/**": { statements: 100, branches: 100, functions: 100, lines: 100 },
      },
    },
  },
});
