
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AdminStats {
  totalUsers: number;
  totalAgents: number;
  pendingWithdrawals: number;
  totalTransfers: number;
  systemBalance: number;
}

export const SimpleAdminDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalAgents: 0,
    pendingWithdrawals: 0,
    totalTransfers: 0,
    systemBalance: 0
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const [usersRes, agentsRes, withdrawalsRes, transfersRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('agents').select('id', { count: 'exact' }),
        supabase.from('withdrawals').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('transfers').select('id', { count: 'exact' })
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalAgents: agentsRes.count || 0,
        pendingWithdrawals: withdrawalsRes.count || 0,
        totalTransfers: transfersRes.count || 0,
        systemBalance: 0
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Chargement des statistiques...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px', borderBottom: '2px solid #ddd', paddingBottom: '15px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', color: '#333' }}>
          Administration SendFlow
        </h1>
        <p style={{ margin: '5px 0 0 0', color: '#666' }}>
          Tableau de bord administrateur - {profile?.full_name}
        </p>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          border: '1px solid #ddd', 
          padding: '20px', 
          backgroundColor: '#f9f9f9',
          borderRadius: '4px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>Utilisateurs</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{stats.totalUsers}</p>
          <small style={{ color: '#666' }}>Total des comptes</small>
        </div>

        <div style={{ 
          border: '1px solid #ddd', 
          padding: '20px', 
          backgroundColor: '#f9f9f9',
          borderRadius: '4px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#009900' }}>Agents</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{stats.totalAgents}</p>
          <small style={{ color: '#666' }}>Agents actifs</small>
        </div>

        <div style={{ 
          border: '1px solid #ddd', 
          padding: '20px', 
          backgroundColor: '#f9f9f9',
          borderRadius: '4px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#ff6600' }}>Retraits en attente</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{stats.pendingWithdrawals}</p>
          <small style={{ color: '#666' }}>À traiter</small>
        </div>

        <div style={{ 
          border: '1px solid #ddd', 
          padding: '20px', 
          backgroundColor: '#f9f9f9',
          borderRadius: '4px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#cc0066' }}>Transferts</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{stats.totalTransfers}</p>
          <small style={{ color: '#666' }}>Total des transferts</small>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2 style={{ marginBottom: '15px', color: '#333' }}>Actions rapides</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            style={{
              padding: '12px 20px',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onClick={() => window.location.href = '/admin-users'}
          >
            Gérer les utilisateurs
          </button>
          
          <button 
            style={{
              padding: '12px 20px',
              backgroundColor: '#009900',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onClick={() => window.location.href = '/admin-agents'}
          >
            Gérer les agents
          </button>
          
          <button 
            style={{
              padding: '12px 20px',
              backgroundColor: '#ff6600',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onClick={() => window.location.href = '/admin-treasury'}
          >
            Trésorerie
          </button>
          
          <button 
            style={{
              padding: '12px 20px',
              backgroundColor: '#cc0066',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onClick={loadStats}
          >
            Actualiser
          </button>
        </div>
      </div>
    </div>
  );
};
