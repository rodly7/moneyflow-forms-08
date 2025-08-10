
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Agent {
  id: string;
  user_id: string;
  agent_id: string;
  full_name: string;
  phone: string;
  country: string;
  status: string;
  commission_balance: number;
  balance: number;
  created_at: string;
}

interface AgentTransaction {
  id: string;
  type: string;
  amount: number;
  created_at: string;
  status: string;
}

export const AgentManagementPanel = () => {
  const { profile } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentTransactions, setAgentTransactions] = useState<AgentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [rechargeAmount, setRechargeAmount] = useState(60000);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      // Récupérer les agents avec leurs profils
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('*');

      if (agentsError) throw agentsError;

      if (agentsData) {
        // Récupérer les soldes des profils correspondants
        const agentIds = agentsData.map(agent => agent.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, balance')
          .in('id', agentIds);

        if (profilesError) throw profilesError;

        // Combiner les données
        const agentsWithBalance = agentsData.map(agent => {
          const profile = profilesData?.find(p => p.id === agent.user_id);
          return {
            ...agent,
            balance: profile?.balance || 0
          };
        });

        setAgents(agentsWithBalance);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des agents:', error);
      toast.error('Erreur lors du chargement des agents');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentTransactions = async (agentId: string) => {
    try {
      // Récupérer les transferts
      const { data: transfers } = await supabase
        .from('transfers')
        .select('id, amount, created_at, status')
        .eq('sender_id', agentId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Récupérer les retraits
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('id, amount, created_at, status')
        .eq('user_id', agentId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Récupérer les dépôts
      const { data: deposits } = await supabase
        .from('recharges')
        .select('id, amount, created_at, status')
        .eq('user_id', agentId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Combiner toutes les transactions
      const allTransactions = [
        ...(transfers || []).map(t => ({ ...t, type: 'Transfert' })),
        ...(withdrawals || []).map(w => ({ ...w, type: 'Retrait' })),
        ...(deposits || []).map(d => ({ ...d, type: 'Dépôt' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setAgentTransactions(allTransactions);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
      toast.error('Erreur lors du chargement des transactions');
    }
  };

  const rechargeAgent = async (agentId: string, amount: number) => {
    try {
      // Créditer l'agent
      const { error: creditError } = await supabase.rpc('secure_increment_balance', {
        target_user_id: agentId,
        amount: amount,
        operation_type: 'admin_agent_recharge',
        performed_by: profile?.id
      });

      if (creditError) throw creditError;

      // Débiter l'admin
      const { error: debitError } = await supabase.rpc('secure_increment_balance', {
        target_user_id: profile?.id,
        amount: -amount,
        operation_type: 'admin_agent_recharge_debit',
        performed_by: profile?.id
      });

      if (debitError) throw debitError;

      toast.success(`Agent rechargé de ${amount.toLocaleString()} XAF`);
      fetchAgents(); // Actualiser la liste
    } catch (error) {
      console.error('Erreur lors de la recharge:', error);
      toast.error('Erreur lors de la recharge de l\'agent');
    }
  };

  const autoRechargeAgents = async () => {
    try {
      const lowBalanceAgents = agents.filter(agent => agent.balance < 60000);
      
      if (lowBalanceAgents.length === 0) {
        toast.info('Aucun agent n\'a besoin de recharge');
        return;
      }

      let successCount = 0;
      for (const agent of lowBalanceAgents) {
        try {
          await rechargeAgent(agent.user_id, rechargeAmount);
          successCount++;
        } catch (error) {
          console.error(`Erreur pour l'agent ${agent.full_name}:`, error);
        }
      }

      toast.success(`${successCount}/${lowBalanceAgents.length} agents rechargés`);
    } catch (error) {
      console.error('Erreur lors de la recharge automatique:', error);
      toast.error('Erreur lors de la recharge automatique');
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      fetchAgentTransactions(selectedAgent.user_id);
    }
  }, [selectedAgent]);

  const lowBalanceAgents = agents.filter(agent => agent.balance < 60000);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Chargement des agents...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Panel gauche - Liste des agents */}
        <div style={{ flex: '1' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2>Gestion des Agents ({agents.length})</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(Number(e.target.value))}
                style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  width: '120px'
                }}
                placeholder="Montant"
              />
              <button
                onClick={autoRechargeAgents}
                disabled={lowBalanceAgents.length === 0}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ff9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: lowBalanceAgents.length > 0 ? 'pointer' : 'not-allowed',
                  opacity: lowBalanceAgents.length > 0 ? 1 : 0.5
                }}
              >
                Recharge Auto ({lowBalanceAgents.length})
              </button>
            </div>
          </div>

          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Agent</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Téléphone</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Solde</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Statut</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr 
                    key={agent.id} 
                    style={{ 
                      borderBottom: '1px solid #eee',
                      backgroundColor: selectedAgent?.id === agent.id ? '#e3f2fd' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <td style={{ padding: '12px' }}>
                      <div>
                        <strong>{agent.full_name}</strong>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          ID: {agent.agent_id}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>{agent.phone}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        color: agent.balance < 60000 ? '#d32f2f' : '#2e7d32',
                        fontWeight: 'bold'
                      }}>
                        {agent.balance.toLocaleString()} XAF
                      </span>
                      {agent.balance < 60000 && (
                        <div style={{ fontSize: '10px', color: '#d32f2f' }}>⚠️ Solde faible</div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: 
                          agent.status === 'active' ? '#e8f5e8' : 
                          agent.status === 'pending' ? '#fff3e0' : '#ffebee',
                        color: 
                          agent.status === 'active' ? '#2e7d32' : 
                          agent.status === 'pending' ? '#f57c00' : '#d32f2f'
                      }}>
                        {agent.status === 'active' ? 'Actif' : 
                         agent.status === 'pending' ? 'En attente' : 'Inactif'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          rechargeAgent(agent.user_id, rechargeAmount);
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#2196f3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Recharger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel droit - Détails de l'agent sélectionné */}
        {selectedAgent && (
          <div style={{ width: '400px' }}>
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              padding: '20px'
            }}>
              <h3 style={{ margin: '0 0 15px 0' }}>
                Détails : {selectedAgent.full_name}
              </h3>
              
              <div style={{ marginBottom: '20px' }}>
                <p><strong>ID Agent:</strong> {selectedAgent.agent_id}</p>
                <p><strong>Téléphone:</strong> {selectedAgent.phone}</p>
                <p><strong>Pays:</strong> {selectedAgent.country}</p>
                <p><strong>Solde actuel:</strong> {selectedAgent.balance.toLocaleString()} XAF</p>
                <p><strong>Commission:</strong> {selectedAgent.commission_balance.toLocaleString()} XAF</p>
              </div>

              <h4>Transactions récentes</h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {agentTransactions.length > 0 ? (
                  agentTransactions.map((transaction) => (
                    <div 
                      key={transaction.id}
                      style={{
                        padding: '10px',
                        borderBottom: '1px solid #eee',
                        fontSize: '14px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{transaction.type}</span>
                        <span style={{ fontWeight: 'bold' }}>
                          {transaction.amount.toLocaleString()} XAF
                        </span>
                      </div>
                      <div style={{ color: '#666', fontSize: '12px' }}>
                        {new Date(transaction.created_at).toLocaleDateString()} - {transaction.status}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>
                    Aucune transaction récente
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
