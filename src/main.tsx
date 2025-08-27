
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import App from './App.tsx';
import './index.css';
import './styles/agent-mobile.css';

console.log('main.tsx: React imported:', React);
console.log('main.tsx: React version:', React.version);

// CRITICAL: Ensure React is globally available for @tanstack/react-query
if (typeof window !== 'undefined') {
  (window as any).React = React;
  (window as any).__REACT__ = React;
}

// Also make React available globally for module resolution
(globalThis as any).React = React;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

console.log('main.tsx: Creating root and rendering app');

// Clear any cached modules that might have null React references
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      if (name.includes('vite') || name.includes('deps')) {
        caches.delete(name);
      }
    });
  });
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
