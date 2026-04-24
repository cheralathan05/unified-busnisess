import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/test/api.e2e.test.ts"],
    environment: "node",
    globals: false,
    testTimeout: 45000,
    hookTimeout: 45000,
    isolate: true,
  },
});
