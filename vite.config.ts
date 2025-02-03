import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import { ManifestV3Export } from '@crxjs/vite-plugin';

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: "Happy Message Extension",
  version: "1.0",
  description: "Click to see a happy message!",
  action: {
    default_popup: "src/popup.html",
    default_icon: {
      "16": "public/vite.svg",
      "48": "public/vite.svg",
      "128": "public/vite.svg"
    }
  },
  background: {
    service_worker: "src/background.ts",
    type: "module" as const
  },
  permissions: ["storage"]
};

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
