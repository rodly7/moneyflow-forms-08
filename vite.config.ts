
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Force everything into a single bundle - NO code splitting whatsoever
        manualChunks: () => 'everything',
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
    minify: false,
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
});
