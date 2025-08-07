
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useReceiptGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateReceipt = async (transactionId: string, transactionType: string) => {
    setIsGenerating(true);
    
    try {
      // Use transfers table instead of non-existent transaction_receipts
      const { data: existingTransfer, error: fetchError } = await supabase
        .from('transfers')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (fetchError || !existingTransfer) {
        throw new Error('Transaction non trouvée');
      }

      // Generate receipt data from transfer
      const receiptData = {
        id: existingTransfer.id,
        transaction_id: existingTransfer.id,
        transaction_type: transactionType,
        receipt_data: {
          amount: existingTransfer.amount,
          fees: existingTransfer.fees,
          recipient: existingTransfer.recipient_full_name,
          phone: existingTransfer.recipient_phone,
          country: existingTransfer.recipient_country,
          status: existingTransfer.status,
          date: existingTransfer.created_at
        },
        created_at: existingTransfer.created_at,
        user_id: existingTransfer.sender_id
      };

      toast({
        title: "Reçu généré",
        description: "Le reçu de transaction a été généré avec succès",
      });

      return receiptData;
    } catch (error) {
      console.error('Erreur génération reçu:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le reçu",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateReceipt,
    isGenerating
  };
};
