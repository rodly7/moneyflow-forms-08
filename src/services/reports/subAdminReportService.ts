
import { supabase } from "@/integrations/supabase/client";

export interface SubAdminReport {
  sub_admin_id: string;
  sub_admin_name: string;
  agents_managed: number;
  territory: string;
  total_volume: number;
  commission_percentage: number;
}

export class SubAdminReportService {
  static async getSubAdminsData(): Promise<SubAdminReport[]> {
    try {
      const reports: SubAdminReport[] = [];
      
      // Simple query to get sub-admins
      const result = await supabase
        .from('profiles')
        .select('id, full_name, country')
        .eq('role', 'sub_admin');

      if (result.error || !result.data) {
        console.error('Error fetching sub-admins:', result.error);
        return [];
      }

      for (const admin of result.data) {
        try {
          const report = await this.buildSubAdminReport(admin);
          reports.push(report);
        } catch (error) {
          console.warn(`Error processing sub-admin ${admin.id}:`, error);
          // Add fallback report
          reports.push({
            sub_admin_id: admin.id,
            sub_admin_name: admin.full_name || 'Unknown',
            agents_managed: 0,
            territory: admin.country || 'Non défini',
            total_volume: 0,
            commission_percentage: 0.15
          });
        }
      }

      return reports;
    } catch (error) {
      console.error('Error in getSubAdminsData:', error);
      return [];
    }
  }

  private static async buildSubAdminReport(admin: any): Promise<SubAdminReport> {
    // Get agents count with simple query
    const agentsResult = await supabase
      .from('agents')
      .select('user_id')
      .eq('territory_admin_id', admin.id);

    const agentsCount = agentsResult.data?.length || 0;
    
    let totalVolume = 0;
    if (agentsCount > 0 && agentsResult.data) {
      totalVolume = await this.getVolumeForAgents(agentsResult.data);
    }

    return {
      sub_admin_id: admin.id,
      sub_admin_name: admin.full_name || 'Unknown',
      agents_managed: agentsCount,
      territory: admin.country || 'Non défini',
      total_volume: totalVolume,
      commission_percentage: 0.15
    };
  }

  private static async getVolumeForAgents(agents: any[]): Promise<number> {
    try {
      const userIds = agents
        .map(agent => agent.user_id)
        .filter(Boolean);

      if (userIds.length === 0) {
        return 0;
      }

      const performanceResult = await supabase
        .from('agent_monthly_performance')
        .select('total_volume')
        .in('agent_id', userIds);

      if (!performanceResult.data) {
        return 0;
      }

      return performanceResult.data.reduce((sum, perf) => {
        const volume = Number(perf.total_volume);
        return sum + (isNaN(volume) ? 0 : volume);
      }, 0);
    } catch (error) {
      console.warn('Error calculating volume:', error);
      return 0;
    }
  }
}
