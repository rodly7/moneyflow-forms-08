
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BalanceCard from '@/components/dashboard/BalanceCard';
import TransactionsCard from '@/components/dashboard/TransactionsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Download, Smartphone, QrCode, Receipt, CreditCard, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRechargeRequestModal } from '@/components/user/UserRechargeRequestModal';

const MobileDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    { icon: Send, label: 'Transférer', path: '/transfer', color: 'text-blue-600 bg-blue-100' },
    { icon: Download, label: 'Retirer', path: '/withdraw', color: 'text-green-600 bg-green-100' },
    { icon: Receipt, label: 'Factures', path: '/bill-payments', color: 'text-orange-600 bg-orange-100' },
    { icon: QrCode, label: 'QR Code', path: '/qr-code', color: 'text-purple-600 bg-purple-100' }
  ];

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Bonjour,</h1>
            <p className="text-blue-100">{profile.full_name || 'Utilisateur'}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-lg font-semibold">
              {(profile.full_name || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <p className="text-blue-100 text-sm mb-1">Solde disponible</p>
          <p className="text-3xl font-bold">{profile.balance.toLocaleString()} XAF</p>
        </div>
      </div>

      <div className="p-4 space-y-6 -mt-8">
        {/* Quick Actions */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Actions rapides</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-20 flex-col gap-2 p-4"
                  onClick={() => navigate(action.path)}
                >
                  <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                    <action.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm">{action.label}</span>
                </Button>
              ))}
            </div>
            
            {/* Recharge Button */}
            <div className="pt-4 border-t">
              <UserRechargeRequestModal
                size="lg"
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <TransactionsCard />
      </div>
    </div>
  );
};

export default MobileDashboard;
