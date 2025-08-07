
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase, formatCurrency, getCurrencyForCountry, convertCurrency } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Receipt, TrendingUp, Building2 } from "lucide-react";

interface CommissionData {
  agent_transfer_commission: number;
  agent_withdrawal_commission: number;
  agent_total_commission: number;
  enterprise_transfer_commission: number;
  enterprise_withdrawal_commission: number;
  enterprise_total_commission: number;
  currency: string;
}

const Commission = () => {
  const { user } = useAuth();
  const [currency, setCurrency] = useState("XAF");
  const [commissionData, setCommissionData] = useState<CommissionData>({
    agent_transfer_commission: 0,
    agent_withdrawal_commission: 0,
    agent_total_commission: 0,
    enterprise_transfer_commission: 0,
    enterprise_withdrawal_commission: 0,
    enterprise_total_commission: 0,
    currency: "XAF"
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Récupérer les transferts pour calculer les commissions
  const { data: transfers, isLoading: transfersLoading } = useQuery({
    queryKey: ['agent-transfers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Pour les agents, récupérer tous les transferts
      // Pour les utilisateurs normaux, récupérer leurs propres transferts
      const { data, error } = await supabase
        .from('transfers')
        .select('amount, fees, created_at')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Récupérer les retraits pour calculer les commissions
  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['agent-withdrawals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('withdrawals')
        .select('amount, created_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profile?.country) {
      setCurrency(getCurrencyForCountry(profile.country));
    }
  }, [profile]);

  useEffect(() => {
    if (transfers && withdrawals) {
      // Calculer les commissions sur les transferts
      const transferTotalAmount = transfers.reduce((sum, transfer) => sum + transfer.amount, 0);
      
      // Commissions transferts : Agent 1% et Entreprise 5,5% du montant
      const agentTransferCommission = transferTotalAmount * 0.01; // 1%
      const enterpriseTransferCommission = transferTotalAmount * 0.055; // 5,5%
      
      // Calculer les commissions sur les retraits
      const withdrawalTotalAmount = withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
      
      // Commissions retraits : Agent 0,5% et Entreprise 1% du montant
      const agentWithdrawalCommission = withdrawalTotalAmount * 0.005; // 0,5%
      const enterpriseWithdrawalCommission = withdrawalTotalAmount * 0.01; // 1%
      
      setCommissionData({
        agent_transfer_commission: agentTransferCommission,
        agent_withdrawal_commission: agentWithdrawalCommission,
        agent_total_commission: agentTransferCommission + agentWithdrawalCommission,
        enterprise_transfer_commission: enterpriseTransferCommission,
        enterprise_withdrawal_commission: enterpriseWithdrawalCommission,
        enterprise_total_commission: enterpriseTransferCommission + enterpriseWithdrawalCommission,
        currency: "XAF"
      });
    }
  }, [transfers, withdrawals]);

  if (profileLoading || transfersLoading || withdrawalsLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
    </div>;
  }

  const convertedCommission = {
    agent_transfer_commission: convertCurrency(commissionData.agent_transfer_commission, "XAF", currency),
    agent_withdrawal_commission: convertCurrency(commissionData.agent_withdrawal_commission, "XAF", currency),
    agent_total_commission: convertCurrency(commissionData.agent_total_commission, "XAF", currency),
    enterprise_transfer_commission: convertCurrency(commissionData.enterprise_transfer_commission, "XAF", currency),
    enterprise_withdrawal_commission: convertCurrency(commissionData.enterprise_withdrawal_commission, "XAF", currency),
    enterprise_total_commission: convertCurrency(commissionData.enterprise_total_commission, "XAF", currency),
    currency
  };

  // Check if the user is an agent or admin from user metadata
  const userRole = user?.user_metadata?.role || "user";
  const isAgent = userRole === "agent" || userRole === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500/20 to-blue-500/20 py-8 px-4">
      <div className="container max-w-4xl mx-auto space-y-8">
        <Card className="bg-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold flex items-center">
              <Receipt className="mr-2 h-6 w-6 text-amber-600" />
              Commissions par Transaction
            </CardTitle>
            {isAgent && (
              <div className="flex items-center bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                <Star className="h-4 w-4 mr-1 text-amber-500 fill-amber-500" />
                Agent
              </div>
            )}
          </CardHeader>

          <CardContent className="pt-6">
            <div className="grid gap-6">
              {/* Commission Agent */}
              <div className="p-6 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-emerald-800 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Commission Agent
                  </h3>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(convertedCommission.agent_total_commission, convertedCommission.currency)}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-emerald-200">
                    <h4 className="text-emerald-700 text-sm font-medium mb-1">Transferts (1%)</h4>
                    <p className="text-xl font-bold text-emerald-600">
                      {formatCurrency(convertedCommission.agent_transfer_commission, convertedCommission.currency)}
                    </p>
                  </div>

                  <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-emerald-200">
                    <h4 className="text-emerald-700 text-sm font-medium mb-1">Retraits (0,5%)</h4>
                    <p className="text-xl font-bold text-emerald-600">
                      {formatCurrency(convertedCommission.agent_withdrawal_commission, convertedCommission.currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Commission Entreprise */}
              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Commission Entreprise
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(convertedCommission.enterprise_total_commission, convertedCommission.currency)}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-blue-200">
                    <h4 className="text-blue-700 text-sm font-medium mb-1">Transferts (5,5%)</h4>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(convertedCommission.enterprise_transfer_commission, convertedCommission.currency)}
                    </p>
                  </div>

                  <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-blue-200">
                    <h4 className="text-blue-700 text-sm font-medium mb-1">Retraits (1%)</h4>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(convertedCommission.enterprise_withdrawal_commission, convertedCommission.currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Résumé des taux */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold mb-4 text-gray-800">Barème des Commissions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-medium text-emerald-700">Agent :</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Transferts: 1% du montant</li>
                      <li>• Retraits: 0,5% du montant</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-700">Entreprise :</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Transferts: 5,5% du montant</li>
                      <li>• Retraits: 1% du montant</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Commission;
