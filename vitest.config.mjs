import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "istanbul",
      reporter: ["lcov", "text"],
    },
  },
});
