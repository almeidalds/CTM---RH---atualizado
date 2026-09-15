import tailwindcss from "@tailwindcss/vite";
import { powerApps } from "@microsoft/power-apps-vite/plugin";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  // Power Apps hospeda o build em um caminho próprio. Assets absolutos (/) podem
  // gerar tela branca; caminhos relativos funcionam tanto localmente quanto no host.
  base: "./",

  plugins: [react(), tailwindcss(), powerApps()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    host: "0.0.0.0",
    port: 3000,
  },

  preview: {
    host: "0.0.0.0",
    port: 4173,
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
