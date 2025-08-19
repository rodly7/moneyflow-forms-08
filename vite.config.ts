
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';
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
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // CRITICAL: Force everything into a single bundle - absolutely NO code splitting
        inlineDynamicImports: true,
        // Use simple naming to prevent any chunk creation
        entryFileNames: 'index.js',
        chunkFileNames: 'chunk.js',
        assetFileNames: 'assets/[name].[ext]'
      },
      // Prevent any external dependencies from being treated as dynamic
      external: [],
      // Force tree-shaking to be disabled to prevent splitting
      treeshake: false,
    },
    // CRITICAL: Disable ALL code splitting mechanisms
    cssCodeSplit: false,
    // Set a very high chunk size limit to prevent splitting
    chunkSizeWarningLimit: 50000,
    // Target modern browsers but avoid splitting
    target: 'esnext',
    // Disable minification in development to help with debugging
    minify: mode === 'production' ? 'esbuild' : false,
    // Force sourcemap generation for debugging
    sourcemap: mode === 'development',
  },
  // Force all dependencies to be bundled - NO externals
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react'
    ],
    force: true,
    // Prevent any dynamic imports during optimization
    esbuildOptions: {
      splitting: false,
    },
  },
  // Prevent any dynamic imports at build time
  define: {
    __DYNAMIC_IMPORTS_DISABLED__: true,
  },
  // Ensure no worker or web worker splitting
  worker: {
    format: 'iife' as const,
    plugins: () => [],
  },
}));
