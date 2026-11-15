import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const workspaceRoot = fileURLToPath(new URL("../", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(workspaceRoot, "frontend/src"),
      "@legacy": resolve(workspaceRoot, "assets"),
      "@adminLegacy": resolve(workspaceRoot, "admin"),
      "@ownerLegacy": resolve(workspaceRoot, "owner"),
    },
  },
  server: {
    allowedHosts: ["workspace-ojhfyypi.v0.build","sb-19o5zu0ynrfe.vercel.run"],
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
