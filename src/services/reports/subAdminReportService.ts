
import { supabase } from "@/integrations/supabase/client";

export interface SubAdminReport {
  sub_admin_id: string;
  sub_admin_name: string;
  phone: string;
  territory: string;
  agents_managed: number;
  activeAgents: number;
  totalTransactions: number;
  total_volume: number;
  pendingWithdrawals: number;
  commission_percentage: number;
  lastActivity: string;
}

export class SubAdminReportService {
  static async getSubAdminReports(): Promise<SubAdminReport[]> {
    try {
      // Récupérer les sous-admins avec une requête simple
      const { data: subAdmins, error: subAdminError } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, phone, country')
        .eq('role', 'sub_admin');

      if (subAdminError) throw subAdminError;

      const reports: SubAdminReport[] = [];

      // Traiter chaque sous-admin individuellement pour éviter les requêtes complexes
      for (const subAdmin of subAdmins || []) {
        try {
          // Compter les agents de ce territoire
          const { count: agentCount } = await (supabase as any)
            .from('agents')
            .select('*', { count: 'exact', head: true })
            .eq('territory_admin_id', subAdmin.id);

          // Compter les agents actifs
          const { count: activeAgentCount } = await (supabase as any)
            .from('agents')
            .select('*', { count: 'exact', head: true })
            .eq('territory_admin_id', subAdmin.id)
            .eq('status', 'active');

          // Obtenir les IDs des agents pour ce territoire
          const { data: agentIds } = await (supabase as any)
            .from('agents')
            .select('user_id')
            .eq('territory_admin_id', subAdmin.id);

          let totalTransactions = 0;
          let total_volume = 0;
          let pendingWithdrawals = 0;

          if (agentIds && agentIds.length > 0) {
            const userIds = agentIds.map((a: any) => a.user_id).filter(Boolean);

            if (userIds.length > 0) {
              // Compter les transactions
              const { count: transactionCount } = await (supabase as any)
                .from('transfers')
                .select('*', { count: 'exact', head: true })
                .in('sender_id', userIds);

              totalTransactions = transactionCount || 0;

              // Calculer le volume total
              const { data: volumeData } = await (supabase as any)
                .from('transfers')
                .select('amount')
                .in('sender_id', userIds)
                .eq('status', 'completed');

              total_volume = volumeData?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

              // Compter les retraits en attente
              const { count: withdrawalCount } = await (supabase as any)
                .from('withdrawals')
                .select('*', { count: 'exact', head: true })
                .in('user_id', userIds)
                .eq('status', 'pending');

              pendingWithdrawals = withdrawalCount || 0;
            }
          }

          reports.push({
            sub_admin_id: subAdmin.id,
            sub_admin_name: subAdmin.full_name || '',
            phone: subAdmin.phone || '',
            territory: subAdmin.country || '',
            agents_managed: agentCount || 0,
            activeAgents: activeAgentCount || 0,
            totalTransactions,
            total_volume,
            pendingWithdrawals,
            commission_percentage: 0.05, // 5% par défaut
            lastActivity: new Date().toISOString()
          });

        } catch (error) {
          console.error(`Erreur traitement sous-admin ${subAdmin.id}:`, error);
          // Ajouter le sous-admin avec des valeurs par défaut en cas d'erreur
          reports.push({
            sub_admin_id: subAdmin.id,
            sub_admin_name: subAdmin.full_name || '',
            phone: subAdmin.phone || '',
            territory: subAdmin.country || '',
            agents_managed: 0,
            activeAgents: 0,
            totalTransactions: 0,
            total_volume: 0,
            pendingWithdrawals: 0,
            commission_percentage: 0.05,
            lastActivity: new Date().toISOString()
          });
        }
      }

      return reports;

    } catch (error) {
      console.error('Erreur lors de la génération des rapports sous-admin:', error);
      return [];
    }
  }

  // Add the missing method that AdminReportsTab expects
  static async getSubAdminsData(): Promise<SubAdminReport[]> {
    return this.getSubAdminReports();
  }

  static async getSubAdminById(subAdminId: string): Promise<SubAdminReport | null> {
    try {
      const reports = await this.getSubAdminReports();
      return reports.find(r => r.sub_admin_id === subAdminId) || null;
    } catch (error) {
      console.error('Erreur récupération sous-admin:', error);
      return null;
    }
  }
}
