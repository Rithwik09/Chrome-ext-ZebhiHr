import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    target: "esnext",
    rollupOptions: {
      input: {
        popup: "src/popup.html",
        background: "src/background.ts"
      },
      output: {
        entryFileNames: "[name].js" // Ensures it outputs `background.js`
      }
    }
  }
});
