
import { supabase } from "@/integrations/supabase/client";
import { SecurityService } from "./securityService";

export const enhancedDebitUserBalance = async (
  userId: string, 
  amount: number,
  operationType: string = 'debit'
): Promise<number> => {
  // Security validation
  const validation = SecurityService.validateFinancialInput(amount, operationType);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Rate limiting check
  const isWithinLimit = await SecurityService.checkRateLimit(
    `debit_${operationType}`,
    3, // Max 3 debits per hour
    60
  );

  if (!isWithinLimit) {
    throw new Error("Limite de tentatives de débit atteinte. Réessayez plus tard.");
  }

  // Log the operation attempt
  await SecurityService.logSecurityEvent('balance_debit_attempt', {
    amount,
    operation_type: operationType,
    user_id: userId
  });

  try {
    // Use the secure function
    const { data: newBalance, error } = await supabase.rpc('secure_increment_balance', {
      target_user_id: userId,
      amount: -amount,
      operation_type: operationType,
      performed_by: userId
    });

    if (error) {
      await SecurityService.logSecurityEvent('balance_debit_failed', {
        error: error.message,
        amount,
        operation_type: operationType
      }, 'high');
      throw new Error(error.message);
    }

    // Log successful operation
    await SecurityService.logSecurityEvent('balance_debit_success', {
      amount,
      new_balance: newBalance,
      operation_type: operationType
    });

    return Number(newBalance) || 0;
  } catch (error) {
    await SecurityService.logSecurityEvent('balance_debit_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      amount,
      operation_type: operationType
    }, 'high');
    throw error;
  }
};

export const enhancedCreditUserBalance = async (
  userId: string, 
  amount: number,
  operationType: string = 'credit'
): Promise<number> => {
  // Security validation
  const validation = SecurityService.validateFinancialInput(amount, operationType);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Rate limiting for large amounts
  if (amount > 100000) {
    const isWithinLimit = await SecurityService.checkRateLimit(
      `large_credit_${operationType}`,
      2, // Max 2 large credits per hour
      60
    );

    if (!isWithinLimit) {
      throw new Error("Limite de gros crédits atteinte. Contactez le support.");
    }
  }

  // Log the operation attempt
  await SecurityService.logSecurityEvent('balance_credit_attempt', {
    amount,
    operation_type: operationType,
    user_id: userId
  });

  try {
    // Use the secure function
    const { data: newBalance, error } = await supabase.rpc('secure_increment_balance', {
      target_user_id: userId,
      amount: amount,
      operation_type: operationType,
      performed_by: userId
    });

    if (error) {
      await SecurityService.logSecurityEvent('balance_credit_failed', {
        error: error.message,
        amount,
        operation_type: operationType
      }, 'high');
      throw new Error(error.message);
    }

    // Log successful operation
    await SecurityService.logSecurityEvent('balance_credit_success', {
      amount,
      new_balance: newBalance,
      operation_type: operationType
    });

    return Number(newBalance) || 0;
  } catch (error) {
    await SecurityService.logSecurityEvent('balance_credit_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      amount,
      operation_type: operationType
    }, 'high');
    throw error;
  }
};
