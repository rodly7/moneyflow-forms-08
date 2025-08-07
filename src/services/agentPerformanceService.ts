import { supabase } from "@/integrations/supabase/client";

interface AgentPerformanceData {
  agentId: string;
  dailyOperations: number;
  dailyVolume: number;
  dailyCommissions: number;
  operationTypes: {
    transfers: number;
    deposits: number;
    withdrawals: number;
  };
}

// Calculer automatiquement les performances d'un agent
export const calculateAgentPerformance = async (agentId: string): Promise<AgentPerformanceData | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Récupérer les transferts de l'agent aujourd'hui
    const { data: transfers, error: transfersError } = await supabase
      .from('transfers')
      .select('amount, fees')
      .eq('sender_id', agentId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    if (transfersError) {
      console.error('Erreur récupération transferts:', transfersError);
      return null;
    }

    // Récupérer les dépôts de l'agent aujourd'hui
    const { data: deposits, error: depositsError } = await supabase
      .from('recharges')
      .select('amount')
      .eq('provider_transaction_id', agentId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    if (depositsError) {
      console.error('Erreur récupération dépôts:', depositsError);
    }

    // Récupérer les retraits de l'agent aujourd'hui
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from('withdrawals')
      .select('amount')
      .eq('user_id', agentId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    if (withdrawalsError) {
      console.error('Erreur récupération retraits:', withdrawalsError);
    }

    // Calculer les statistiques
    const transferCount = transfers?.length || 0;
    const depositCount = deposits?.length || 0;
    const withdrawalCount = withdrawals?.length || 0;
    
    const transferVolume = transfers?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const depositVolume = deposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
    const withdrawalVolume = withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
    
    const totalVolume = transferVolume + depositVolume + withdrawalVolume;
    const totalOperations = transferCount + depositCount + withdrawalCount;
    
    // Calculer les commissions (1% transferts, 0.5% retraits pour l'agent)
    const dailyCommissions = totalVolume * 0.005;

    return {
      agentId,
      dailyOperations: totalOperations,
      dailyVolume: totalVolume,
      dailyCommissions,
      operationTypes: {
        transfers: transferCount,
        deposits: depositCount,
        withdrawals: withdrawalCount
      }
    };
  } catch (error) {
    console.error('Erreur calcul performance agent:', error);
    return null;
  }
};

// Envoyer automatiquement les performances à l'admin
export const sendPerformanceToAdmin = async (performanceData: AgentPerformanceData) => {
  try {
    // Récupérer le profil de l'agent
    const { data: agentProfile, error: agentError } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', performanceData.agentId)
      .single();

    if (agentError || !agentProfile) {
      console.error('Erreur récupération profil agent:', agentError);
      return false;
    }

    // Créer le rapport de performance
    const performanceReport = {
      agent_id: performanceData.agentId,
      report_date: new Date().toISOString().split('T')[0],
      period: 'daily',
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      total_transfers: performanceData.operationTypes.transfers,
      total_deposits: performanceData.operationTypes.deposits,
      total_withdrawals: performanceData.operationTypes.withdrawals,
      total_commissions: performanceData.dailyCommissions,
      current_balance: 0, // À récupérer séparément si nécessaire
      amount_to_add: 0 // Récompense calculée par l'admin
    };

    // Insérer dans la table agent_reports
    const { error: reportError } = await supabase
      .from('agent_reports')
      .insert(performanceReport);

    if (reportError) {
      console.error('Erreur insertion rapport:', reportError);
      return false;
    }

    // Créer une notification pour l'admin
    const notificationTitle = `🏆 Rapport Performance Agent`;
    const notificationMessage = `
Agent: ${agentProfile.full_name} (${agentProfile.phone})
📊 Opérations du jour: ${performanceData.dailyOperations}
💰 Volume total: ${performanceData.dailyVolume.toLocaleString()} FCFA
💎 Commissions: ${performanceData.dailyCommissions.toLocaleString()} FCFA

Détails:
• Transferts: ${performanceData.operationTypes.transfers}
• Dépôts: ${performanceData.operationTypes.deposits}  
• Retraits: ${performanceData.operationTypes.withdrawals}
`;

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        title: notificationTitle,
        message: notificationMessage,
        notification_type: 'agent_performance',
        target_role: 'admin',
        priority: 'normal'
      });

    if (notificationError) {
      console.error('Erreur création notification:', notificationError);
      return false;
    }

    console.log(`✅ Rapport de performance envoyé pour l'agent ${agentProfile.full_name}`);
    return true;
  } catch (error) {
    console.error('Erreur envoi performance à admin:', error);
    return false;
  }
};

// Fonction principale à appeler automatiquement en fin de journée
export const processAgentDailyPerformance = async (agentId: string) => {
  const performance = await calculateAgentPerformance(agentId);
  if (performance && performance.dailyOperations > 0) {
    await sendPerformanceToAdmin(performance);
  }
};