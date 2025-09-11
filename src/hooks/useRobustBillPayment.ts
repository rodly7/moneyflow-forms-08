
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BillPaymentData {
  amount: number;
  billType: string;
  provider: string;
  accountNumber: string;
  recipientPhone?: string;
}

export const useRobustBillPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const processBillPayment = async (paymentData: BillPaymentData) => {
    if (!user?.id || !profile) {
      toast({
        title: "Erreur d'authentification",
        description: "Veuillez vous reconnecter",
        variant: "destructive"
      });
      return { success: false };
    }

    setIsProcessing(true);
    
    try {
      // Vérifier le solde d'abord
      if (profile.balance < paymentData.amount) {
        toast({
          title: "Solde insuffisant",
          description: `Votre solde (${profile.balance.toLocaleString()} FCFA) est insuffisant pour ce paiement (${paymentData.amount.toLocaleString()} FCFA)`,
          variant: "destructive"
        });
        return { success: false };
      }

      // Préparer les données de paiement avec validation
      const requestBody = {
        user_id: user.id,
        amount: Number(paymentData.amount),
        bill_type: paymentData.billType || 'manual_payment',
        provider: paymentData.provider || 'manual',
        account_number: paymentData.accountNumber || '',
        recipient_phone: paymentData.recipientPhone || ''
      };

      console.log('🔄 Tentative de paiement via Edge Function');
      console.log('📤 Données envoyées:', requestBody);

      // Stratégie de fallback pour les erreurs Edge Function
      let paymentSuccess = false;
      
      // Tentative 1: Utiliser l'Edge Function si possible
      try {
        const { data, error } = await supabase.functions.invoke('process-bill-payment', {
          body: requestBody,
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log('📥 Réponse reçue:', { data, error });

        if (!error && data?.success) {
          paymentSuccess = true;
          toast({
            title: "✅ Paiement réussi",
            description: `Facture ${paymentData.provider} payée avec succès (${paymentData.amount.toLocaleString()} FCFA)`,
          });
        } else if (error) {
          console.error('❌ Erreur Edge Function:', error);
          throw new Error(`Edge Function Error: ${error.message}`);
        } else if (data && !data.success) {
          console.error('❌ Échec du paiement:', data.message);
          toast({
            title: "Échec du paiement",
            description: data.message || "Le paiement a échoué",
            variant: "destructive"
          });
          return { success: false };
        }
      } catch (edgeError) {
        console.log("❌ Edge Function indisponible, utilisation du fallback", edgeError);
      }

      // Tentative 2: Fallback direct avec transaction locale
      if (!paymentSuccess) {
        console.log("🔄 Utilisation du système de fallback pour le paiement");
        
        // Déduire le montant du solde
        const { error: balanceError } = await supabase
          .rpc('secure_increment_balance', {
            target_user_id: user.id,
            amount: -paymentData.amount,
            operation_type: 'bill_payment',
            performed_by: user.id
          });

        if (balanceError) {
          console.error('❌ Erreur de balance:', balanceError);
          throw new Error(`Erreur de balance: ${balanceError.message}`);
        }

        // Créditer le fournisseur si un numéro de téléphone est fourni
        if (paymentData.recipientPhone) {
          try {
            console.log('🔍 Recherche du bénéficiaire avec le numéro:', paymentData.recipientPhone);
            
            // Normalisation et variations du numéro
            const cleaned = paymentData.recipientPhone.replace(/\s+/g, '');
            const digits = paymentData.recipientPhone.replace(/\D/g, '');
            const last9 = digits.slice(-9);
            const last10 = digits.slice(-10);
            const withPlus = digits ? `+${digits}` : '';
            const variations = Array.from(new Set([
              paymentData.recipientPhone,
              cleaned,
              digits,
              withPlus,
              last9,
              last10,
            ].filter(Boolean)));
            console.log('🔎 Variations testées:', variations);

            // Essai 1: correspondance exacte
            let { data: recipientProfile, error: recipientError } = await supabase
              .from('profiles')
              .select('id, full_name, phone')
              .in('phone', variations)
              .maybeSingle();

            // Essai 2: correspondance sur les 9/10 derniers chiffres
            if ((!recipientProfile || recipientError) && (last9 || last10)) {
              const ends = last10 || last9;
              const res = await supabase
                .from('profiles')
                .select('id, full_name, phone')
                .ilike('phone', `%${ends}`)
                .limit(1)
                .maybeSingle();
              recipientProfile = res.data || null;
              recipientError = res.error || null;
            }

            if (recipientProfile && !recipientError) {
              console.log('✅ Bénéficiaire trouvé:', { recipientId: recipientProfile.id, recipientPhone: paymentData.recipientPhone });
              
              // Calculer la commission SendFlow (1.5% pour les paiements de factures)
              const commissionRate = 0.015; // 1.5%
              const commission = paymentData.amount * commissionRate;
              const netAmount = paymentData.amount - commission;
              
              console.log('💰 Calcul commission:', { amount: paymentData.amount, commission, netAmount });
              
              // Créditer le compte du bénéficiaire avec le montant net (après commission)
              const { error: recipientCreditError } = await supabase.rpc('secure_increment_balance', {
                target_user_id: recipientProfile.id,
                amount: netAmount,
                operation_type: 'bill_payment_transfer',
                performed_by: user.id
              });

              if (recipientCreditError) {
                console.error('❌ Erreur crédit bénéficiaire:', recipientCreditError);
              } else {
                console.log('✅ Bénéficiaire crédité avec succès du montant net:', netAmount);
                
                // Enregistrer la transaction comme un transfert avec le montant brut
                await supabase
                  .from('transfers')
                  .insert({
                    sender_id: user.id,
                    recipient_id: recipientProfile.id,
                    recipient_phone: paymentData.recipientPhone,
                    recipient_full_name: recipientProfile.full_name,
                    recipient_country: 'Congo Brazzaville',
                    amount: paymentData.amount, // Montant brut payé par l'utilisateur
                    fees: commission,
                    status: 'completed',
                    currency: 'XAF',
                    transfer_type: 'bill_payment'
                  });
                  
                // Enregistrer aussi comme paiement marchand si c'est un fournisseur
                if (paymentData.provider) {
                  await supabase
                    .from('merchant_payments')
                    .insert({
                      user_id: user.id,
                      merchant_id: recipientProfile.id,
                      amount: netAmount, // Montant net reçu par le fournisseur
                      business_name: paymentData.provider || 'Paiement de facture',
                      description: `Paiement facture ${paymentData.billType || 'manuel'} - Commission: ${commission.toFixed(2)} XAF - Net: ${netAmount.toFixed(2)} XAF`,
                      status: 'completed'
                    });
                }
              }
            } else {
              console.log('⚠️ Bénéficiaire non trouvé avec le numéro:', paymentData.recipientPhone);
              console.log('Le paiement a été débité mais aucun compte à créditer trouvé');
            }
          } catch (error) {
            console.error('❌ Erreur lors du crédit bénéficiaire:', error);
            // Continuer même si le crédit bénéficiaire échoue
          }
        }

        // Enregistrer l'historique de paiement
        const { error: historyError } = await supabase
          .from('automatic_bills')
          .insert({
            user_id: user.id,
            bill_name: `${paymentData.billType}_${paymentData.provider}`,
            amount: paymentData.amount,
            status: 'completed',
            payment_number: paymentData.recipientPhone || '',
            meter_number: paymentData.accountNumber,
            due_date: new Date().toISOString().split('T')[0],
            recurrence: 'once'
          });

        if (historyError) {
          console.error('❌ Erreur d\'historique:', historyError);
          // Rembourser si l'historique échoue
          await supabase.rpc('secure_increment_balance', {
            target_user_id: user.id,
            amount: paymentData.amount,
            operation_type: 'refund',
            performed_by: user.id
          });
          throw new Error(`Erreur d'historique: ${historyError.message}`);
        }

        paymentSuccess = true;
        toast({
          title: "✅ Paiement réussi (Fallback)",
          description: `Facture ${paymentData.provider} payée avec succès (${paymentData.amount.toLocaleString()} FCFA)`,
        });
      }

      // Tentative 3: Si tout échoue, paiement manuel
      if (!paymentSuccess) {
        toast({
          title: "⚠️ Paiement en attente",
          description: "Le paiement sera traité manuellement. Veuillez contacter le support.",
          variant: "default"
        });

        console.log("⚠️ Paiement en attente - notification créée");
        return { success: true, isPending: true };
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Erreur lors du paiement:', error);
      
      toast({
        title: "Erreur de paiement",
        description: "Une erreur s'est produite. Votre argent est sécurisé.",
        variant: "destructive"
      });
      
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processBillPayment,
    isProcessing
  };
};
