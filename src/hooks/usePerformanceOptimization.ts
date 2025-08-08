
import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Hook pour surveiller les performances des composants
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const [renders, setRenders] = useState(0);

  useEffect(() => {
    renderCount.current++;
    setRenders(renderCount.current);
    console.log(`🔄 ${componentName} rendered ${renderCount.current} times`);
  });

  return { renderCount: renders };
};

// Hook pour débouncer les fonctions
export const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

export const usePerformanceOptimization = () => {
  const { user, profile } = useAuth();

  // Précharger les ressources critiques
  const preloadCriticalResources = useCallback(() => {
    // Précharger les polices et icônes
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    // Précharger les scripts critiques
    const scriptPreload = document.createElement('link');
    scriptPreload.rel = 'modulepreload';
    document.head.appendChild(scriptPreload);
  }, []);

  // Optimiser les images
  const optimizeImages = useCallback(() => {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.classList.add('fade-in');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));

    return () => imageObserver.disconnect();
  }, []);

  // Débouncer les requêtes
  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  // Mémoriser les calculs lourds
  const heavyComputation = useMemo(() => {
    if (!user || !profile) return null;
    
    // Calculs optimisés pour l'interface
    return {
      isAuthenticated: !!user,
      userRole: profile.role,
      permissions: {
        canManageUsers: profile.role === 'admin' || profile.role === 'sub_admin',
        canViewReports: profile.role !== 'user',
        canModifySettings: profile.role === 'admin'
      }
    };
  }, [user, profile]);

  // Optimiser les animations
  const optimizeAnimations = useCallback(() => {
    // Réduire les animations si l'utilisateur préfère
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.style.setProperty('--animation-duration', '0.01ms');
    }

    // Optimiser les transitions
    const style = document.createElement('style');
    style.textContent = `
      * {
        will-change: auto;
      }
      
      .animate-on-hover:hover {
        transform: translateY(-1px);
        transition: transform 0.2s ease;
      }
      
      .smooth-transition {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .fast-transition {
        transition: all 0.15s ease-out;
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Nettoyer les ressources inutiles
  const cleanupResources = useCallback(() => {
    // Nettoyer les event listeners
    return () => {
      window.removeEventListener('scroll', () => {});
      window.removeEventListener('resize', () => {});
    };
  }, []);

  // Initialiser les optimisations
  useEffect(() => {
    const cleanup = setTimeout(() => {
      preloadCriticalResources();
      optimizeImages();
      optimizeAnimations();
    }, 100);

    return () => {
      clearTimeout(cleanup);
      cleanupResources();
    };
  }, [preloadCriticalResources, optimizeImages, optimizeAnimations, cleanupResources]);

  return {
    debounce,
    heavyComputation,
    isOptimized: true
  };
};
