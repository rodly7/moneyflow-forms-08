
import { defineConfig, type ConfigEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }: ConfigEnv) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // FORCE everything into a single file - NO exceptions
        inlineDynamicImports: true,
        manualChunks: undefined, // Disable manual chunking completely
        entryFileNames: 'index.js',
        chunkFileNames: 'index.js', 
        assetFileNames: 'assets/[name][extname]',
      },
      external: [],
      treeshake: false,
      // Prevent any form of code splitting
      preserveEntrySignatures: false,
    },
    minify: false,
    target: 'esnext',
    chunkSizeWarningLimit: 50000, // Increase limit significantly
    sourcemap: false,
    // Disable CSS code splitting completely
    cssCodeSplit: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@tanstack/react-query'],
    force: true,
    esbuildOptions: {
      // Prevent any splitting during optimization
      splitting: false,
    },
  },
  define: {
    global: 'globalThis',
  },
  worker: {
    format: 'iife' as const,
    plugins: () => [],
  },
  // Force single entry point
  esbuild: {
    splitting: false,
  },
}));
