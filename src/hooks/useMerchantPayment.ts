import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MerchantPaymentData {
  merchantId: string;
  businessName: string;
  amount?: number;
  description: string;
  currency: string;
}

export const useMerchantPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processPayment = async (paymentData: MerchantPaymentData) => {
    setIsProcessing(true);

    try {
      // Vérifier que le montant est défini
      if (!paymentData.amount || paymentData.amount <= 0) {
        throw new Error('Montant invalide');
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Get user profile and balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance, full_name')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Profil utilisateur non trouvé');
      }

      // Check sufficient balance
      if (profile.balance < paymentData.amount) {
        toast({
          title: "Solde insuffisant",
          description: `Votre solde (${profile.balance.toLocaleString()} XAF) est insuffisant pour ce paiement`,
          variant: "destructive"
        });
        return { success: false };
      }

      // Process payment (deduct from user balance)
      const { error: balanceError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: -paymentData.amount
      });

      if (balanceError) {
        throw new Error('Erreur lors du traitement du paiement');
      }

      // Enregistrer le paiement marchand
      try {
        await supabase.from('merchant_payments').insert({
          user_id: user.id,
          merchant_id: paymentData.merchantId,
          business_name: paymentData.businessName,
          client_name: profile.full_name,
          client_phone: user.phone || '',
          amount: paymentData.amount,
          description: paymentData.description,
          currency: paymentData.currency,
          status: 'completed'
        });

        // Activer le bonus de parrainage si c'est la première transaction
        try {
          await supabase.rpc('activate_referral_bonus', {
            user_id_param: user.id
          });
        } catch (referralError) {
          console.log('Aucun bonus de parrainage à activer ou erreur:', referralError);
        }
      } catch (insertError) {
        console.error('Error recording merchant payment:', insertError);
        // Don't throw as payment was successful
      }

      toast({
        title: "Paiement effectué",
        description: `Paiement de ${paymentData.amount.toLocaleString()} XAF effectué avec succès à ${paymentData.businessName}`,
      });

      return { success: true };

    } catch (error) {
      console.error('Merchant payment error:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de traiter le paiement",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processPayment,
    isProcessing
  };
};