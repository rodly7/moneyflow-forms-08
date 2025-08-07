import React, { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';

export const PWAInstallBanner: React.FC = () => {
  const { isInstalled, isInstallable, installApp } = usePWA();
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Vérifier si l'utilisateur a déjà dismissed le banner
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    const shouldShow = !dismissed && !isInstalled && (isInstallable || isIOSDevice);
    
    if (shouldShow) {
      // Attendre 3 secondes avant d'afficher le banner
      setTimeout(() => setShowBanner(true), 3000);
    }
  }, [isInstalled, isInstallable]);

  const handleInstall = () => {
    if (isIOS) {
      // Pour iOS, afficher les instructions
      return;
    }
    installApp();
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  if (!showBanner || isInstalled) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-3 bg-gradient-primary text-white">
      <div className="flex items-center gap-3 max-w-md mx-auto">
        <div className="flex-shrink-0">
          <Download className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {isIOS 
              ? "Ajoutez SendFlow à votre écran d'accueil" 
              : "Installez l'application SendFlow"
            }
          </p>
          <p className="text-xs opacity-90">
            {isIOS 
              ? "Appuyez sur Partager puis 'Sur l'écran d'accueil'"
              : "Pour un accès rapide et une utilisation hors ligne"
            }
          </p>
        </div>
        <div className="flex gap-2">
          {!isIOS && (
            <Button
              onClick={handleInstall}
              variant="secondary"
              size="sm"
              className="h-8 px-3 text-xs bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              Installer
            </Button>
          )}
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};