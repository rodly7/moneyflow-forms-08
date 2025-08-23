
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/integrations/supabase/client";
import { AdaptiveActionGrid } from "./AdaptiveActionGrid";
import { RechargeAccountButton } from "@/components/dashboard/RechargeAccountButton";
import { Eye, EyeOff, User, DollarSign, Bell } from "lucide-react";
import { useState } from "react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

export const MobileOptimizedDashboard = () => {
  const { user, profile } = useAuth();
  const { isSmallMobile } = useDeviceDetection();
  const [showBalance, setShowBalance] = useState(false);
  const balance = profile?.balance || 0;

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="px-4 py-6 pb-20 space-y-4">
        {/* Header compact */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`font-bold text-gray-800 ${isSmallMobile ? 'text-lg' : 'text-xl'}`}>
                {profile.full_name?.split(' ')[0] || 'Utilisateur'}
              </h1>
              <p className="text-sm text-gray-600">{profile.country}</p>
            </div>
          </div>
          <Bell className="w-6 h-6 text-gray-600" />
        </div>

        {/* Carte de solde compacte */}
        <Card className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                <div>
                  <p className="text-xs opacity-90">Solde</p>
                  <p className={`font-bold ${isSmallMobile ? 'text-lg' : 'text-xl'}`}>
                    {showBalance ? formatCurrency(balance, 'XAF') : "••••••"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                {showBalance ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Bouton Recharger mon compte */}
        <RechargeAccountButton />

        {/* Actions adaptatives */}
        <AdaptiveActionGrid />
      </div>
    </div>
  );
};
