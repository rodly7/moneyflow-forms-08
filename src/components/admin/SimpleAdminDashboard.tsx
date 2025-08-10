
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/integrations/supabase/client';

interface AdminStats {
  totalUsers: number;
  totalAgents: number;
  pendingWithdrawals: number;
  totalTransfers: number;
  systemBalance: number;
  todayRevenue: number;
}

export const SimpleAdminDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalAgents: 0,
    pendingWithdrawals: 0,
    totalTransfers: 0,
    systemBalance: 0,
    todayRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setError(null);
      console.log('🔄 Chargement des statistiques admin...');

      // Statistiques utilisateurs
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, balance, role', { count: 'exact' });

      if (usersError) throw usersError;

      // Statistiques agents
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id, status', { count: 'exact' });

      if (agentsError) throw agentsError;

      // Retraits en attente
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');

      if (withdrawalsError) throw withdrawalsError;

      // Transferts du jour
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: transfers, error: transfersError } = await supabase
        .from('transfers')
        .select('id, fees', { count: 'exact' })
        .gte('created_at', today.toISOString());

      if (transfersError) throw transfersError;

      // Calculer le solde système (balance admin)
      const adminUser = users?.find(u => u.role === 'admin');
      const systemBalance = adminUser?.balance || 0;

      // Calculer les revenus du jour (60% des frais)
      const todayRevenue = transfers?.reduce((sum, t) => sum + ((t.fees || 0) * 0.6), 0) || 0;

      const newStats = {
        totalUsers: users?.length || 0,
        totalAgents: agents?.length || 0,
        pendingWithdrawals: withdrawals?.length || 0,
        totalTransfers: transfers?.length || 0,
        systemBalance,
        todayRevenue
      };

      console.log('✅ Statistiques chargées:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('❌ Erreur chargement stats:', error);
      setError('Erreur lors du chargement des statistiques');
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
        <div style={{ 
          display: 'inline-block', 
          width: '20px', 
          height: '20px', 
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #0066cc',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '10px'
        }}></div>
        <p>Chargement des statistiques...</p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#cc0000' }}>
        <p>⚠️ {error}</p>
        <button 
          onClick={loadStats}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Réessayer
        </button>
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
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>👥</span>
            <h3 style={{ margin: 0, color: '#0066cc' }}>Utilisateurs</h3>
          </div>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0' }}>{stats.totalUsers}</p>
          <small style={{ color: '#666' }}>Total des comptes</small>
        </div>

        <div style={{ 
          border: '1px solid #ddd', 
          padding: '20px', 
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>🏪</span>
            <h3 style={{ margin: 0, color: '#009900' }}>Agents</h3>
          </div>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0' }}>{stats.totalAgents}</p>
          <small style={{ color: '#666' }}>Agents enregistrés</small>
        </div>

        <div style={{ 
          border: '1px solid #ddd', 
          padding: '20px', 
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>⏳</span>
            <h3 style={{ margin: 0, color: '#ff6600' }}>Retraits en attente</h3>
          </div>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0' }}>{stats.pendingWithdrawals}</p>
          <small style={{ color: '#666' }}>À traiter</small>
        </div>

        <div style={{ 
          border: '1px solid #ddd', 
          padding: '20px', 
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>💸</span>
            <h3 style={{ margin: 0, color: '#cc0066' }}>Transferts aujourd'hui</h3>
          </div>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0' }}>{stats.totalTransfers}</p>
          <small style={{ color: '#666' }}>Transactions du jour</small>
        </div>

        <div style={{ 
          border: '1px solid #ddd', 
          padding: '20px', 
          backgroundColor: '#f0f8ff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>💰</span>
            <h3 style={{ margin: 0, color: '#0066cc' }}>Solde système</h3>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0', color: '#0066cc' }}>
            {formatCurrency(stats.systemBalance)}
          </p>
          <small style={{ color: '#666' }}>Balance administrative</small>
        </div>

        <div style={{ 
          border: '1px solid #ddd', 
          padding: '20px', 
          backgroundColor: '#f0fff0',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>📈</span>
            <h3 style={{ margin: 0, color: '#009900' }}>Revenus aujourd'hui</h3>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0', color: '#009900' }}>
            {formatCurrency(stats.todayRevenue)}
          </p>
          <small style={{ color: '#666' }}>Commission plateforme</small>
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
              fontSize: '14px',
              textDecoration: 'none',
              display: 'inline-block'
            }}
            onClick={() => window.location.href = '/simple-main-admin-dashboard'}
          >
            📊 Tableau de bord complet
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
            onClick={loadStats}
          >
            🔄 Actualiser
          </button>
        </div>
      </div>
    </div>
  );
};
