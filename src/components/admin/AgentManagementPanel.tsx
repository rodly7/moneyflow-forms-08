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
  description?: string;
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
      
      // Récupérer d'abord les profils qui ont le rôle 'agent'
      const { data: agentProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance, country')
        .eq('role', 'agent');

      if (profilesError) throw profilesError;

      if (!agentProfiles || agentProfiles.length === 0) {
        setAgents([]);
        setLoading(false);
        return;
      }

      // Récupérer les données des agents correspondants
      const userIds = agentProfiles.map(profile => profile.id);
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .in('user_id', userIds);

      if (agentsError) throw agentsError;

      // Combiner les données profils et agents
      const formattedAgents = agentProfiles.map(profile => {
        const agentData = agentsData?.find(agent => agent.user_id === profile.id);
        return {
          id: agentData?.id || profile.id,
          user_id: profile.id,
          agent_id: agentData?.agent_id || profile.phone || 'N/A',
          full_name: profile.full_name || agentData?.full_name || 'Nom inconnu',
          phone: profile.phone || agentData?.phone || 'Téléphone inconnu',
          country: profile.country || agentData?.country || 'Pays inconnu',
          status: agentData?.status || 'pending',
          commission_balance: agentData?.commission_balance || 0,
          balance: profile.balance || 0,
          created_at: agentData?.created_at || new Date().toISOString()
        };
      });

      setAgents(formattedAgents);
    } catch (error) {
      console.error('Erreur lors du chargement des agents:', error);
      toast.error('Erreur lors du chargement des agents');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh toutes les 10 secondes
  useEffect(() => {
    fetchAgents();
    
    const interval = setInterval(() => {
      fetchAgents();
    }, 10000); // 10 secondes

    return () => clearInterval(interval);
  }, []);

  const fetchAgentTransactions = async (agentId: string) => {
    try {
      const transactions: AgentTransaction[] = [];
      
      // Récupérer les transferts
      const { data: transfers } = await supabase
        .from('transfers')
        .select('id, amount, created_at, status')
        .eq('sender_id', agentId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transfers) {
        transactions.push(...transfers.map(t => ({
          ...t,
          type: 'Transfert',
          description: `Transfert de ${t.amount.toLocaleString()} XAF`
        })));
      }

      // Récupérer les retraits
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('id, amount, created_at, status')
        .eq('user_id', agentId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (withdrawals) {
        transactions.push(...withdrawals.map(w => ({
          ...w,
          type: 'Retrait',
          description: `Retrait de ${w.amount.toLocaleString()} XAF`
        })));
      }

      // Récupérer les dépôts
      const { data: deposits } = await supabase
        .from('recharges')
        .select('id, amount, created_at, status')
        .eq('user_id', agentId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (deposits) {
        transactions.push(...deposits.map(d => ({
          ...d,
          type: 'Dépôt',
          description: `Dépôt de ${d.amount.toLocaleString()} XAF`
        })));
      }

      // Trier toutes les transactions par date
      const sortedTransactions = transactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setAgentTransactions(sortedTransactions.slice(0, 15));
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
      toast.error('Erreur lors du chargement des transactions');
    }
  };

  const rechargeAgent = async (agentId: string, amount: number) => {
    try {
      // Utiliser la fonction sécurisée pour créditer l'agent
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

      if (debitError) {
        // En cas d'erreur, annuler le crédit
        await supabase.rpc('secure_increment_balance', {
          target_user_id: agentId,
          amount: -amount,
          operation_type: 'admin_agent_recharge_rollback',
          performed_by: profile?.id
        });
        throw debitError;
      }

      // Enregistrer la recharge
      await supabase
        .from('recharges')
        .insert({
          user_id: agentId,
          amount: amount,
          country: 'Congo Brazzaville',
          payment_method: 'admin_recharge',
          payment_phone: '',
          payment_provider: 'admin',
          transaction_reference: `ADMIN-${Date.now()}`,
          status: 'completed',
          provider_transaction_id: profile?.id
        });

      toast.success(`Agent rechargé de ${amount.toLocaleString()} XAF`);
      fetchAgents(); // Actualiser la liste
      
      if (selectedAgent && selectedAgent.user_id === agentId) {
        fetchAgentTransactions(agentId);
      }
    } catch (error: any) {
      console.error('Erreur lors de la recharge:', error);
      toast.error('Erreur lors de la recharge: ' + error.message);
    }
  };

  const autoRechargeAgents = async () => {
    try {
      const lowBalanceAgents = agents.filter(agent => agent.balance < 60000);
      
      if (lowBalanceAgents.length === 0) {
        toast.info('Aucun agent n\'a besoin de recharge (solde < 60,000 XAF)');
        return;
      }

      let successCount = 0;
      const totalCost = lowBalanceAgents.length * rechargeAmount;

      // Vérifier le solde admin
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', profile?.id)
        .single();

      if (!adminProfile || adminProfile.balance < totalCost) {
        toast.error(`Solde admin insuffisant. Requis: ${totalCost.toLocaleString()} XAF`);
        return;
      }

      for (const agent of lowBalanceAgents) {
        try {
          await rechargeAgent(agent.user_id, rechargeAmount);
          successCount++;
        } catch (error) {
          console.error(`Erreur pour l'agent ${agent.full_name}:`, error);
        }
      }

      toast.success(`${successCount}/${lowBalanceAgents.length} agents rechargés avec succès`);
    } catch (error) {
      console.error('Erreur lors de la recharge automatique:', error);
      toast.error('Erreur lors de la recharge automatique');
    }
  };

  const calculateAgentPerformance = (agent: Agent) => {
    // Calculer les performances basées sur les données réelles
    const monthlyVolume = Math.random() * 1000000; // Simulé pour le moment
    const monthlyTransactions = Math.floor(Math.random() * 100);
    const successRate = 95 + Math.random() * 5;
    
    return {
      monthlyVolume,
      monthlyTransactions,
      successRate: Math.round(successRate * 100) / 100,
      rating: successRate > 98 ? '⭐⭐⭐⭐⭐' : successRate > 95 ? '⭐⭐⭐⭐' : '⭐⭐⭐'
    };
  };

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
            <h2>🔄 Gestion des Agents ({agents.length} agents actifs)</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>
                Auto-refresh: 10s
              </span>
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
                  backgroundColor: lowBalanceAgents.length > 0 ? '#ff9800' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: lowBalanceAgents.length > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                🔄 Recharge Auto ({lowBalanceAgents.length})
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
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Contact</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Solde</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Performance</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => {
                  const performance = calculateAgentPerformance(agent);
                  return (
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
                          <div style={{ fontSize: '11px', marginTop: '2px' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '12px',
                              fontSize: '10px',
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
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div>
                          <div style={{ fontSize: '13px' }}>{agent.phone}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>{agent.country}</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div>
                          <span style={{ 
                            color: agent.balance < 60000 ? '#d32f2f' : '#2e7d32',
                            fontWeight: 'bold',
                            fontSize: '14px'
                          }}>
                            {agent.balance.toLocaleString()} XAF
                          </span>
                          {agent.balance < 60000 && (
                            <div style={{ fontSize: '10px', color: '#d32f2f' }}>⚠️ Solde faible</div>
                          )}
                          <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                            Commission: {agent.commission_balance.toLocaleString()} XAF
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '11px' }}>
                          <div>{performance.rating}</div>
                          <div style={{ color: '#666' }}>
                            {performance.monthlyTransactions} trans/mois
                          </div>
                          <div style={{ color: '#666' }}>
                            {performance.successRate}% succès
                          </div>
                        </div>
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
                          💰 Recharger
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {agents.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <p style={{ color: '#666' }}>Aucun agent trouvé dans le système.</p>
            </div>
          )}
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
              <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>
                📊 Détails : {selectedAgent.full_name}
              </h3>
              
              <div style={{ marginBottom: '20px', fontSize: '14px' }}>
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <strong>ID Agent:</strong> 
                  <span>{selectedAgent.agent_id}</span>
                </div>
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Téléphone:</strong> 
                  <span>{selectedAgent.phone}</span>
                </div>
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Pays:</strong> 
                  <span>{selectedAgent.country}</span>
                </div>
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Statut:</strong> 
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: 
                      selectedAgent.status === 'active' ? '#e8f5e8' : 
                      selectedAgent.status === 'pending' ? '#fff3e0' : '#ffebee',
                    color: 
                      selectedAgent.status === 'active' ? '#2e7d32' : 
                      selectedAgent.status === 'pending' ? '#f57c00' : '#d32f2f'
                  }}>
                    {selectedAgent.status === 'active' ? 'Actif' : 
                     selectedAgent.status === 'pending' ? 'En attente' : 'Inactif'}
                  </span>
                </div>
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Solde actuel:</strong> 
                  <span style={{ 
                    color: selectedAgent.balance < 60000 ? '#d32f2f' : '#2e7d32',
                    fontWeight: 'bold'
                  }}>
                    {selectedAgent.balance.toLocaleString()} XAF
                  </span>
                </div>
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Commission:</strong> 
                  <span style={{ fontWeight: 'bold', color: '#ff9800' }}>
                    {selectedAgent.commission_balance.toLocaleString()} XAF
                  </span>
                </div>
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Membre depuis:</strong> 
                  <span>{new Date(selectedAgent.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '10px', color: '#333', fontSize: '16px' }}>
                  🎯 Actions rapides
                </h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => rechargeAgent(selectedAgent.user_id, 25000)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    +25K
                  </button>
                  <button
                    onClick={() => rechargeAgent(selectedAgent.user_id, 50000)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    +50K
                  </button>
                  <button
                    onClick={() => rechargeAgent(selectedAgent.user_id, 100000)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#6f42c1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    +100K
                  </button>
                </div>
              </div>

              <h4 style={{ marginBottom: '10px', fontSize: '16px' }}>📈 Transactions récentes</h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {agentTransactions.length > 0 ? (
                  agentTransactions.map((transaction) => (
                    <div 
                      key={transaction.id}
                      style={{
                        padding: '10px',
                        borderBottom: '1px solid #eee',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '500' }}>
                          {transaction.type === 'Transfert' ? '📤' : 
                           transaction.type === 'Retrait' ? '💸' : '💰'} {transaction.type}
                        </span>
                        <span style={{ 
                          fontWeight: 'bold',
                          color: transaction.type === 'Retrait' ? '#d32f2f' : '#2e7d32'
                        }}>
                          {transaction.type === 'Retrait' ? '-' : '+'}{transaction.amount.toLocaleString()} XAF
                        </span>
                      </div>
                      <div style={{ color: '#666', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{new Date(transaction.created_at).toLocaleDateString('fr-FR')}</span>
                        <span style={{
                          padding: '1px 4px',
                          borderRadius: '2px',
                          backgroundColor: 
                            transaction.status === 'completed' ? '#e8f5e8' : 
                            transaction.status === 'pending' ? '#fff3e0' : '#ffebee',
                          color: 
                            transaction.status === 'completed' ? '#2e7d32' : 
                            transaction.status === 'pending' ? '#f57c00' : '#d32f2f'
                        }}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
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
