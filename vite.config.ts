
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
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Force everything into a single chunk to prevent dynamic imports
        manualChunks: () => 'everything.js',
        // Ensure no dynamic imports are created
        inlineDynamicImports: false,
        format: 'es'
      }
    },
    // Increase chunk size limit significantly
    chunkSizeWarningLimit: 5000,
    // Ensure source maps for better debugging
    sourcemap: true,
    // Optimize dependencies
    commonjsOptions: {
      include: [/node_modules/]
    }
  },
  // Optimize dependencies to prevent dynamic import issues
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react'
    ],
    exclude: []
  }
}));
