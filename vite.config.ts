
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
        // Completely disable code splitting
        manualChunks: () => 'everything.js',
        inlineDynamicImports: true,
        // Ensure no dynamic imports are created
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      },
      // Prevent any external dependencies from being treated as external
      external: []
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 5000,
    // Target modern browsers to avoid compatibility issues
    target: 'esnext',
    // Disable minification to help with debugging in development
    minify: mode === 'production' ? 'esbuild' : false,
    // Force single file output
    cssCodeSplit: false,
  },
  // Ensure consistent dependency handling
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query'
    ],
    force: true,
  },
  // Prevent any dynamic imports from being created
  define: {
    // This helps prevent dynamic import issues
    __DYNAMIC_IMPORTS_DISABLED__: true,
  },
  // Ensure no worker or web worker imports
  worker: {
    format: 'es',
    plugins: []
  }
}));
