
import { useState, useEffect } from 'react';

interface PWAStatus {
  isInstalled: boolean;
  isInstallable: boolean;
  isOffline: boolean;
  installPrompt: any;
}

export const usePWA = () => {
  const [pwaStatus, setPWAStatus] = useState<PWAStatus>({
    isInstalled: false,
    isInstallable: false,
    isOffline: false,
    installPrompt: null
  });

  useEffect(() => {
    // Vérifier si l'app est installée
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isInstalled = isStandalone || isInWebAppiOS;

    // Vérifier le statut de connexion
    const isOffline = !navigator.onLine;

    setPWAStatus(prev => ({
      ...prev,
      isInstalled,
      isOffline
    }));

    // Écouter les événements de connexion
    const handleOnline = () => {
      setPWAStatus(prev => ({ ...prev, isOffline: false }));
    };

    const handleOffline = () => {
      setPWAStatus(prev => ({ ...prev, isOffline: true }));
    };

    // Écouter l'événement d'installation
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPWAStatus(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: e
      }));
    };

    const handleAppInstalled = () => {
      setPWAStatus(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPrompt: null
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (pwaStatus.installPrompt) {
      try {
        pwaStatus.installPrompt.prompt();
        const { outcome } = await pwaStatus.installPrompt.userChoice;
        
        if (outcome === 'accepted') {
          setPWAStatus(prev => ({
            ...prev,
            isInstallable: false,
            installPrompt: null
          }));
        }
      } catch (error) {
        console.error('Error installing PWA:', error);
      }
    }
  };

  return {
    ...pwaStatus,
    installApp
  };
};
