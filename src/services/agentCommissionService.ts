import { supabase } from "@/integrations/supabase/client";

export interface AgentCommissionData {
  agentId: string;
  month: number;
  year: number;
  totalVolume: number;
  totalTransactions: number;
  complaintsCount: number;
  commissionRate: number;
  baseCommission: number;
  totalEarnings: number;
}

// Calculer et mettre à jour les commissions de tous les agents pour un mois donné
export const calculateAllAgentsCommissions = async (month?: number, year?: number) => {
  try {
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    console.log(`🔄 Calcul des commissions pour ${targetMonth}/${targetYear}...`);

    // Récupérer tous les agents actifs
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('user_id, full_name')
      .eq('status', 'active');

    if (agentsError) {
      console.error('Erreur récupération agents:', agentsError);
      return false;
    }

    if (!agents || agents.length === 0) {
      console.log('Aucun agent actif trouvé');
      return true;
    }

    // Calculer les performances pour chaque agent
    const results = [];
    for (const agent of agents) {
      try {
        const { data: performanceId, error: calcError } = await supabase
          .rpc('calculate_agent_monthly_performance', {
            agent_id_param: agent.user_id,
            month_param: targetMonth,
            year_param: targetYear
          });

        if (calcError) {
          console.error(`Erreur calcul pour agent ${agent.full_name}:`, calcError);
          continue;
        }

        results.push({
          agentId: agent.user_id,
          agentName: agent.full_name,
          performanceId
        });

        console.log(`✅ Commissions calculées pour ${agent.full_name}`);
      } catch (error) {
        console.error(`Erreur lors du calcul pour ${agent.full_name}:`, error);
      }
    }

    console.log(`🎉 Calcul terminé pour ${results.length}/${agents.length} agents`);
    return true;
  } catch (error) {
    console.error('Erreur lors du calcul des commissions:', error);
    return false;
  }
};

// Récupérer les données de commission d'un agent spécifique
export const getAgentCommissionData = async (
  agentId: string, 
  month?: number, 
  year?: number
): Promise<AgentCommissionData | null> => {
  try {
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    const { data, error } = await supabase
      .from('agent_monthly_performance')
      .select('*')
      .eq('agent_id', agentId)
      .eq('month', targetMonth)
      .eq('year', targetYear)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Erreur récupération données commission:', error);
      return null;
    }

    if (!data) {
      // Pas de données trouvées, calculer maintenant
      await supabase.rpc('calculate_agent_monthly_performance', {
        agent_id_param: agentId,
        month_param: targetMonth,
        year_param: targetYear
      });

      // Essayer de récupérer à nouveau
      const { data: newData, error: newError } = await supabase
        .from('agent_monthly_performance')
        .select('*')
        .eq('agent_id', agentId)
        .eq('month', targetMonth)
        .eq('year', targetYear)
        .single();

      if (newError || !newData) {
        return null;
      }

      return {
        agentId: newData.agent_id,
        month: newData.month,
        year: newData.year,
        totalVolume: Number(newData.total_volume),
        totalTransactions: newData.total_transactions,
        complaintsCount: newData.complaints_count,
        commissionRate: Number(newData.commission_rate),
        baseCommission: Number(newData.base_commission),
        totalEarnings: Number(newData.total_earnings)
      };
    }

    return {
      agentId: data.agent_id,
      month: data.month,
      year: data.year,
      totalVolume: Number(data.total_volume),
      totalTransactions: data.total_transactions,
      complaintsCount: data.complaints_count,
      commissionRate: Number(data.commission_rate),
      baseCommission: Number(data.base_commission),
      totalEarnings: Number(data.total_earnings)
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des données commission:', error);
    return null;
  }
};

// Ajouter une réclamation contre un agent
export const addAgentComplaint = async (
  agentId: string,
  userId: string,
  complaintType: string,
  description?: string
) => {
  try {
    const { data, error } = await supabase
      .from('agent_complaints')
      .insert({
        agent_id: agentId,
        user_id: userId,
        complaint_type: complaintType,
        description: description || '',
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur ajout réclamation:', error);
      return false;
    }

    // Recalculer les commissions de l'agent pour le mois en cours
    const currentDate = new Date();
    await supabase.rpc('calculate_agent_monthly_performance', {
      agent_id_param: agentId,
      month_param: currentDate.getMonth() + 1,
      year_param: currentDate.getFullYear()
    });

    console.log('✅ Réclamation ajoutée et commissions recalculées');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de réclamation:', error);
    return false;
  }
};

// Résoudre une réclamation
export const resolveComplaint = async (complaintId: string, agentId: string) => {
  try {
    const { error } = await supabase
      .from('agent_complaints')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString()
      })
      .eq('id', complaintId);

    if (error) {
      console.error('Erreur résolution réclamation:', error);
      return false;
    }

    // Recalculer les commissions de l'agent pour le mois en cours
    const currentDate = new Date();
    await supabase.rpc('calculate_agent_monthly_performance', {
      agent_id_param: agentId,
      month_param: currentDate.getMonth() + 1,
      year_param: currentDate.getFullYear()
    });

    console.log('✅ Réclamation résolue et commissions recalculées');
    return true;
  } catch (error) {
    console.error('Erreur lors de la résolution de réclamation:', error);
    return false;
  }
};

// Obtenir le top des agents par revenus
export const getTopAgentsByEarnings = async (month?: number, year?: number, limit = 10) => {
  try {
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    const { data, error } = await supabase
      .from('agent_monthly_performance')
      .select(`
        *,
        profiles:agent_id (full_name, phone)
      `)
      .eq('month', targetMonth)
      .eq('year', targetYear)
      .order('total_earnings', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erreur récupération top agents:', error);
      return [];
    }

    return data.map((agent, index) => ({
      rank: index + 1,
      agentId: agent.agent_id,
      agentName: agent.profiles?.full_name || 'Agent inconnu',
      agentPhone: agent.profiles?.phone || '',
      totalVolume: Number(agent.total_volume),
      totalTransactions: agent.total_transactions,
      totalEarnings: Number(agent.total_earnings),
      commissionRate: Number(agent.commission_rate),
      complaintsCount: agent.complaints_count
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération du classement:', error);
    return [];
  }
};