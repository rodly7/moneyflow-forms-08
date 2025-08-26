
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, calculateFee } from '@/lib/utils/currency';
import { useToast } from '@/hooks/use-toast';

interface DepositOperation {
  amount: number;
  phone_number: string;
  provider: string;
  country: string;
  transaction_id?: string;
  status?: 'pending' | 'completed' | 'failed';
  user_id?: string;
  created_at?: string;
  fee?: number;
  moneyFlowCommission?: number;
}

export const useDepositOperations = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createDepositOperation = async (depositData: DepositOperation) => {
    setLoading(true);
    try {
      if (!user?.id || !profile?.country) {
        throw new Error("User not authenticated or country not found");
      }

      const { fee, moneyFlowCommission } = calculateFee(
        depositData.amount,
        profile.country,
        depositData.country
      );

      const depositWithFee = {
        ...depositData,
        user_id: user.id,
        fee: fee,
        moneyFlowCommission: moneyFlowCommission
      };

      // Use recharges table instead of non-existent deposits table
      const { data, error } = await supabase
        .from('recharges')
        .insert([{
          user_id: user.id,
          amount: depositWithFee.amount,
          payment_method: 'mobile_money',
          payment_phone: depositWithFee.phone_number,
          payment_provider: depositWithFee.provider,
          country: depositWithFee.country,
          transaction_reference: `DEP_${Date.now()}`,
          status: 'pending'
        }])
        .select();

      if (error) {
        console.error("Error creating deposit:", error);
        throw error;
      }

      toast({
        title: "Succès",
        description: "Opération de dépôt créée avec succès",
      });

      return data;
    } catch (error: any) {
      console.error("Error during deposit operation:", error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création du dépôt",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createDepositOperation, loading };
};
