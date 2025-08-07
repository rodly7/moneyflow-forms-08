
import { supabase } from "@/integrations/supabase/client";
import { checkTransactionLimit } from "./secureRoleService";

export const secureDebitUserBalance = async (
  userId: string, 
  amount: number, 
  operationType: string = 'debit',
  performedBy?: string
): Promise<number> => {
  try {
    // Check transaction limits
    const isWithinLimits = await checkTransactionLimit(userId, amount, operationType);
    if (!isWithinLimits) {
      throw new Error(`Transaction amount ${amount} exceeds limits for operation ${operationType}`);
    }

    // Use the secure balance update function
    const { data: newBalance, error } = await supabase.rpc('secure_increment_balance', {
      target_user_id: userId,
      amount: -amount,
      operation_type: operationType,
      performed_by: performedBy || null
    });

    if (error) {
      console.error("Secure debit error:", error);
      throw new Error(error.message || "Error during secure balance debit");
    }

    return Number(newBalance) || 0;
  } catch (error) {
    console.error("Secure debit failed:", error);
    throw error;
  }
};

export const secureCreditUserBalance = async (
  userId: string, 
  amount: number, 
  operationType: string = 'credit',
  performedBy?: string
): Promise<number> => {
  try {
    // Check transaction limits for large amounts
    if (amount > 100000) {
      const isWithinLimits = await checkTransactionLimit(performedBy || userId, amount, operationType);
      if (!isWithinLimits) {
        throw new Error(`Transaction amount ${amount} exceeds limits for operation ${operationType}`);
      }
    }

    // Use the secure balance update function
    const { data: newBalance, error } = await supabase.rpc('secure_increment_balance', {
      target_user_id: userId,
      amount: amount,
      operation_type: operationType,
      performed_by: performedBy || null
    });

    if (error) {
      console.error("Secure credit error:", error);
      throw new Error(error.message || "Error during secure balance credit");
    }

    return Number(newBalance) || 0;
  } catch (error) {
    console.error("Secure credit failed:", error);
    throw error;
  }
};

export const secureCreditPlatformCommission = async (commission: number): Promise<number | null> => {
  try {
    // Find admin user by role (no more hardcoded phone)
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    if (profileError || !adminProfile) {
      console.error("Error finding admin profile:", profileError);
      return null;
    }

    const newBalance = await secureCreditUserBalance(
      adminProfile.id, 
      commission, 
      'platform_commission'
    );

    return newBalance;
  } catch (error) {
    console.error("Error crediting platform commission:", error);
    return null;
  }
};

// Legacy function for backward compatibility - now uses secure functions
export { checkTransactionLimit };
