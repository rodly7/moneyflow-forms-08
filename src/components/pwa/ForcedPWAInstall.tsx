import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { useIsMobile } from '@/hooks/use-mobile';

export const ForcedPWAInstall: React.FC = () => {
  const { isInstalled, isInstallable, installApp } = usePWA();
  const isMobile = useIsMobile();
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showForced, setShowForced] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Force l'affichage sur mobile si pas installé
    if (isMobile && !isInstalled) {
      // Délai pour laisser le temps au PWA hook de se charger
      setTimeout(() => setShowForced(true), 2000);
    }
  }, [isMobile, isInstalled]);

  const handleInstall = async () => {
    if (isInstallable && !isIOS) {
      try {
        await installApp();
        setShowForced(false);
      } catch (error) {
        console.error('Erreur lors de l\'installation:', error);
      }
    }
  };

  // Si déjà installé ou pas sur mobile, ne rien afficher
  if (isInstalled || !isMobile || !showForced) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl border-2 border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-primary to-primary-glow rounded-full w-16 h-16 flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl font-bold text-center">
            Installation Requise
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Pour une meilleure expérience, installez SendFlow sur votre appareil
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Accès hors ligne</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Notifications push</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Performances optimisées</span>
            </div>
          </div>

          {isIOS && (
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Instructions pour iOS
              </h4>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>1. Appuyez sur le bouton Partager ⬆️</li>
                <li>2. Sélectionnez "Sur l'écran d'accueil"</li>
                <li>3. Appuyez sur "Ajouter"</li>
              </ol>
            </div>
          )}

          {isAndroid && isInstallable && (
            <Button 
              onClick={handleInstall}
              className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-white font-semibold py-3"
            >
              <Download className="w-5 h-5 mr-2" />
              Installer l'Application
            </Button>
          )}

          {isAndroid && !isInstallable && (
            <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Instructions pour Android
              </h4>
              <ol className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                <li>1. Ouvrez le menu du navigateur (⋮)</li>
                <li>2. Sélectionnez "Ajouter à l'écran d'accueil"</li>
                <li>3. Confirmez l'installation</li>
              </ol>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              L'installation est nécessaire pour accéder à toutes les fonctionnalités de SendFlow
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};