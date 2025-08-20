
import { getUserBalance } from './balanceService';

// Simple balance service for components that need basic balance operations
export const simpleBalanceService = {
  async getBalance(userId: string): Promise<number> {
    return await getUserBalance(userId);
  },

  async checkSufficientBalance(userId: string, amount: number): Promise<boolean> {
    const balance = await getUserBalance(userId);
    return balance >= amount;
  },

  async updateBalance(userId: string, amount: number, operation: string): Promise<void> {
    // This would typically call the enhanced balance operations
    // For now, we'll use the basic RPC function
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase.rpc('increment_balance', {
      user_id: userId,
      amount: amount
    });

    if (error) {
      throw new Error(`Balance update failed: ${error.message}`);
    }
  }
};

export const balanceService = simpleBalanceService;
