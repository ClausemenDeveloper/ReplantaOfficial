import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: "dist/spa",
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React chunks
          vendor: ["react", "react-dom", "react-router-dom"],
          // UI library chunks - only what we actually use
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-popover",
            "@radix-ui/react-tabs",
            "@radix-ui/react-select",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
            "lucide-react",
          ],
          // Form and validation chunks
          forms: [
            "react-hook-form",
            "@hookform/resolvers",
            "zod",
            "validator",
            "dompurify",
          ],
          // Animation and styling chunks
          animation: [
            "framer-motion",
            "tailwind-merge",
            "class-variance-authority",
            "clsx",
          ],
          // Query and state management
          query: ["@tanstack/react-query"],
          // Date utilities
          date: ["date-fns"],
        },
      },
    },
    // Optimize chunk sizes
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging in production
    sourcemap: mode === "development",
    // Minimize bundle size
    minify: mode === "production" ? "terser" : false,
    terserOptions:
      mode === "production"
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ["console.log", "console.debug"],
            },
          }
        : undefined,
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "framer-motion",
      "lucide-react",
      "@tanstack/react-query",
    ],
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}
