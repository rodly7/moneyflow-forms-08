
import { supabase } from "@/integrations/supabase/client";
import { SecurityService } from "./securityService";
import { enhancedDebitUserBalance, enhancedCreditUserBalance } from "./enhancedBalanceService";

export const secureProcessTransfer = async (
  senderId: string,
  recipientId: string,
  amount: number,
  senderCountry: string,
  recipientCountry: string
): Promise<{
  success: boolean;
  newSenderBalance: number;
  newRecipientBalance: number;
  transactionId: string;
}> => {
  // Enhanced security validations
  const validation = SecurityService.validateFinancialInput(amount, 'transfer');
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Rate limiting for transfers
  const isWithinLimit = await SecurityService.checkRateLimit(
    'user_transfer',
    5, // Max 5 transfers per hour
    60
  );

  if (!isWithinLimit) {
    throw new Error("Limite de transferts atteinte. Réessayez dans une heure.");
  }

  // Log transfer attempt
  await SecurityService.logSecurityEvent('transfer_attempt', {
    sender_id: senderId,
    recipient_id: recipientId,
    amount,
    sender_country: senderCountry,
    recipient_country: recipientCountry
  });

  try {
    // Start transaction
    const transactionId = crypto.randomUUID();

    // Create transfer record first
    const { data: transfer, error: transferError } = await supabase
      .from('transfers')
      .insert({
        id: transactionId,
        sender_id: senderId,
        recipient_id: recipientId,
        amount: amount,
        sender_country: senderCountry,
        recipient_country: recipientCountry,
        status: 'pending'
      })
      .select()
      .single();

    if (transferError) {
      throw new Error("Erreur lors de la création du transfert");
    }

    // Debit sender
    const newSenderBalance = await enhancedDebitUserBalance(
      senderId,
      amount,
      'transfer_debit'
    );

    // Credit recipient
    const newRecipientBalance = await enhancedCreditUserBalance(
      recipientId,
      amount,
      'transfer_credit'
    );

    // Update transfer status to completed
    const { error: updateError } = await supabase
      .from('transfers')
      .update({ status: 'completed' })
      .eq('id', transactionId);

    if (updateError) {
      throw new Error("Erreur lors de la finalisation du transfert");
    }

    // Log successful transfer
    await SecurityService.logSecurityEvent('transfer_success', {
      transaction_id: transactionId,
      sender_new_balance: newSenderBalance,
      recipient_new_balance: newRecipientBalance,
      amount
    });

    return {
      success: true,
      newSenderBalance,
      newRecipientBalance,
      transactionId
    };

  } catch (error) {
    // Log failed transfer
    await SecurityService.logSecurityEvent('transfer_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sender_id: senderId,
      recipient_id: recipientId,
      amount
    }, 'high');

    throw error;
  }
};
