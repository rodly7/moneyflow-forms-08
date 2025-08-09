
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SimpleAgentsTab = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select(`
          *,
          profiles:user_id (
            full_name,
            phone,
            country
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Erreur chargement agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAgentStatus = async (agentId, newStatus) => {
    try {
      const { error } = await supabase
        .from('agents')
        .update({ status: newStatus })
        .eq('id', agentId);

      if (error) throw error;
      fetchAgents();
      alert(`Statut de l'agent mis à jour: ${newStatus}`);
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Chargement des agents...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
          👥 Gestion des Agents
        </h2>
        <div style={{ 
          padding: '8px 16px', 
          backgroundColor: '#fef3c7', 
          color: '#92400e', 
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {agents.length} agents
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>
                Nom
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>
                Téléphone
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>
                Pays
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>
                Statut
              </th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent, index) => (
              <tr key={agent.id} style={{ borderBottom: index < agents.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <td style={{ padding: '12px', color: '#1f2937' }}>
                  {agent.profiles?.full_name || agent.full_name || 'N/A'}
                </td>
                <td style={{ padding: '12px', color: '#6b7280' }}>
                  {agent.profiles?.phone || agent.phone || 'N/A'}
                </td>
                <td style={{ padding: '12px', color: '#6b7280' }}>
                  {agent.profiles?.country || 'N/A'}
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: agent.status === 'active' ? '#dcfce7' : 
                                    agent.status === 'pending' ? '#fef3c7' : '#fecaca',
                    color: agent.status === 'active' ? '#16a34a' : 
                           agent.status === 'pending' ? '#ca8a04' : '#dc2626'
                  }}>
                    {agent.status === 'active' ? 'Actif' : 
                     agent.status === 'pending' ? 'En attente' : 'Suspendu'}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {agent.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateAgentStatus(agent.id, 'active')}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#16a34a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          marginRight: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => updateAgentStatus(agent.id, 'rejected')}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Rejeter
                      </button>
                    </>
                  )}
                  {agent.status === 'active' && (
                    <button
                      onClick={() => updateAgentStatus(agent.id, 'suspended')}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#ea580c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Suspendre
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SimpleAgentsTab;
