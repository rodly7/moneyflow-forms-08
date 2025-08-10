
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMainAdmin } from '@/hooks/useMainAdmin';
import { SimpleAdminDashboard } from '@/components/admin/SimpleAdminDashboard';
import { SimpleUsersList } from '@/components/admin/SimpleUsersList';
import { SimpleTransactionsList } from '@/components/admin/SimpleTransactionsList';
import LogoutButton from '@/components/auth/LogoutButton';
import { AdminUsersManagement } from '@/components/admin/AdminUsersManagement';
import { AgentManagementPanel } from '@/components/admin/AgentManagementPanel';
import { RevenueAnalytics } from '@/components/admin/RevenueAnalytics';
import { SimpleSettingsTab } from '@/components/admin/SimpleSettingsTab';
import { SimpleMessagesTab } from '@/components/admin/SimpleMessagesTab';

export default function SimpleMainAdminDashboard() {
  const { user, profile } = useAuth();
  const { isMainAdmin } = useMainAdmin();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user || !profile) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Chargement...</h2>
        <p>Veuillez patienter pendant le chargement des informations d'authentification.</p>
      </div>
    );
  }

  if (profile.role !== 'admin') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Accès refusé</h2>
        <p>Vous n'avez pas les autorisations nécessaires pour accéder à cette page.</p>
      </div>
    );
  }

  if (!isMainAdmin) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Accès refusé</h2>
        <p>Seul l'administrateur principal peut accéder à cette page.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
    { id: 'users', label: 'Gestion Utilisateurs', icon: '👥' },
    { id: 'agents', label: 'Gestion Agents', icon: '🔧' },
    { id: 'revenue', label: 'Revenus & Analytics', icon: '💰' },
    { id: 'transactions', label: 'Transactions', icon: '💸' },
    { id: 'messages', label: 'Messages', icon: '📨' },
    { id: 'settings', label: 'Paramètres', icon: '⚙️' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <SimpleAdminDashboard />;
      case 'users':
        return <AdminUsersManagement />;
      case 'agents':
        return <AgentManagementPanel />;
      case 'revenue':
        return <RevenueAnalytics />;
      case 'transactions':
        return <SimpleTransactionsList />;
      case 'messages':
        return <SimpleMessagesTab />;
      case 'settings':
        return <SimpleSettingsTab />;
      default:
        return <SimpleAdminDashboard />;
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header avec bouton de déconnexion */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '2px solid #ddd',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>Administration Sendflow</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
            Connecté en tant que: {profile.full_name} ({profile.phone})
          </p>
        </div>
        <LogoutButton />
      </div>

      {/* Navigation */}
      <nav style={{ 
        backgroundColor: 'white', 
        borderBottom: '2px solid #ddd',
        padding: '0'
      }}>
        <div style={{ 
          display: 'flex',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '15px 25px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#0066cc' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                borderBottom: activeTab === tab.id ? '3px solid #004499' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Contenu */}
      <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {renderTabContent()}
      </main>
    </div>
  );
}
