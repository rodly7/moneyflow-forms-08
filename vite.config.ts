
import { defineConfig, type ConfigEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }: ConfigEnv) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
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
        // Force everything into a single bundle - NO code splitting
        manualChunks: () => 'everything',
        inlineDynamicImports: false, // Changed to false since we're using manualChunks
        entryFileNames: 'index.js',
        chunkFileNames: 'index.js', 
        assetFileNames: 'assets/[name][extname]',
      },
      external: [],
      treeshake: false,
      preserveEntrySignatures: "strict" as const,
    },
    minify: false,
    target: 'esnext',
    chunkSizeWarningLimit: 50000,
    sourcemap: false,
    cssCodeSplit: false,
    // Force single file output
    assetsInlineLimit: 0,
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
