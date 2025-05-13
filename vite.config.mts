// vite.config.mts
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: "src/extension.ts",
      formats: ["cjs"],
      fileName: "extension.js",
    },
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      external: ["vscode", "node:fs", "node:path", "node:os", "node:crypto"],
      output: {
        entryFileNames: "extension.js",
      },
    },
    minify: process.env.NODE_ENV === "production",
    target: "node16",
    emptyOutDir: false,
  },
});
