
import { useAuth } from '@/contexts/AuthContext';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { PWAInstallPrompt } from './pwa/PWAInstallPrompt';
import { OfflineIndicator } from './pwa/OfflineIndicator';
import { PWAOptimizedLayout } from './pwa/PWAOptimizedLayout';

const Layout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Basic viewport configuration
    const setViewport = () => {
      let viewport = document.querySelector('meta[name=viewport]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        document.head.appendChild(viewport);
      }
      
      viewport.setAttribute(
        'content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    };

    const setFullScreenVars = () => {
      const innerHeight = window.innerHeight;
      const innerWidth = window.innerWidth;
      
      document.documentElement.style.setProperty('--vh', `${innerHeight * 0.01}px`);
      document.documentElement.style.setProperty('--vw', `${innerWidth * 0.01}px`);
      document.documentElement.style.setProperty('--app-height', `${innerHeight}px`);
      document.documentElement.style.setProperty('--app-width', `${innerWidth}px`);
    };

    setViewport();
    setFullScreenVars();

    // Basic layout styles
    document.documentElement.style.height = '100%';
    document.documentElement.style.width = '100%';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.height = '100%';
    document.body.style.width = '100%';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';

    const root = document.getElementById('root');
    if (root) {
      root.style.height = '100vh';
      root.style.width = '100vw';
      root.style.margin = '0';
      root.style.padding = '0';
      root.style.position = 'relative';
      root.style.overflow = 'hidden';
    }

    // Resize handler
    const handleResize = () => {
      setFullScreenVars();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Service Worker registration
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      }).then((registration) => {
        console.log('SW registered:', registration.scope);
      }).catch((error) => {
        console.error('SW registration failed:', error);
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  if (loading) {
    return (
      <PWAOptimizedLayout className="full-screen-app">
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="text-center p-8 animate-fade-in">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-blue-800">SendFlow</p>
              <p className="text-sm text-blue-600">Chargement de votre application...</p>
            </div>
          </div>
        </div>
      </PWAOptimizedLayout>
    );
  }

  // Authentication routing
  if (!user) {
    if (location.pathname !== '/auth') {
      return <Navigate to="/auth" state={{ from: location }} replace />;
    }
  } else {
    if (location.pathname === '/auth') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return (
    <PWAOptimizedLayout className="full-screen-app">
      <div className="flex flex-col h-full w-full">
        <OfflineIndicator />
        <main className="flex-1 w-full min-h-0">
          <Outlet />
        </main>
        <Toaster />
        <PWAInstallPrompt />
      </div>
    </PWAOptimizedLayout>
  );
};

export default Layout;
