
import { supabase } from '@/integrations/supabase/client';

const MONTHLY_LIMIT = 2000000; // 2,000,000 XAF par mois

export const transactionLimitService = {
  async getRemainingLimit(userId: string): Promise<number> {
    try {
      console.log('Calculating remaining limit for user:', userId);
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Calculer le total envoyé ce mois-ci
      const { data: transfers, error } = await supabase
        .from('transfers')
        .select('amount')
        .eq('sender_id', userId)
        .eq('status', 'completed')
        .gte('created_at', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('created_at', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      if (error) {
        console.error('Erreur lors du calcul de la limite:', error);
        return MONTHLY_LIMIT; // Retourner la limite complète en cas d'erreur
      }

      const totalSent = transfers?.reduce((sum, transfer) => sum + transfer.amount, 0) || 0;
      const remaining = Math.max(0, MONTHLY_LIMIT - totalSent);
      
      console.log('Total sent this month:', totalSent, 'Remaining limit:', remaining);
      return remaining;
    } catch (error) {
      console.error('Erreur lors du calcul de la limite restante:', error);
      return MONTHLY_LIMIT;
    }
  },

  async canProcessTransfer(userId: string, amount: number): Promise<boolean> {
    try {
      console.log('Checking if transfer can be processed:', { userId, amount });
      const remainingLimit = await this.getRemainingLimit(userId);
      const canProcess = remainingLimit >= amount;
      console.log('Can process transfer:', canProcess);
      return canProcess;
    } catch (error) {
      console.error('Erreur lors de la vérification de la limite:', error);
      return false; // En cas d'erreur, bloquer le transfert par sécurité
    }
  },

  async getTotalSentThisMonth(userId: string): Promise<number> {
    try {
      console.log('Getting total sent this month for user:', userId);
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const { data: transfers, error } = await supabase
        .from('transfers')
        .select('amount')
        .eq('sender_id', userId)
        .eq('status', 'completed')
        .gte('created_at', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('created_at', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      if (error) {
        console.error('Erreur lors du calcul du total envoyé:', error);
        return 0;
      }

      const total = transfers?.reduce((sum, transfer) => sum + transfer.amount, 0) || 0;
      console.log('Total sent this month:', total);
      return total;
    } catch (error) {
      console.error('Erreur lors du calcul du total mensuel:', error);
      return 0;
    }
  },

  async resetMonthlyLimit(userId: string): Promise<void> {
    // Cette fonction n'est plus nécessaire car nous calculons directement 
    // à partir des transferts existants. La "réinitialisation" se fait 
    // automatiquement au début de chaque mois lors du calcul.
    console.log('Limite mensuelle réinitialisée automatiquement pour:', userId);
  },

  getMonthlyLimit(): number {
    return MONTHLY_LIMIT;
  }
};
