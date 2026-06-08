import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    open: true,
    proxy: {
      // In dev mode: proxy /api to local Express server
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        headers: { "bypass-tunnel-reminder": "true" },
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
