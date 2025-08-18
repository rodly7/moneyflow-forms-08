
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
    console.log('Layout mounting, current path:', location.pathname);
    console.log('User:', user ? 'authenticated' : 'not authenticated');
    console.log('Loading:', loading);

    // Even more aggressive cache clearing in Layout
    const superAggressiveCacheClear = async () => {
      console.log('Layout: Starting super aggressive cache clearing...');
      
      try {
        // Clear all possible caches multiple times
        if ('caches' in window) {
          for (let i = 0; i < 3; i++) {
            const cacheNames = await caches.keys();
            if (cacheNames.length > 0) {
              console.log(`Layout: Clearing caches (attempt ${i + 1}):`, cacheNames);
              await Promise.all(cacheNames.map(async (cacheName) => {
                const deleted = await caches.delete(cacheName);
                console.log(`Layout: Cache ${cacheName} deleted:`, deleted);
              }));
            }
          }
        }

        // Force unregister all service workers multiple times
        if ('serviceWorker' in navigator) {
          for (let i = 0; i < 3; i++) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            if (registrations.length > 0) {
              console.log(`Layout: Unregistering SWs (attempt ${i + 1}):`, registrations.length);
              await Promise.all(registrations.map(async (registration) => {
                const unregistered = await registration.unregister();
                console.log(`Layout: SW unregistered:`, unregistered);
              }));
            }
          }
        }

        // Force reload if we detect any cached resources
        const performance = window.performance;
        if (performance && performance.getEntriesByType) {
          const resources = performance.getEntriesByType('resource');
          const cachedResources = resources.filter(resource => 
            resource.transferSize === 0 && resource.decodedBodySize > 0
          );
          
          if (cachedResources.length > 0) {
            console.log('Layout: Detected cached resources, forcing clean reload');
            window.location.reload();
            return;
          }
        }

        console.log('Layout: Super aggressive cache clearing completed');
      } catch (error) {
        console.error('Layout: Super aggressive cache clearing failed:', error);
      }
    };

    superAggressiveCacheClear();

    // Enhanced viewport and styling setup
    const setupViewportAndStyles = () => {
      // Force viewport
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

      // Set CSS variables for full screen
      const setFullScreenVars = () => {
        const innerHeight = window.innerHeight;
        const innerWidth = window.innerWidth;
        
        document.documentElement.style.setProperty('--vh', `${innerHeight * 0.01}px`);
        document.documentElement.style.setProperty('--vw', `${innerWidth * 0.01}px`);
        document.documentElement.style.setProperty('--app-height', `${innerHeight}px`);
        document.documentElement.style.setProperty('--app-width', `${innerWidth}px`);
      };

      setFullScreenVars();

      // Force full screen layout
      const elements = [document.documentElement, document.body];
      elements.forEach(element => {
        if (element) {
          element.style.height = '100%';
          element.style.width = '100%';
          element.style.margin = '0';
          element.style.padding = '0';
          element.style.overflow = 'hidden';
        }
      });

      const root = document.getElementById('root');
      if (root) {
        root.style.height = '100vh';
        root.style.width = '100vw';
        root.style.margin = '0';
        root.style.padding = '0';
        root.style.position = 'relative';
        root.style.overflow = 'auto';
      }

      // Resize handlers
      const handleResize = () => setFullScreenVars();
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    };

    const cleanup = setupViewportAndStyles();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [location.pathname]);

  console.log('Layout rendering, loading:', loading, 'user:', !!user);

  if (loading) {
    console.log('Layout: Showing enhanced loading screen');
    return (
      <PWAOptimizedLayout className="full-screen-app">
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="text-center p-8 animate-fade-in">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-blue-800">SendFlow</p>
              <p className="text-sm text-blue-600">Chargement sécurisé de votre application...</p>
              <p className="text-xs text-blue-500">Tous les composants sont préchargés</p>
            </div>
          </div>
        </div>
      </PWAOptimizedLayout>
    );
  }

  // Authentication routing
  if (!user) {
    console.log('Layout: No user, redirecting to auth');
    if (location.pathname !== '/auth') {
      return <Navigate to="/auth" state={{ from: location }} replace />;
    }
  } else {
    console.log('Layout: User found, checking if on auth page');
    if (location.pathname === '/auth') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  console.log('Layout: Rendering main layout with preloaded components');

  return (
    <PWAOptimizedLayout className="full-screen-app">
      <div className="flex flex-col h-full w-full overflow-auto">
        <OfflineIndicator />
        <main className="flex-1 w-full min-h-0 overflow-auto">
          <Outlet />
        </main>
        <Toaster />
        <PWAInstallPrompt />
      </div>
    </PWAOptimizedLayout>
  );
};

export default Layout;
