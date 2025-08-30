import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Download, Smartphone, Share, Plus } from 'lucide-react';

interface ForcedPWAInstallProps {
  onInstallComplete: () => void;
}

const ForcedPWAInstall = ({ onInstallComplete }: ForcedPWAInstallProps) => {
  const { isInstalled, isInstallable, installApp } = usePWA();
  const isMobile = useIsMobile();
  const [showForced, setShowForced] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Détecter le type d'appareil
    const userAgent = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent));
    setIsAndroid(/Android/.test(userAgent));

    // Vérifier si on doit forcer l'installation
    if (isMobile && !isInstalled) {
      // Délai pour laisser le temps aux événements PWA de se déclencher
      const timer = setTimeout(() => {
        setShowForced(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isInstalled) {
      onInstallComplete();
    }
  }, [isMobile, isInstalled, onInstallComplete]);

  const handleInstall = async () => {
    if (isInstallable && !isIOS) {
      await installApp();
      setShowForced(false);
      onInstallComplete();
    }
  };

  const handleManualInstall = () => {
    // Pour les cas où l'installation manuelle est confirmée
    setShowForced(false);
    onInstallComplete();
  };

  if (!showForced || isInstalled) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Installation requise</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p className="mb-4">
              Pour une meilleure sécurité et une expérience optimale, vous devez installer l'application SendFlow sur votre téléphone.
            </p>
            
            <div className="bg-primary/5 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-sm mb-2">Avantages de l'installation :</h4>
              <ul className="text-xs space-y-1 text-left">
                <li>• Accès hors ligne</li>
                <li>• Notifications sécurisées</li>
                <li>• Interface optimisée</li>
                <li>• Authentification biométrique</li>
              </ul>
            </div>
          </div>

          {isAndroid ? (
            <>
              {isInstallable ? (
                <Button onClick={handleInstall} className="w-full" size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Installer l'application
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-center text-muted-foreground">
                    Pour installer l'application :
                  </p>
                  <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">1</span>
                      Appuyez sur le menu (⋮) en haut à droite
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">2</span>
                      Sélectionnez "Ajouter à l'écran d'accueil"
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">3</span>
                      Confirmez l'installation
                    </div>
                  </div>
                  <Button onClick={handleManualInstall} variant="outline" className="w-full">
                    J'ai installé l'application
                  </Button>
                </div>
              )}
            </>
          ) : isIOS ? (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Pour installer l'application sur iOS :
              </p>
              <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center text-sm">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">1</span>
                  <Share className="w-4 h-4 mr-1" />
                  Appuyez sur le bouton Partager
                </div>
                <div className="flex items-center text-sm">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">2</span>
                  <Plus className="w-4 h-4 mr-1" />
                  Sélectionnez "Sur l'écran d'accueil"
                </div>
                <div className="flex items-center text-sm">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">3</span>
                  Confirmez en appuyant sur "Ajouter"
                </div>
              </div>
              <Button onClick={handleManualInstall} variant="outline" className="w-full">
                J'ai installé l'application
              </Button>
            </div>
          ) : (
            <Button onClick={handleManualInstall} className="w-full" size="lg">
              Continuer
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForcedPWAInstall;