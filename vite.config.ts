
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
        // Remove manualChunks as it's incompatible with inlineDynamicImports
        inlineDynamicImports: true,
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      },
      // Prevent any external dependencies from being treated as dynamic
      external: [],
    },
    // Disable CSS code splitting completely
    cssCodeSplit: false,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 5000,
    // Target modern browsers to avoid compatibility issues
    target: 'esnext',
    // Disable minification in development to help with debugging
    minify: mode === 'production' ? 'esbuild' : false,
  },
  // Force all dependencies to be bundled
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react'
    ],
    force: true,
  },
  // Prevent any dynamic imports
  define: {
    __DYNAMIC_IMPORTS_DISABLED__: true,
  },
}));
