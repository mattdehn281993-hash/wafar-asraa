import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // In development, /api/* goes to the Wafar backend (wafar-backend/backend, `npm run dev`, port 8080).
  server: {
    proxy: {
      "/api": { target: "http://localhost:8080", changeOrigin: true, rewrite: path => path.replace(/^\/api/, "") },
    },
  },
});
