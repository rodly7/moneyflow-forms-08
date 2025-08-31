import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type OperationType = 'recharge' | 'withdrawal';

export const useUserRequestOperations = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const createUserRequest = async (
    operationType: OperationType,
    amount: number,
    paymentMethod: string,
    paymentPhone: string,
    notes?: string
  ) => {
    console.log('🔍 useUserRequestOperations - Début createUserRequest:', {
      userId: user?.id,
      operationType,
      amount,
      paymentMethod,
      paymentPhone
    });

    if (!user) {
      console.error('❌ Utilisateur non connecté');
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour faire une demande",
        variant: "destructive"
      });
      return false;
    }

    setIsLoading(true);
    try {
      console.log('📝 Insertion dans user_requests...');
      const { error } = await supabase
        .from('user_requests')
        .insert({
          user_id: user.id,
          operation_type: operationType,
          request_type: operationType,
          amount: amount,
          payment_method: paymentMethod,
          payment_phone: paymentPhone,
          status: 'pending',
          notes: notes
        });

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }

      console.log('✅ Demande créée avec succès');

      toast({
        title: "Demande envoyée",
        description: `Votre demande de ${operationType === 'recharge' ? 'recharge' : 'retrait'} a été envoyée avec succès`,
      });

      return true;
    } catch (error) {
      console.error('Erreur lors de la création de la demande:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi de votre demande",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createUserRequest,
    isLoading
  };
};