
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { DollarSign, CheckCircle, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MoneyNotificationProps {
  amount: number;
  currency: string;
  senderName?: string;
  senderPhone?: string;
  onClose?: () => void;
  onView?: () => void;
  isVisible: boolean;
  userPhone?: string;
}

export const EnhancedMoneyNotification = ({
  amount,
  currency,
  senderName,
  senderPhone,
  onClose,
  onView,
  isVisible,
  userPhone
}: MoneyNotificationProps) => {
  const { isSmallMobile } = useDeviceDetection();
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsShowing(true);
      // Vibration pour attirer l'attention
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsShowing(false);
    setTimeout(() => onClose?.(), 300);
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isVisible && !isShowing) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300",
          isShowing ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />
      
      {/* Notification principale */}
      <div 
        className={cn(
          "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50",
          "transition-all duration-300 ease-out",
          isShowing ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
      >
        <div className={cn(
          "money-notification notification-enhanced",
          "relative overflow-hidden",
          "mx-4 max-w-sm w-full",
          isSmallMobile ? "p-6" : "p-8"
        )}>
          {/* Animation de fond */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-green-500 to-emerald-500 opacity-90"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent animate-pulse"></div>
          
          {/* Contenu */}
          <div className="relative z-10">
            {/* Header avec bouton fermer */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <span className={cn(
                  "text-white font-bold",
                  isSmallMobile ? "text-sm" : "text-base"
                )}>
                  Argent reçu
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-white hover:bg-white/20 p-1 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Montant principal */}
            <div className="text-center mb-6">
              <div className={cn(
                "text-white font-black mb-2",
                isSmallMobile ? "text-3xl" : "text-4xl"
              )}>
                {formatAmount(amount, currency)}
              </div>
              <div className="flex items-center justify-center gap-1 text-white/90">
                <CheckCircle className="w-4 h-4" />
                <span className={isSmallMobile ? "text-sm" : "text-base"}>
                  Crédit effectué avec succès
                </span>
              </div>
            </div>

            {/* Informations expéditeur */}
            {(senderName || senderPhone) && (
              <div className="bg-white/15 rounded-xl p-4 mb-6">
                <div className="text-white/80 text-sm mb-1">Expéditeur:</div>
                {senderName && (
                  <div className="text-white font-semibold text-base">
                    {senderName}
                  </div>
                )}
                {senderPhone && (
                  <div className="text-white/90 text-sm flex items-center gap-1">
                    <Smartphone className="w-3 h-3" />
                    {senderPhone}
                  </div>
                )}
              </div>
            )}

            {/* Informations destinataire */}
            {userPhone && (
              <div className="bg-white/15 rounded-xl p-4 mb-6">
                <div className="text-white/80 text-sm mb-1">Reçu sur:</div>
                <div className="text-white font-semibold text-base flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  {userPhone}
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className={cn(
              "flex gap-3",
              isSmallMobile ? "flex-col" : "flex-row"
            )}>
              <Button
                onClick={onView}
                variant="secondary"
                size="lg"
                className={cn(
                  "flex-1 bg-white text-green-700 hover:bg-white/90",
                  "font-bold text-base h-12",
                  "shadow-lg border-0"
                )}
              >
                Voir les détails
              </Button>
              <Button
                onClick={handleClose}
                variant="ghost"
                size="lg"
                className={cn(
                  "flex-1 text-white hover:bg-white/20",
                  "font-semibold text-base h-12",
                  "border-2 border-white/30"
                )}
              >
                Fermer
              </Button>
            </div>

            {/* Timestamp */}
            <div className="text-center text-white/70 text-xs mt-4">
              {new Date().toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
