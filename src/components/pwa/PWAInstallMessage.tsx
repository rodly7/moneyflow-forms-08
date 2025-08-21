
import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Apple, Chrome, Shield, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';

interface PWAInstallMessageProps {
  onContinue: () => void;
}

export const PWAInstallMessage: React.FC<PWAInstallMessageProps> = ({ onContinue }) => {
  const { isInstalled, isInstallable, installApp } = usePWA();
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
  }, []);

  const handleInstallClick = () => {
    if (isInstallable && !isIOS) {
      installApp();
    } else {
      setShowInstructions(true);
    }
  };

  const handleContinueAnyway = () => {
    onContinue();
  };

  if (isInstalled) {
    onContinue();
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border-2 border-primary/20 bg-card/95 backdrop-blur-sm">
        <CardContent className="p-8 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center mb-6">
            <Smartphone className="w-10 h-10 text-primary-foreground" />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground">
              📱 Installation requise
            </h2>
            <p className="text-lg text-muted-foreground">
              Pour une meilleure expérience et sécurité, veuillez installer SendFlow sur votre téléphone
            </p>
          </div>

          <div className="bg-primary/5 p-6 rounded-xl border border-primary/20 space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <Shield className="w-6 h-6" />
              <span className="font-semibold">Pourquoi installer l'app ?</span>
            </div>
            
            <div className="space-y-3 text-sm text-muted-foreground text-left">
              <div className="flex items-start gap-3">
                <Star className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <span>Accès rapide depuis votre écran d'accueil</span>
              </div>
              <div className="flex items-start gap-3">
                <Star className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <span>Notifications push pour vos transactions</span>
              </div>
              <div className="flex items-start gap-3">
                <Star className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <span>Fonctionne même sans connexion internet</span>
              </div>
              <div className="flex items-start gap-3">
                <Star className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <span>Sécurité renforcée pour vos données</span>
              </div>
            </div>
          </div>

          {!showInstructions ? (
            <div className="space-y-4">
              {isInstallable && !isIOS ? (
                <Button
                  onClick={handleInstallClick}
                  className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-lg"
                >
                  <Download className="mr-3 h-6 w-6" />
                  Installer maintenant
                </Button>
              ) : (
                <Button
                  onClick={handleInstallClick}
                  className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-lg"
                >
                  {isIOS ? <Apple className="mr-3 h-6 w-6" /> : <Chrome className="mr-3 h-6 w-6" />}
                  Voir les instructions
                </Button>
              )}
              
              <Button
                onClick={handleContinueAnyway}
                variant="outline"
                className="w-full h-12 border-2"
              >
                Continuer sans installer (non recommandé)
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-xl border space-y-4 text-left">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  {isIOS ? <Apple className="w-5 h-5" /> : <Chrome className="w-5 h-5" />}
                  Instructions d'installation
                </h3>
                
                {isIOS ? (
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Appuyez sur le bouton de <strong>partage</strong> 📤 en bas de Safari</li>
                    <li>Faites défiler et sélectionnez <strong>"Sur l'écran d'accueil"</strong></li>
                    <li>Appuyez sur <strong>"Ajouter"</strong> pour confirmer</li>
                    <li>L'icône SendFlow apparaîtra sur votre écran d'accueil</li>
                  </ol>
                ) : (
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Appuyez sur le menu <strong>⋮</strong> (trois points) de Chrome</li>
                    <li>Sélectionnez <strong>"Ajouter à l'écran d'accueil"</strong></li>
                    <li>Appuyez sur <strong>"Ajouter"</strong> pour confirmer</li>
                    <li>L'icône SendFlow apparaîtra sur votre écran d'accueil</li>
                  </ol>
                )}
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={handleContinueAnyway}
                  className="w-full h-12 bg-primary text-primary-foreground"
                >
                  J'ai installé l'application
                </Button>
                <Button
                  onClick={handleContinueAnyway}
                  variant="ghost"
                  className="w-full text-muted-foreground"
                >
                  Continuer sans installer
                </Button>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            💡 L'installation ne prend que quelques secondes et améliore considérablement votre expérience
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
