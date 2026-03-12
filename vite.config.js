import base44 from "@base44/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  logLevel: "error",

  server: {
    host: true,
    port: 5173,
    strictPort: false,
    allowedHosts: "all",
    hmr: {
      protocol: "wss",
      clientPort: 443
    }
  },

  preview: {
    host: true,
    port: 5173
  },

  plugins: [
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === "true",
      hmrNotifier: true,
      navigationNotifier: true,
      visualEditAgent: true
    }),
    react()
  ],

  optimizeDeps: {
    include: ["react", "react-dom"]
  },

  build: {
    target: "esnext"
  }
});