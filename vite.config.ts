import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["reactflow", "dagre"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (id.includes("reactflow") || id.includes("dagre")) {
            return "flow-core";
          }

          if (id.includes("@radix-ui")) {
            return "radix-ui";
          }

          if (
            id.includes("react-router-dom") ||
            id.includes("@tanstack/react-query") ||
            id.includes("axios")
          ) {
            return "app-core";
          }

          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/")
          ) {
            return "react-vendor";
          }

          return undefined;
        },
      },
    },
  },
}));
