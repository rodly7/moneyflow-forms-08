
import React from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export const OfflineIndicator: React.FC = () => {
  const { isOffline } = usePWA();

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 shadow-lg">
      <div className="flex items-center justify-center gap-2 text-sm font-medium">
        <WifiOff className="w-4 h-4" />
        <span>Mode hors ligne - Fonctionnalités limitées</span>
      </div>
    </div>
  );
};

// Composant pour afficher le statut de connexion dans la barre de statut (optionnel)
export const ConnectionStatus: React.FC = () => {
  const { isOffline } = usePWA();

  return (
    <div className={cn(
      "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
      isOffline 
        ? "bg-red-100 text-red-700" 
        : "bg-green-100 text-green-700"
    )}>
      {isOffline ? (
        <>
          <WifiOff className="w-3 h-3" />
          <span>Hors ligne</span>
        </>
      ) : (
        <>
          <Wifi className="w-3 h-3" />
          <span>En ligne</span>
        </>
      )}
    </div>
  );
};
