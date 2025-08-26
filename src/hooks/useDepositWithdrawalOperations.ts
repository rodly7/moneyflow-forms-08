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

      const operationData = {
        user_id: user.id,
        amount,
        type,
        status: 'pending',
        payment_method,
        phone_number,
        fee,
        country,
        provider,
        reason
      };

      const { data, error } = await supabase
        .from('operations')
        .insert([operationData])
        .select()

      if (error) {
        console.error("Error creating operation:", error);
        throw error;
      }

      toast({
        title: "Opération créée",
        description: `Votre demande de ${type} de ${formatCurrency(amount, 'XAF')} est en cours de traitement.`,
      });

      return data ? data[0] as Operation : null;

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
