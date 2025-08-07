
import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Détecter la plateforme
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppMode = (window.navigator as any).standalone === true;

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsInstalled(isInStandaloneMode || isInWebAppMode);

    // Vérifier si l'utilisateur a déjà dismissed le prompt récemment
    const dismissedTime = localStorage.getItem('pwa-dismissed');
    const shouldShowPrompt = !dismissedTime || 
      (Date.now() - parseInt(dismissedTime)) > (7 * 24 * 60 * 60 * 1000); // 7 jours

    // Écouter l'événement beforeinstallprompt (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA Install prompt available');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      if (!isInstalled && shouldShowPrompt) {
        setShowPrompt(true);
      }
    };

    // Écouter l'installation de l'app
    const handleAppInstalled = () => {
      console.log('PWA installed');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Pour iOS, afficher le prompt si pas installé
    if (isIOSDevice && !isInstalled && shouldShowPrompt) {
      setTimeout(() => setShowPrompt(true), 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log(`PWA install outcome: ${outcome}`);
        
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setShowPrompt(false);
        }
      } catch (error) {
        console.error('Error showing install prompt:', error);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-dismissed', Date.now().toString());
  };

  // Ne pas afficher si déjà installé ou pas de prompt disponible
  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <Card className="shadow-lg border-2 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Smartphone className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Installer SendFlow
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                {isIOS 
                  ? "Appuyez sur le bouton de partage et sélectionnez 'Sur l'écran d'accueil'"
                  : "Installez l'application pour un accès rapide et une utilisation hors ligne"
                }
              </p>
              <div className="flex gap-2">
                {!isIOS && deferredPrompt && (
                  <Button
                    onClick={handleInstallClick}
                    size="sm"
                    className="h-8 px-3 text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Installer
                  </Button>
                )}
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-gray-500"
                >
                  Plus tard
                </Button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
