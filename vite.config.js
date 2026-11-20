import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev mode, send each /api path to the local service that owns it
// (`npm run server` starts all five), the same way nginx does in Docker.
const service = (port) => ({
  target: `http://localhost:${port}`,
  changeOrigin: true,
  headers: { "bypass-tunnel-reminder": "true" },
});

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    open: true,
    proxy: {
      "/api/register": service(4001),
      "/api/login": service(4001),
      "/api/admin/users": service(4001),
      "/api/tasks": service(4002),
      "/api/quizzes": service(4003),
      "/api/scores": service(4003),
      "/api/admin/quizzes": service(4003),
      "/api/progress": service(4004),
      "/api/ai": service(4005),
    },
  },
  build: {
    outDir: "dist",
  },
});
