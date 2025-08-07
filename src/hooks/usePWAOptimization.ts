
import { useState, useEffect, useCallback } from 'react';

interface PWAOptimization {
  isOnline: boolean;
  connectionSpeed: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  batteryLevel?: number;
  isLowPowerMode: boolean;
}

export const usePWAOptimization = () => {
  const [optimization, setOptimization] = useState<PWAOptimization>({
    isOnline: navigator.onLine,
    connectionSpeed: 'unknown',
    deviceType: 'desktop',
    isLowPowerMode: false
  });

  // Détecter le type d'appareil
  const detectDeviceType = useCallback((): 'mobile' | 'tablet' | 'desktop' => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }, []);

  // Détecter la vitesse de connexion
  const detectConnectionSpeed = useCallback((): string => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      if (connection.effectiveType) {
        return connection.effectiveType; // '4g', '3g', '2g', 'slow-2g'
      }
      if (connection.downlink) {
        if (connection.downlink > 10) return '4g';
        if (connection.downlink > 1.5) return '3g';
        return '2g';
      }
    }
    return 'unknown';
  }, []);

  // Détecter le mode économie d'énergie
  const detectLowPowerMode = useCallback((): boolean => {
    // Approximation basée sur certains indicateurs
    const connection = (navigator as any).connection;
    if (connection && connection.saveData) return true;
    
    // Vérifier la batterie si disponible
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        if (battery.level < 0.2) {
          setOptimization(prev => ({ ...prev, isLowPowerMode: true }));
        }
      });
    }
    
    return false;
  }, []);

  useEffect(() => {
    const updateOptimization = () => {
      setOptimization({
        isOnline: navigator.onLine,
        connectionSpeed: detectConnectionSpeed(),
        deviceType: detectDeviceType(),
        isLowPowerMode: detectLowPowerMode()
      });
    };

    // Initialiser
    updateOptimization();

    // Écouter les changements de connexion
    const handleOnline = () => setOptimization(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setOptimization(prev => ({ ...prev, isOnline: false }));
    
    // Écouter les changements de taille d'écran
    const handleResize = () => {
      setOptimization(prev => ({ ...prev, deviceType: detectDeviceType() }));
    };

    // Écouter les changements de connexion réseau
    const connection = (navigator as any).connection;
    const handleConnectionChange = () => {
      setOptimization(prev => ({ 
        ...prev, 
        connectionSpeed: detectConnectionSpeed(),
        isLowPowerMode: detectLowPowerMode()
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('resize', handleResize);
    
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('resize', handleResize);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [detectDeviceType, detectConnectionSpeed, detectLowPowerMode]);

  // Fonctions utilitaires pour l'optimisation
  const shouldReduceAnimations = useCallback(() => {
    return optimization.isLowPowerMode || 
           optimization.connectionSpeed === '2g' || 
           optimization.connectionSpeed === 'slow-2g';
  }, [optimization.isLowPowerMode, optimization.connectionSpeed]);

  const shouldPreloadImages = useCallback(() => {
    return optimization.isOnline && 
           optimization.connectionSpeed !== '2g' && 
           optimization.connectionSpeed !== 'slow-2g' &&
           !optimization.isLowPowerMode;
  }, [optimization.isOnline, optimization.connectionSpeed, optimization.isLowPowerMode]);

  const shouldUseReducedQuality = useCallback(() => {
    return optimization.connectionSpeed === '2g' || 
           optimization.connectionSpeed === 'slow-2g' ||
           optimization.isLowPowerMode;
  }, [optimization.connectionSpeed, optimization.isLowPowerMode]);

  const getOptimalUpdateInterval = useCallback(() => {
    if (!optimization.isOnline) return 0;
    if (optimization.isLowPowerMode) return 60000; // 1 minute
    if (optimization.connectionSpeed === 'slow-2g' || optimization.connectionSpeed === '2g') return 30000; // 30 secondes
    return 20000; // 20 secondes par défaut
  }, [optimization.isOnline, optimization.isLowPowerMode, optimization.connectionSpeed]);

  return {
    ...optimization,
    shouldReduceAnimations,
    shouldPreloadImages,
    shouldUseReducedQuality,
    getOptimalUpdateInterval
  };
};
