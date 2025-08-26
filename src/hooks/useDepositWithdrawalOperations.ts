
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, calculateFee } from '@/lib/utils/currency';
import { useToast } from '@/hooks/use-toast';

interface Operation {
  id: string;
  created_at: string;
  user_id: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed';
  payment_method: string;
  phone_number: string;
  transaction_id: string | null;
  fee: number;
  country: string;
  provider: string;
  reason?: string;
}

const useDepositWithdrawalOperations = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createOperation = useCallback(async (
    amount: number,
    type: 'deposit' | 'withdrawal',
    payment_method: string,
    phone_number: string,
    country: string,
    provider: string,
    reason?: string
  ) => {
    setLoading(true);
    try {
      if (!user?.id || !profile?.country) {
        throw new Error("User not authenticated or country not found");
      }

      const { fee } = calculateFee(amount, profile.country, country);

      if (type === 'withdrawal') {
        // Use withdrawals table
        const { data, error } = await supabase
          .from('withdrawals')
          .insert([{
            user_id: user.id,
            amount,
            status: 'pending',
            withdrawal_phone: phone_number,
          }])
          .select();

        if (error) {
          console.error("Error creating withdrawal:", error);
          throw error;
        }

        toast({
          title: "Retrait créé",
          description: `Votre demande de retrait de ${formatCurrency(amount, 'XAF')} est en cours de traitement.`,
        });

        return data?.[0] as Operation;
      } else {
        // Use recharges table for deposits
        const { data, error } = await supabase
          .from('recharges')
          .insert([{
            user_id: user.id,
            amount,
            payment_method: 'mobile_money',
            payment_phone: phone_number,
            payment_provider: provider,
            country: country,
            transaction_reference: `DEP_${Date.now()}`,
            status: 'pending'
          }])
          .select();

        if (error) {
          console.error("Error creating deposit:", error);
          throw error;
        }

        toast({
          title: "Dépôt créé",
          description: `Votre demande de dépôt de ${formatCurrency(amount, 'XAF')} est en cours de traitement.`,
        });

        return data?.[0] as Operation;
      }

    } catch (error: any) {
      console.error("Failed to create operation:", error);
      toast({
        title: "Erreur",
        description: `Impossible de créer l'opération: ${error.message || error}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, profile, supabase, toast, calculateFee]);

  return { createOperation, loading };
};

export default useDepositWithdrawalOperations;
