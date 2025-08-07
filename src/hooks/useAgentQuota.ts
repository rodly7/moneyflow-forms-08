import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAgentQuota = () => {
  const { toast } = useToast();

  const updateAgentQuota = async (agentId: string, depositAmount: number) => {
    try {
      const { data, error } = await supabase.rpc('update_agent_daily_quota', {
        p_agent_id: agentId,
        p_deposit_amount: depositAmount
      });

      if (error) {
        console.error('Erreur lors de la mise à jour du quota:', error);
        return false;
      }

      // Si le quota a été atteint pour la première fois
      if (data === true) {
        const currentHour = new Date().getHours();
        const message = currentHour < 19 
          ? "🎉 Quota journalier atteint avant 19h ! Commission de 1% appliquée."
          : "✅ Quota journalier atteint ! Commission de 0.5% appliquée.";
        
        toast({
          title: "Quota atteint !",
          description: message,
          duration: 5000,
        });
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du quota:', error);
      return false;
    }
  };

  const getAgentQuotaStatus = async (agentId: string, date?: Date) => {
    try {
      const targetDate = date ? date.toISOString().split('T')[0] : undefined;
      
      const { data, error } = await supabase.rpc('get_agent_quota_status', {
        p_agent_id: agentId,
        p_date: targetDate
      });

      if (error) {
        console.error('Erreur lors de la récupération du statut du quota:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Erreur lors de la récupération du statut du quota:', error);
      return null;
    }
  };

  return {
    updateAgentQuota,
    getAgentQuotaStatus
  };
};