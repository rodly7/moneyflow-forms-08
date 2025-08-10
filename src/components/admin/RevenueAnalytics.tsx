
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RevenueData {
  internationalTransfers: {
    total: number;
    sendflowRevenue: number; // 5%
    agentRevenue: number; // 1.5%
  };
  nationalTransfers: {
    total: number;
    sendflowRevenue: number; // 1% (entièrement Sendflow)
  };
  billPayments: {
    total: number;
    sendflowRevenue: number; // 1.5% (entièrement Sendflow)
  };
  totalSendflowRevenue: number;
  totalAgentRevenue: number;
}

interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  phone: string;
  internationalVolume: number;
  nationalVolume: number;
  billPaymentVolume: number;
  totalRevenue: number;
  performance_score: number;
}

export const RevenueAnalytics = () => {
  const [revenueData, setRevenueData] = useState<RevenueData>({
    internationalTransfers: { total: 0, sendflowRevenue: 0, agentRevenue: 0 },
    nationalTransfers: { total: 0, sendflowRevenue: 0 },
    billPayments: { total: 0, sendflowRevenue: 0 },
    totalSendflowRevenue: 0,
    totalAgentRevenue: 0
  });
  
  const [agentPerformances, setAgentPerformances] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');

  const calculateDateRange = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    return { startDate, endDate: now };
  };

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = calculateDateRange();

      // Récupérer les transferts internationaux
      const { data: intlTransfers } = await supabase
        .from('transfers')
        .select('amount, fees')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed')
        .neq('recipient_country', 'Congo Brazzaville'); // Transferts internationaux

      // Récupérer les transferts nationaux
      const { data: nationalTransfers } = await supabase
        .from('transfers')
        .select('amount, fees')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed')
        .eq('recipient_country', 'Congo Brazzaville'); // Transferts nationaux

      // Récupérer les paiements de factures (approximation via recharges)
      const { data: billPayments } = await supabase
        .from('recharges')
        .select('amount')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed');

      // Calculer les revenus
      const intlTotal = intlTransfers?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const intlSendflowRevenue = intlTotal * 0.05; // 5% pour Sendflow
      const intlAgentRevenue = intlTotal * 0.015; // 1.5% pour les agents

      const nationalTotal = nationalTransfers?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const nationalSendflowRevenue = nationalTotal * 0.01; // 1% entièrement pour Sendflow

      const billTotal = billPayments?.reduce((sum, b) => sum + Number(b.amount), 0) || 0;
      const billSendflowRevenue = billTotal * 0.015; // 1.5% entièrement pour Sendflow

      const revenue: RevenueData = {
        internationalTransfers: {
          total: intlTotal,
          sendflowRevenue: intlSendflowRevenue,
          agentRevenue: intlAgentRevenue
        },
        nationalTransfers: {
          total: nationalTotal,
          sendflowRevenue: nationalSendflowRevenue
        },
        billPayments: {
          total: billTotal,
          sendflowRevenue: billSendflowRevenue
        },
        totalSendflowRevenue: intlSendflowRevenue + nationalSendflowRevenue + billSendflowRevenue,
        totalAgentRevenue: intlAgentRevenue
      };

      setRevenueData(revenue);

    } catch (error) {
      console.error('Erreur lors du calcul des revenus:', error);
      toast.error('Erreur lors du calcul des revenus');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentPerformances = async () => {
    try {
      // Récupérer les agents et leurs performances
      const { data: agents } = await supabase
        .from('agents')
        .select('user_id, agent_id, full_name, phone')
        .eq('status', 'active');

      if (!agents) return;

      const { startDate, endDate } = calculateDateRange();
      const performances: AgentPerformance[] = [];

      for (const agent of agents) {
        // Transferts internationaux de l'agent
        const { data: intlTransfers } = await supabase
          .from('transfers')
          .select('amount')
          .eq('sender_id', agent.user_id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .eq('status', 'completed')
          .neq('recipient_country', 'Congo Brazzaville');

        // Transferts nationaux de l'agent
        const { data: nationalTransfers } = await supabase
          .from('transfers')
          .select('amount')
          .eq('sender_id', agent.user_id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .eq('status', 'completed')
          .eq('recipient_country', 'Congo Brazzaville');

        // Paiements de factures (recharges effectuées par l'agent)
        const { data: billPayments } = await supabase
          .from('recharges')
          .select('amount')
          .eq('provider_transaction_id', agent.user_id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .eq('status', 'completed');

        const intlVolume = intlTransfers?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const nationalVolume = nationalTransfers?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const billVolume = billPayments?.reduce((sum, b) => sum + Number(b.amount), 0) || 0;

        // Calculer la commission de l'agent (seulement sur les transferts internationaux)
        const agentRevenue = intlVolume * 0.015;

        // Score de performance basé sur le volume total et la diversité des services
        const totalVolume = intlVolume + nationalVolume + billVolume;
        const diversityBonus = (intlVolume > 0 ? 1 : 0) + (nationalVolume > 0 ? 1 : 0) + (billVolume > 0 ? 1 : 0);
        const performanceScore = (totalVolume / 1000000) * 100 + (diversityBonus * 10); // Score sur 100+

        performances.push({
          agent_id: agent.agent_id,
          agent_name: agent.full_name,
          phone: agent.phone,
          internationalVolume: intlVolume,
          nationalVolume: nationalVolume,
          billPaymentVolume: billVolume,
          totalRevenue: agentRevenue,
          performance_score: Math.round(performanceScore)
        });
      }

      // Trier par score de performance décroissant
      performances.sort((a, b) => b.performance_score - a.performance_score);
      setAgentPerformances(performances);

    } catch (error) {
      console.error('Erreur lors du calcul des performances:', error);
      toast.error('Erreur lors du calcul des performances');
    }
  };

  useEffect(() => {
    fetchRevenueData();
    fetchAgentPerformances();
  }, [dateRange]);

  const rewardTopAgents = async () => {
    try {
      const topAgents = agentPerformances.slice(0, 3); // Top 3
      
      for (const [index, agent] of topAgents.entries()) {
        const bonusAmount = index === 0 ? 10000 : index === 1 ? 5000 : 2000;
        
        // Récupérer l'user_id de l'agent
        const { data: agentData } = await supabase
          .from('agents')
          .select('user_id')
          .eq('agent_id', agent.agent_id)
          .single();

        if (agentData) {
          await supabase.rpc('secure_increment_balance', {
            target_user_id: agentData.user_id,
            amount: bonusAmount,
            operation_type: 'performance_bonus'
          });
        }
      }

      toast.success('Récompenses distribuées aux meilleurs agents !');
    } catch (error) {
      console.error('Erreur lors de la distribution des récompenses:', error);
      toast.error('Erreur lors de la distribution des récompenses');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Calcul des revenus en cours...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2>Revenus & Analytics</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
          <button
            onClick={rewardTopAgents}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🏆 Récompenser Top 3
          </button>
        </div>
      </div>

      {/* Résumé des revenus */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#2196f3', margin: '0 0 10px 0' }}>Transferts Internationaux</h3>
          <p>Volume: {revenueData.internationalTransfers.total.toLocaleString()} XAF</p>
          <p>Sendflow (5%): <strong>{revenueData.internationalTransfers.sendflowRevenue.toLocaleString()} XAF</strong></p>
          <p>Agents (1.5%): <strong>{revenueData.internationalTransfers.agentRevenue.toLocaleString()} XAF</strong></p>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#4caf50', margin: '0 0 10px 0' }}>Transferts Nationaux</h3>
          <p>Volume: {revenueData.nationalTransfers.total.toLocaleString()} XAF</p>
          <p>Sendflow (1%): <strong>{revenueData.nationalTransfers.sendflowRevenue.toLocaleString()} XAF</strong></p>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#ff9800', margin: '0 0 10px 0' }}>Paiement Factures</h3>
          <p>Volume: {revenueData.billPayments.total.toLocaleString()} XAF</p>
          <p>Sendflow (1.5%): <strong>{revenueData.billPayments.sendflowRevenue.toLocaleString()} XAF</strong></p>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#9c27b0', margin: '0 0 10px 0' }}>Total Revenus</h3>
          <p>Sendflow: <strong style={{ color: '#4caf50' }}>{revenueData.totalSendflowRevenue.toLocaleString()} XAF</strong></p>
          <p>Agents: <strong style={{ color: '#2196f3' }}>{revenueData.totalAgentRevenue.toLocaleString()} XAF</strong></p>
        </div>
      </div>

      {/* Performance des agents */}
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #ddd' }}>
          <h3 style={{ margin: 0 }}>Performance des Agents</h3>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Rang</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Agent</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>International</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>National</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Factures</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Commission</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {agentPerformances.map((agent, index) => (
              <tr key={agent.agent_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    display: 'inline-block',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: index < 3 ? '#ffd700' : '#e0e0e0',
                    color: index < 3 ? '#333' : '#666',
                    textAlign: 'center',
                    lineHeight: '30px',
                    fontWeight: 'bold'
                  }}>
                    {index + 1}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <div>
                    <strong>{agent.agent_name}</strong>
                    <div style={{ fontSize: '12px', color: '#666' }}>{agent.phone}</div>
                  </div>
                </td>
                <td style={{ padding: '12px' }}>{agent.internationalVolume.toLocaleString()} XAF</td>
                <td style={{ padding: '12px' }}>{agent.nationalVolume.toLocaleString()} XAF</td>
                <td style={{ padding: '12px' }}>{agent.billPaymentVolume.toLocaleString()} XAF</td>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#4caf50' }}>
                  {agent.totalRevenue.toLocaleString()} XAF
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: agent.performance_score >= 80 ? '#4caf50' : 
                                     agent.performance_score >= 50 ? '#ff9800' : '#f44336',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {agent.performance_score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {agentPerformances.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            Aucune donnée de performance disponible
          </div>
        )}
      </div>
    </div>
  );
};
