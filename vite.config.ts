
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
        inlineDynamicImports: true,
        manualChunks: undefined,
        entryFileNames: 'index.js',
        chunkFileNames: 'index.js', 
        assetFileNames: 'assets/[name][extname]',
      },
      external: [],
      treeshake: false,
      preserveEntrySignatures: false,
    },
    minify: false,
    target: 'esnext',
    chunkSizeWarningLimit: 50000,
    sourcemap: false,
    cssCodeSplit: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@tanstack/react-query'],
    force: true,
  },
  define: {
    global: 'globalThis',
  },
  worker: {
    format: 'iife' as const,
    plugins: () => [],
  },
}));
