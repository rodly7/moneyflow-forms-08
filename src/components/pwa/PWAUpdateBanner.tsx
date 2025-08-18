
import React, { useState, useEffect } from 'react';
import { RefreshCw, X, Wifi } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { pwaUpdateService } from '@/services/pwaUpdateService';

export const PWAUpdateBanner: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    
    // Vérifier les mises à jour au démarrage
    const initialCheck = async () => {
      console.log('🔍 Vérification initiale des mises à jour...');
      const hasUpdate = await pwaUpdateService.checkForUpdates();
      if (hasUpdate) {
        setShowUpdate(true);
      }
    };

    initialCheck();

    // Vérifier périodiquement toutes les 30 secondes pour détecter rapidement les mises à jour
    checkInterval = setInterval(async () => {
      if (!showUpdate) { // Ne vérifier que si aucune mise à jour n'est déjà affichée
        const hasUpdate = await pwaUpdateService.checkForUpdates();
        if (hasUpdate) {
          console.log('🎉 Nouvelle mise à jour détectée via vérification périodique !');
          setShowUpdate(true);
        }
      }
    }, 30000); // 30 secondes

    // Écouter les nouvelles mises à jour
    const unsubscribe = pwaUpdateService.onUpdateAvailable(() => {
      console.log('🎉 Nouvelle mise à jour détectée via événement !');
      setShowUpdate(true);
    });

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      unsubscribe();
    };
  }, [showUpdate]);

  const handleUpdate = async () => {
    setIsChecking(true);
    try {
      await pwaUpdateService.installUpdate();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      // Fallback: reload simple
      window.location.reload();
    }
    setIsChecking(false);
    setShowUpdate(false);
  };

  const handleForceCheck = async () => {
    setIsChecking(true);
    try {
      const hasUpdate = await pwaUpdateService.forceUpdateCheck();
      if (hasUpdate) {
        setShowUpdate(true);
      } else {
        // Afficher temporairement un message
        console.log('Aucune mise à jour trouvée');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification forcée:', error);
    }
    setIsChecking(false);
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) {
    // Afficher un petit bouton pour forcer la vérification
    return (
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          onClick={handleForceCheck}
          disabled={isChecking}
          size="sm"
          variant="outline"
          className="h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm border-primary/20 hover:bg-primary/10"
        >
          {isChecking ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Wifi className="w-4 h-4" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <Card className="shadow-lg border-2 border-primary/20 bg-gradient-primary text-white animate-in slide-in-from-bottom-4">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold mb-1">
                Mise à jour disponible !
              </h3>
              <p className="text-xs opacity-90 mb-3">
                Une nouvelle version de SendFlow est prête. Redémarrez pour profiter des améliorations.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleUpdate}
                  disabled={isChecking}
                  size="sm"
                  variant="secondary"
                  className="h-8 px-3 text-xs bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  {isChecking ? (
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3 mr-1" />
                  )}
                  {isChecking ? 'Installation...' : 'Installer'}
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-white/80 hover:text-white hover:bg-white/10"
                >
                  Plus tard
                </Button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-white/80 hover:text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
