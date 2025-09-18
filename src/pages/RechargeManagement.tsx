import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, History, ArrowLeft } from 'lucide-react';
import UserRechargeRequestModal from '@/components/user/UserRechargeRequestModal';
import RechargeHistory from '@/components/user/RechargeHistory';
import { useAuth } from '@/contexts/AuthContext';


type ViewType = 'menu' | 'history';

const RechargeManagement = () => {
  const { profile } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('menu');

  const handleBackToMenu = () => {
    setCurrentView('menu');
  };

  if (currentView === 'history') {
    return <RechargeHistory onBack={handleBackToMenu} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="p-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Gestion du compte</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Balance Card */}
        <Card className="mb-6 bg-gradient-to-r from-green-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-green-100 text-sm mb-2">Solde disponible</p>
              <p className="text-3xl font-bold">
                {(profile?.balance || 0).toLocaleString()} FCFA
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Main Actions */}
        <div className="space-y-4">
          {/* Recharge Button */}
          <UserRechargeRequestModal>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Recharger mon compte</h3>
                    <p className="text-gray-500 text-sm">Ajouter de l'argent à votre compte</p>
                  </div>
                  <div className="text-gray-400">
                    <span className="text-2xl">→</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </UserRechargeRequestModal>

          {/* History Button */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setCurrentView('history')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <History className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Historique des transactions</h3>
                  <p className="text-gray-500 text-sm">Voir vos recharges et retraits</p>
                </div>
                <div className="text-gray-400">
                  <span className="text-2xl">→</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="text-center">
                <h4 className="font-medium text-blue-900 mb-2">💡 Information</h4>
                <p className="text-blue-800 text-sm">
                  Les recharges sont traitées rapidement par nos administrateurs. 
                  Vous recevrez une notification dès que votre compte sera crédité.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RechargeManagement;