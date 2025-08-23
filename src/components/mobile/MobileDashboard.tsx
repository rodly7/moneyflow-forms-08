
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/integrations/supabase/client";
import { RechargeAccountButton } from "@/components/dashboard/RechargeAccountButton";
import { Eye, EyeOff, User, DollarSign, Send, Download, QrCode, History, CreditCard, PiggyBank } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CompactActionGrid } from "./CompactActionGrid";

const MobileDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(false);
  const balance = profile?.balance || 0;

  const actions = [
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

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 pb-20">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header avec profil */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            Bonjour {profile.full_name || 'Utilisateur'}
          </h1>
          <p className="text-gray-600">{profile.country}</p>
        </div>

        {/* Carte de solde */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm opacity-90 mb-1">Solde disponible</p>
                  <p className="text-2xl font-bold">
                    {showBalance ? formatCurrency(balance, 'XAF') : "••••••"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                {showBalance ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Bouton Recharger mon compte */}
        <RechargeAccountButton />

        {/* Actions rapides */}
        <CompactActionGrid actions={actions} />
      </div>
    </div>
  );
};

export default MobileDashboard;
