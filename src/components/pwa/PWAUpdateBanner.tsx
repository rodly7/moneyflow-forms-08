import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { pwaUpdateService } from '@/services/pwaUpdateService';

export const PWAUpdateBanner: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    // Vérifier les mises à jour au démarrage
    const checkUpdates = async () => {
      const hasUpdate = await pwaUpdateService.checkForUpdates();
      if (hasUpdate) {
        setShowUpdate(true);
      }
    };

    checkUpdates();

    // Écouter les nouvelles mises à jour
    const unsubscribe = pwaUpdateService.onUpdateAvailable(() => {
      setShowUpdate(true);
    });

    return unsubscribe;
  }, []);

  const handleUpdate = async () => {
    await pwaUpdateService.installUpdate();
    setShowUpdate(false);
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <Card className="shadow-lg border-2 border-primary/20 bg-gradient-primary text-white">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold mb-1">
                Mise à jour disponible
              </h3>
              <p className="text-xs opacity-90 mb-3">
                Une nouvelle version de SendFlow est prête à être installée.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleUpdate}
                  size="sm"
                  variant="secondary"
                  className="h-8 px-3 text-xs bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Mettre à jour
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