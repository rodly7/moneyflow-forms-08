
import { useAuth } from '@/contexts/AuthContext';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { PWAInstallPrompt } from './pwa/PWAInstallPrompt';
import { OfflineIndicator } from './pwa/OfflineIndicator';
import { PWAOptimizedLayout } from './pwa/PWAOptimizedLayout';

const Layout = () => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('Layout mounting, current path:', location.pathname);
    console.log('User:', user ? 'authenticated' : 'not authenticated');
    console.log('Loading:', loading);

    // Aggressive cache and service worker cleanup
    const clearAllCaches = async () => {
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          console.log('Layout: Found caches:', cacheNames);
          
          // Clear all caches
          await Promise.all(cacheNames.map(async (cacheName) => {
            await caches.delete(cacheName);
            console.log('Layout: Cleared cache:', cacheName);
          }));
          
          console.log('Layout: All caches cleared successfully');
        } catch (error) {
          console.error('Layout: Cache clearing failed:', error);
        }
      }
    };

    // Clear all service worker registrations
    const clearServiceWorkers = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(registration => {
            console.log('Layout: Unregistering SW:', registration.scope);
            return registration.unregister();
          }));
          console.log('Layout: All service workers unregistered');
        } catch (error) {
          console.error('Layout: Service worker clearing failed:', error);
        }
      }
    };

    // Performance monitoring with proper type checking
    const monitorPerformance = () => {
      if ('performance' in window && window.performance.getEntriesByType) {
        const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        resources.forEach(entry => {
          if (entry.transferSize && entry.decodedBodySize) {
            console.log(`Resource: ${entry.name}, Transfer: ${entry.transferSize}, Decoded: ${entry.decodedBodySize}`);
          }
        });
      }
    };

    // Run cache and SW clearing
    clearAllCaches();
    clearServiceWorkers();
    monitorPerformance();

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
    document.body.style.height = '100%';
    document.body.style.width = '100%';
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    const root = document.getElementById('root');
    if (root) {
      root.style.height = '100vh';
      root.style.width = '100vw';
      root.style.margin = '0';
      root.style.padding = '0';
      root.style.position = 'relative';
    }

    // Resize handler
    const handleResize = () => {
      setFullScreenVars();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [location.pathname]);

  console.log('Layout rendering, loading:', loading, 'user:', !!user);

  if (loading) {
    console.log('Layout: Showing loading screen');
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
    console.log('Layout: No user, redirecting to auth');
    if (location.pathname !== '/auth') {
      return <Navigate to="/auth" state={{ from: location }} replace />;
    }
  } else {
    console.log('Layout: User found, checking if on auth page');
    if (location.pathname === '/auth') {
      // Redirect based on user role from profile
      if (profile?.role) {
        const role = profile.role;
        if (role === 'merchant') {
          return <Navigate to="/merchant" replace />;
        } else if (role === 'admin') {
          return <Navigate to="/admin-dashboard" replace />;
        } else if (role === 'sub_admin') {
          return <Navigate to="/sub-admin-dashboard" replace />;
        } else if (role === 'agent') {
          return <Navigate to="/agent-dashboard" replace />;
        } else {
          return <Navigate to="/dashboard" replace />;
        }
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  console.log('Layout: Rendering main layout with Outlet');

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
