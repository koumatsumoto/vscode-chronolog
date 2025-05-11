// vite.config.mts
import { defineConfig } from "vite";
import { library } from "vite-plugin-lib";

export default defineConfig({
  plugins: [
    ...library({
      entry: "src/extension.ts",
      formats: ["cjs"],
      bundle: {
        exclude: ["vscode", "fs", "path", "os", "crypto"],
      },
      cleanup: true,
    }),
  ],
  build: {
    lib: {
      entry: "src/extension.ts",
      formats: ["cjs"],
      fileName: "extension.js",
    },
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      external: ["vscode", "fs", "path", "os", "crypto"],
      output: {},
    },
    minify: process.env.NODE_ENV === "production",
    target: "node16",
    emptyOutDir: false,
  },
});
