
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, Download, Smartphone, QrCode, Receipt, CreditCard } from 'lucide-react';
import { UserRechargeRequestModal } from '@/components/user/UserRechargeRequestModal';

const ActionButtons = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Transférer',
      description: 'Envoyer de l\'argent',
      icon: Send,
      href: '/transfer',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Retirer',
      description: 'Retirer de l\'argent',
      icon: Download,
      href: '/withdraw',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Payer facture',
      description: 'Régler vos factures',
      icon: Receipt,
      href: '/bill-payments',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Cartes prépayées',
      description: 'Acheter des cartes',
      icon: CreditCard,
      href: '/prepaid-cards',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Code QR',
      description: 'Scanner pour payer',
      icon: QrCode,
      href: '/qr-code',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      title: 'Mobile Money',
      description: 'Gestion mobile',
      icon: Smartphone,
      href: '/mobile-money',
      color: 'text-teal-600',
      bgColor: 'bg-teal-100'
    }
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold mb-4">Actions rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              className="h-auto flex-col p-4 text-left"
              onClick={() => navigate(action.href)}
            >
              <div className={`w-10 h-10 rounded-lg ${action.bgColor} flex items-center justify-center mb-2`}>
                <action.icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <div className="text-sm font-medium">{action.title}</div>
              <div className="text-xs text-muted-foreground">{action.description}</div>
            </Button>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <UserRechargeRequestModal
            size="lg"
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionButtons;
