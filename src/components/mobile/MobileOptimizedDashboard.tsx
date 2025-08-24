import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Download, QrCode, Receipt, CreditCard, Smartphone, Plus, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserRechargeRequestModal from '@/components/user/UserRechargeRequestModal';

const MobileOptimizedDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [showAllActions, setShowAllActions] = useState(false);

  const toggleActionsVisibility = () => {
    setShowAllActions(!showAllActions);
  };

  const visibleActions = [
    { icon: Send, label: 'Transférer', path: '/transfer', color: 'text-blue-600 bg-blue-100' },
    { icon: Download, label: 'Retirer', path: '/withdraw', color: 'text-green-600 bg-green-100' },
    { icon: Receipt, label: 'Factures', path: '/bill-payments', color: 'text-orange-600 bg-orange-100' },
  ];

  const hiddenActions = [
    { icon: QrCode, label: 'QR Code', path: '/qr-code', color: 'text-purple-600 bg-purple-100' },
    { icon: CreditCard, label: 'Cartes', path: '/prepaid-cards', color: 'text-teal-600 bg-teal-100' },
    { icon: Smartphone, label: 'Mobile', path: '/mobile-money', color: 'text-indigo-600 bg-indigo-100' },
  ];

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="ultra-compact-dashboard">
      <div className="ultra-compact-header bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-b-2xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold">Bonjour,</h1>
            <p className="text-blue-100">{profile.full_name || 'Utilisateur'}</p>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-lg font-semibold">
              {(profile.full_name || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="ultra-compact-balance bg-white/10 backdrop-blur-sm rounded-xl p-3">
          <p className="text-blue-100 text-sm mb-1">Solde disponible</p>
          <p className="text-2xl font-bold">{profile.balance.toLocaleString()} XAF</p>
        </div>
      </div>
      
      <div className="ultra-compact-section">
        <div className="ultra-compact-actions grid grid-cols-2 gap-2 mb-3">
          {visibleActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-16 flex-col gap-1 p-3 text-sm"
              onClick={() => navigate(action.path)}
            >
              <div className={`w-6 h-6 rounded-lg ${action.color} flex items-center justify-center`}>
                <action.icon className="w-3 h-3" />
              </div>
              <span>{action.label}</span>
            </Button>
          ))}
          {showAllActions && hiddenActions.map((action, index) => (
            <Button
              key={`hidden-${index}`}
              variant="outline"
              className="h-16 flex-col gap-1 p-3 text-sm"
              onClick={() => navigate(action.path)}
            >
              <div className={`w-6 h-6 rounded-lg ${action.color} flex items-center justify-center`}>
                <action.icon className="w-3 h-3" />
              </div>
              <span>{action.label}</span>
            </Button>
          ))}
          {!showAllActions && (
            <Button
              variant="ghost"
              className="h-16 flex-col gap-1 p-3 text-sm"
              onClick={toggleActionsVisibility}
            >
              <div className="w-6 h-6 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">
                <Plus className="w-3 h-3" />
              </div>
              <span>Plus</span>
            </Button>
          )}
        </div>
        
        <div className="ultra-compact-recharge-section">
          <UserRechargeRequestModal
            size="lg"
            className="w-full ultra-compact-recharge-button"
          />
        </div>
      </div>
      
      <div className="ultra-compact-transactions p-3">
        <Card className="shadow-none bg-transparent border-0">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-sm font-semibold">Transactions Récentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-50 rounded-md animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileOptimizedDashboard;
