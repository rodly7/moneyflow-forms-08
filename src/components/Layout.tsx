
import { useAuth } from '@/contexts/AuthContext';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { PWAInstallPrompt } from './pwa/PWAInstallPrompt';
import { OfflineIndicator } from './pwa/OfflineIndicator';

const Layout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Configuration basique du viewport pour PWA
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

    setViewport();

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
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 pt-[30px]">
        <div className="text-center p-8 animate-fade-in">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-blue-800">SendFlow</p>
            <p className="text-sm text-blue-600">Chargement de votre application...</p>
          </div>
        </div>
      </div>
    );
  }

  // Authentication routing
  if (!user) {
    if (location.pathname !== '/auth' && location.pathname !== '/agent-auth') {
      return <Navigate to="/auth" state={{ from: location }} replace />;
    }
  } else {
    if (location.pathname === '/auth' || location.pathname === '/agent-auth') {
      // Rediriger selon le rôle
      if (user.user_metadata?.role === 'agent') {
        return <Navigate to="/agent-dashboard" replace />;
      } else if (user.user_metadata?.role === 'admin') {
        return <Navigate to="/main-admin-dashboard" replace />;
      } else if (user.user_metadata?.role === 'sub_admin') {
        return <Navigate to="/sub-admin-dashboard" replace />;
      } else {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return (
    <>
      <OfflineIndicator />
      <main className="w-full">
        <Outlet />
      </main>
      <Toaster />
      <PWAInstallPrompt />
    </>
  );
};

export default Layout;
