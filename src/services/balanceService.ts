
import { supabase } from "@/integrations/supabase/client";
import { creditTransactionFees } from "./feeService";
import { NotificationService } from "./notificationService";
import { SecurityService } from "./securityService";
import { enhancedDebitUserBalance, enhancedCreditUserBalance } from "./enhancedBalanceService";

// Use enhanced functions for better security
export const debitUserBalance = enhancedDebitUserBalance;
export const creditUserBalance = enhancedCreditUserBalance;

export const creditPlatformCommission = async (commission: number): Promise<number | null> => {
  // Utiliser le service sécurisé pour créditer la commission
  const { secureCreditPlatformCommission } = await import('./secureBalanceService');
  return await secureCreditPlatformCommission(commission);
};

export const getUserBalance = async (userId: string): Promise<number> => {
  // Add rate limiting for balance checks to prevent enumeration
  const isWithinLimit = await SecurityService.checkRateLimit(
    'balance_check',
    30, // Max 30 balance checks per hour
    60
  );

  if (!isWithinLimit) {
    console.warn("Balance check rate limit exceeded for user:", userId);
    return 0;
  }

  // Utiliser la fonction RPC pour récupérer le solde le plus à jour
  const { data: balance, error } = await supabase.rpc('increment_balance', {
    user_id: userId,
    amount: 0
  });

  if (error) {
    console.error("Erreur lors de la récupération du solde:", error);
    await SecurityService.logSecurityEvent('balance_fetch_error', {
      error: error.message,
      user_id: userId
    });
    return 0;
  }

  return Number(balance) || 0;
};

// Enhanced function for processing transfers with additional security
export const processTransferWithFees = async (
  senderId: string, 
  recipientId: string, 
  amount: number
): Promise<boolean> => {
  try {
    // Enhanced security validations
    const validation = SecurityService.validateFinancialInput(amount, 'transfer');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Use secure transfer service
    const { secureProcessTransfer } = await import('./secureTransferService');
    const { success } = await secureProcessTransfer(
      senderId,
      recipientId,
      amount,
      'Cameroun', // Default country - should be passed as parameter
      'Cameroun'
    );

    if (success) {
      // Créditer automatiquement les frais sur le compte admin
      await creditTransactionFees('transfer', amount);
    }

    return success;
  } catch (error) {
    console.error("Erreur lors du transfert avec frais sécurisé:", error);
    throw error;
  }
};

// Enhanced function for processing withdrawals with additional security
export const processWithdrawalWithFees = async (
  userId: string, 
  amount: number
): Promise<boolean> => {
  try {
    // Enhanced security validations
    const validation = SecurityService.validateFinancialInput(amount, 'withdrawal');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Use enhanced debit function
    await enhancedDebitUserBalance(userId, amount, 'withdrawal_debit');
    
    // Créditer automatiquement les frais sur le compte admin
    await creditTransactionFees('withdrawal', amount);
    
    return true;
  } catch (error) {
    console.error("Erreur lors du retrait sécurisé avec frais:", error);
    throw error;
  }
};
