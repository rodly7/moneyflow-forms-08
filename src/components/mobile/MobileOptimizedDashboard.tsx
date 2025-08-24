
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Download, Smartphone, QrCode, Receipt, CreditCard, Bell, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRechargeRequestModal } from '@/components/user/UserRechargeRequestModal';

const MobileOptimizedDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    { icon: Send, label: 'Envoyer', path: '/transfer', color: 'bg-blue-500' },
    { icon: Download, label: 'Retirer', path: '/withdraw', color: 'bg-green-500' },
    { icon: Receipt, label: 'Factures', path: '/bill-payments', color: 'bg-orange-500' },
    { icon: QrCode, label: 'QR Code', path: '/qr-code', color: 'bg-purple-500' }
  ];

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Status Bar Spacer */}
      <div className="h-6 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm opacity-90">Bonjour,</p>
              <p className="font-semibold text-lg">{profile.full_name || 'Utilisateur'}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/80 text-sm">Solde principal</p>
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              XAF
            </Badge>
          </div>
          <p className="text-2xl font-bold text-white">
            {profile.balance.toLocaleString()}
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
            <p className="text-white/70 text-xs">Dernière mise à jour</p>
            <p className="text-white/70 text-xs">Maintenant</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6 -mt-4">
        {/* Quick Actions */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4 text-lg">Actions rapides</h3>
            
            {/* Action Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-24 flex-col gap-3 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  onClick={() => navigate(action.path)}
                >
                  <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center text-white shadow-md`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{action.label}</span>
                </Button>
              ))}
            </div>
            
            {/* Recharge Account */}
            <div className="pt-4 border-t border-gray-200">
              <UserRechargeRequestModal
                size="lg"
                className="w-full h-14"
              />
            </div>
          </CardContent>
        </Card>

        {/* Services Grid */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4 text-lg">Services</h3>
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="ghost"
                className="h-20 flex-col gap-2"
                onClick={() => navigate('/mobile-money')}
              >
                <Smartphone className="w-8 h-8 text-green-600" />
                <span className="text-xs">Mobile Money</span>
              </Button>
              <Button
                variant="ghost"
                className="h-20 flex-col gap-2"
                onClick={() => navigate('/prepaid-cards')}
              >
                <CreditCard className="w-8 h-8 text-blue-600" />
                <span className="text-xs">Cartes</span>
              </Button>
              <Button
                variant="ghost"
                className="h-20 flex-col gap-2"
                onClick={() => navigate('/savings')}
              >
                <Receipt className="w-8 h-8 text-purple-600" />
                <span className="text-xs">Épargne</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation Space */}
      <div className="h-20"></div>
    </div>
  );
};

export default MobileOptimizedDashboard;
