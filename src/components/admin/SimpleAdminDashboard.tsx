
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/integrations/supabase/client';

interface AdminStats {
  totalUsers: number;
  totalAgents: number;
  activeAgents: number;
  pendingWithdrawals: number;
  totalTransfers: number;
  systemBalance: number;
  todayRevenue: number;
  pendingTransactions: number;
  completedTransactions: number;
  totalVolume: number;
  newUsersToday: number;
}

export const SimpleAdminDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalAgents: 0,
    activeAgents: 0,
    pendingWithdrawals: 0,
    totalTransfers: 0,
    systemBalance: 0,
    todayRevenue: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
    totalVolume: 0,
    newUsersToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadStats = async () => {
    try {
      setError(null);
      console.log('🔄 Chargement des statistiques admin...');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Statistiques utilisateurs
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, balance, role, created_at', { count: 'exact' });

      if (usersError) throw usersError;

      // Nouveaux utilisateurs aujourd'hui
      const newUsersToday = users?.filter(u => 
        new Date(u.created_at) >= today
      ).length || 0;

      // Statistiques agents avec statut
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id, status, user_id, commission_balance', { count: 'exact' });

      if (agentsError) throw agentsError;

      const totalAgents = agents?.length || 0;
      const activeAgents = agents?.filter(a => a.status === 'active').length || 0;

      // Retraits en attente
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('id, amount', { count: 'exact' })
        .eq('status', 'pending');

      if (withdrawalsError) throw withdrawalsError;

      // Transferts aujourd'hui
      const { data: todayTransfers, error: todayTransfersError } = await supabase
        .from('transfers')
        .select('id, amount, fees, status', { count: 'exact' })
        .gte('created_at', today.toISOString());

      if (todayTransfersError) throw todayTransfersError;

      // Tous les transferts pour le volume total
      const { data: allTransfers, error: allTransfersError } = await supabase
        .from('transfers')
        .select('amount, fees, status');

      if (allTransfersError) throw allTransfersError;

      // Calculer les statistiques
      const totalVolume = allTransfers?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const todayRevenue = todayTransfers?.reduce((sum, t) => sum + ((t.fees || 0) * 0.6), 0) || 0;
      const pendingTransactions = todayTransfers?.filter(t => t.status === 'pending').length || 0;
      const completedTransactions = todayTransfers?.filter(t => t.status === 'completed').length || 0;

      // Balance admin (utilisateur principal)
      const adminUser = users?.find(u => u.role === 'admin');
      const systemBalance = adminUser?.balance || 0;

      const newStats = {
        totalUsers: users?.length || 0,
        totalAgents,
        activeAgents,
        pendingWithdrawals: withdrawals?.length || 0,
        totalTransfers: todayTransfers?.length || 0,
        systemBalance,
        todayRevenue,
        pendingTransactions,
        completedTransactions,
        totalVolume,
        newUsersToday
      };

      console.log('✅ Statistiques chargées:', newStats);
      setStats(newStats);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Erreur chargement stats:', error);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh toutes les 10 secondes
  useEffect(() => {
    loadStats();
    
    const interval = setInterval(() => {
      loadStats();
    }, 10000); // 10 secondes

    return () => clearInterval(interval);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', color: '#333' }}>
              🔄 Administration SendFlow
            </h1>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>
              Tableau de bord administrateur - {profile?.full_name}
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#666' }}>
            <p>Auto-refresh: 10s</p>
            <p>Dernière MAJ: {lastUpdate.toLocaleTimeString('fr-FR')}</p>
          </div>
        </div>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Utilisateurs */}
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
          <small style={{ color: '#666' }}>
            Total des comptes | +{stats.newUsersToday} aujourd'hui
          </small>
        </div>

        {/* Agents */}
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
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0' }}>{stats.activeAgents}/{stats.totalAgents}</p>
          <small style={{ color: '#666' }}>Agents actifs/total</small>
        </div>

        {/* Transactions du jour */}
        <div style={{ 
          border: '1px solid #ddd', 
          padding: '20px', 
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>💸</span>
            <h3 style={{ margin: 0, color: '#cc0066' }}>Transactions aujourd'hui</h3>
          </div>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0' }}>{stats.totalTransfers}</p>
          <small style={{ color: '#666' }}>
            ✅ {stats.completedTransactions} complétées | ⏳ {stats.pendingTransactions} en attente
          </small>
        </div>

        {/* Retraits en attente */}
        <div style={{ 
          border: '1px solid #ddd', 
          padding: '20px', 
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>⏳</span>
            <h3 style={{ margin: 0, color: '#ff6600' }}>Retraits en attente</h3>
          </div>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0', color: '#ff6600' }}>
            {stats.pendingWithdrawals}
          </p>
          <small style={{ color: '#666' }}>À traiter</small>
        </div>

        {/* Volume total */}
        <div style={{ 
          border: '1px solid #ddd', 
          padding: '20px', 
          backgroundColor: '#e8f4f8',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>📊</span>
            <h3 style={{ margin: 0, color: '#0066cc' }}>Volume total</h3>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0', color: '#0066cc' }}>
            {formatCurrency(stats.totalVolume)}
          </p>
          <small style={{ color: '#666' }}>Toutes transactions</small>
        </div>

        {/* Solde système */}
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

        {/* Revenus aujourd'hui */}
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
          <small style={{ color: '#666' }}>Commission plateforme (60%)</small>
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
            🔄 Actualiser maintenant
          </button>

          {stats.pendingWithdrawals > 0 && (
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
              onClick={() => alert('Redirection vers gestion des retraits')}
            >
              ⚠️ {stats.pendingWithdrawals} retrait(s) en attente
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
