
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
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
        // Disable code splitting completely
        manualChunks: undefined,
        inlineDynamicImports: true,
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 2000,
    // Target modern browsers to avoid compatibility issues
    target: 'esnext',
    // Disable minification to help with debugging in development
    minify: mode === 'production' ? 'esbuild' : false,
  },
  // Ensure consistent dependency handling
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
  define: {
    // This helps prevent dynamic import issues
    __DYNAMIC_IMPORTS_DISABLED__: true,
  },
}));
