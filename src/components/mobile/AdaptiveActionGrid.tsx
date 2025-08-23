
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { LucideIcon, Send, Download, QrCode, History, CreditCard, PiggyBank } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ActionItem {
  key: string;
  icon: LucideIcon;
  label: string;
  description: string;
  colors: string;
  onClick: () => void;
}

interface AdaptiveActionGridProps {
  items?: ActionItem[];
  minItemWidth?: number;
  gap?: number;
  renderItem?: (item: ActionItem) => React.ReactNode;
}

export const AdaptiveActionGrid = ({
  items,
  minItemWidth = 120,
  gap = 8,
  renderItem
}: AdaptiveActionGridProps) => {
  const { isSmallMobile } = useDeviceDetection();
  const navigate = useNavigate();

  const defaultActions: ActionItem[] = [
    {
      key: 'transfer',
      icon: Send,
      label: 'Transférer',
      description: 'Envoyer de l\'argent',
      colors: 'from-blue-500 to-blue-600',
      onClick: () => navigate('/transfer')
    },
    {
      key: 'deposit',
      icon: Download,
      label: 'Dépôt',
      description: 'Déposer de l\'argent',
      colors: 'from-green-500 to-green-600',
      onClick: () => navigate('/unified-deposit-withdrawal')
    },
    {
      key: 'withdraw',
      icon: CreditCard,
      label: 'Retrait',
      description: 'Retirer de l\'argent',
      colors: 'from-orange-500 to-orange-600',
      onClick: () => navigate('/withdraw')
    },
    {
      key: 'qr-code',
      icon: QrCode,
      label: 'QR Code',
      description: 'Scanner QR Code',
      colors: 'from-purple-500 to-purple-600',
      onClick: () => navigate('/qr-code')
    },
    {
      key: 'transactions',
      icon: History,
      label: 'Historique',
      description: 'Voir transactions',
      colors: 'from-gray-500 to-gray-600',
      onClick: () => navigate('/transactions')
    },
    {
      key: 'savings',
      icon: PiggyBank,
      label: 'Épargne',
      description: 'Comptes épargne',
      colors: 'from-emerald-500 to-emerald-600',
      onClick: () => navigate('/savings')
    }
  ];

  const actions = items || defaultActions;

  const defaultRenderItem = (item: ActionItem) => (
    <Card 
      key={item.key} 
      className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group"
    >
      <CardContent className="p-0">
        <button
          onClick={item.onClick}
          className={cn(
            "w-full flex flex-col items-center justify-center gap-1 hover:bg-gray-50 transition-colors relative overflow-hidden",
            isSmallMobile ? "h-16 p-1.5" : "h-18 p-2"
          )}
          title={item.description}
        >
          {/* Background gradient on hover */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity",
            item.colors
          )} />
          
          {/* Icon */}
          <div className={cn(
            "relative z-10 bg-gradient-to-r rounded-md flex items-center justify-center",
            item.colors,
            isSmallMobile ? "p-1" : "p-1.5"
          )}>
            <item.icon className={cn(
              "text-white",
              isSmallMobile ? "w-3 h-3" : "w-4 h-4"
            )} />
          </div>
          
          {/* Label */}
          <span className={cn(
            "relative z-10 font-medium text-gray-800 text-center leading-tight px-0.5",
            isSmallMobile ? "text-xs" : "text-sm"
          )}>
            {item.label}
          </span>
        </button>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {actions.map(action => renderItem ? renderItem(action) : defaultRenderItem(action))}
    </div>
  );
};
