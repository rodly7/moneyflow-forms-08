
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
        // Disable dynamic imports completely
        inlineDynamicImports: true,
      },
    },
    // Increase chunk size limit to prevent any splitting
    chunkSizeWarningLimit: 10000,
    // Disable code splitting completely
    target: 'esnext',
    minify: false, // Disable minification in development to help with debugging
  },
  // Ensure no pre-bundling issues
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    force: true,
  },
}));
