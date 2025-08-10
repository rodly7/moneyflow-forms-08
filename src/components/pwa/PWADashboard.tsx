
import React from 'react';
import { usePWAOptimization } from '@/hooks/usePWAOptimization';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { PWAOptimizedLayout } from '@/components/pwa/PWAOptimizedLayout';
import { AdaptiveMobileLayout } from '@/components/mobile/AdaptiveMobileLayout';
import { AdaptiveActionGrid } from '@/components/mobile/AdaptiveActionGrid';
import { AdaptiveText } from '@/components/mobile/AdaptiveText';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  QrCode, 
  CreditCard, 
  Download, 
  Upload,
  Receipt,
  Settings,
  User,
  Bell
} from 'lucide-react';

interface PWADashboardProps {
  userBalance?: number;
  userName?: string;
  userPhone?: string;
}

export const PWADashboard = ({ 
  userBalance = 0, 
  userName = "Utilisateur",
  userPhone = "+221..."
}: PWADashboardProps) => {
  const { 
    isOnline, 
    deviceType, 
    shouldReduceAnimations,
    shouldUseReducedQuality 
  } = usePWAOptimization();
  
  const { 
    screenWidth, 
    screenHeight, 
    isPortrait,
    getAdaptiveSize,
    getResponsiveGrid
  } = useResponsiveLayout();

  // Actions principales adaptées PWA
  const mainActions = [
    {
      icon: Send,
      label: 'Envoyer',
      color: 'bg-blue-500 hover:bg-blue-600',
      route: '/transfer'
    },
    {
      icon: QrCode,
      label: 'QR Code',
      color: 'bg-green-500 hover:bg-green-600',
      route: '/qr-payment'
    },
    {
      icon: Download,
      label: 'Recevoir',
      color: 'bg-purple-500 hover:bg-purple-600',
      route: '/receive'
    },
    {
      icon: Upload,
      label: 'Retirer',
      color: 'bg-orange-500 hover:bg-orange-600',
      route: '/withdraw'
    }
  ];

  // Actions secondaires
  const secondaryActions = [
    {
      icon: CreditCard,
      label: 'Factures',
      route: '/bill-payments'
    },
    {
      icon: Receipt,
      label: 'Reçus',
      route: '/receipts'
    },
    {
      icon: Settings,
      label: 'Paramètres',
      route: '/settings'
    },
    {
      icon: Bell,
      label: 'Notifications',
      route: '/notifications'
    }
  ];

  const handleActionClick = (route: string) => {
    if (isOnline || route === '/qr-code' || route === '/settings') {
      window.location.href = route;
    } else {
      alert('Cette fonction nécessite une connexion internet');
    }
  };

  return (
    <PWAOptimizedLayout className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <AdaptiveMobileLayout>
        {/* Header PWA avec statut */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <AdaptiveText
                    variant="body"
                    className="font-semibold text-gray-900"
                  >
                    {userName}
                  </AdaptiveText>
                  <AdaptiveText
                    variant="small"
                    className="text-gray-500"
                  >
                    {userPhone}
                  </AdaptiveText>
                </div>
              </div>
              
              {/* Indicateur de connexion */}
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                isOnline 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {isOnline ? 'En ligne' : 'Hors ligne'}
              </div>
            </div>
          </div>
        </div>

        {/* Carte de solde adaptative */}
        <div className="px-4 py-6">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
            <div className="p-6">
              <AdaptiveText
                variant="small"
                className="text-blue-100 mb-2"
              >
                Solde disponible
              </AdaptiveText>
              <AdaptiveText
                variant="heading"
                className="font-bold mb-4"
              >
                {userBalance.toLocaleString()} FCFA
              </AdaptiveText>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  Historique
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  Recharger
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions principales - Grille adaptative */}
        <div className="px-4 mb-6">
          <AdaptiveText
            variant="subheading"
            className="font-semibold text-gray-900 mb-4"
          >
            Actions rapides
          </AdaptiveText>
          
          <div className={`grid gap-3 ${getResponsiveGrid(2, 4)}`}>
            {mainActions.map((action) => (
              <Button
                key={action.label}
                onClick={() => handleActionClick(action.route)}
                className={`${action.color} text-white shadow-lg rounded-2xl h-auto py-4 px-3 flex flex-col items-center gap-2 transition-all duration-200 ${
                  shouldReduceAnimations ? '' : 'hover:scale-105'
                }`}
                style={{ 
                  minHeight: getAdaptiveSize(80)
                }}
              >
                <action.icon 
                  size={getAdaptiveSize(24)} 
                  className="text-white" 
                />
                <span className="font-medium text-center leading-tight text-xs">
                  {action.label}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Actions secondaires */}
        <div className="px-4 mb-6">
          <AdaptiveText
            variant="subheading"
            className="font-semibold text-gray-900 mb-4"
          >
            Autres services
          </AdaptiveText>
          
          <div className={`grid gap-3 ${getResponsiveGrid(2, 4)}`}>
            {secondaryActions.map((action) => (
              <Button
                key={action.label}
                onClick={() => handleActionClick(action.route)}
                variant="outline"
                className="h-auto py-3 px-4 flex items-center gap-3 justify-start bg-white hover:bg-gray-50 border-gray-200 rounded-xl"
              >
                <action.icon 
                  size={getAdaptiveSize(20)} 
                  className="text-gray-600" 
                />
                <span className="font-medium text-gray-700 text-sm">
                  {action.label}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Informations PWA */}
        {!isOnline && (
          <div className="px-4 mb-6">
            <Card className="bg-orange-50 border-orange-200">
              <div className="p-4">
                <AdaptiveText
                  variant="small"
                  className="text-orange-800 font-medium mb-2"
                >
                  Mode hors ligne
                </AdaptiveText>
                <AdaptiveText
                  variant="tiny"
                  className="text-orange-700"
                >
                  Certaines fonctionnalités sont limitées sans connexion internet.
                </AdaptiveText>
              </div>
            </Card>
          </div>
        )}

        {/* Informations d'optimisation */}
        <div className="px-4 mb-6 pb-6">
          <Card className="bg-blue-50 border-blue-200">
            <div className="p-4">
              <AdaptiveText
                variant="tiny"
                className="text-blue-700 mb-2"
              >
                <span className="font-medium">Appareil:</span> {deviceType} • 
                <span className="font-medium"> Écran:</span> {screenWidth}×{screenHeight} • 
                <span className="font-medium"> Mode:</span> {isPortrait ? 'Portrait' : 'Paysage'}
              </AdaptiveText>
              <AdaptiveText
                variant="tiny"
                className="text-blue-600"
              >
                Interface optimisée pour votre appareil
              </AdaptiveText>
            </div>
          </Card>
        </div>
      </AdaptiveMobileLayout>
    </PWAOptimizedLayout>
  );
};

export default PWADashboard;
