import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMainAdmin } from '@/hooks/useMainAdmin';
import { SimpleAdvancedTab } from '@/components/admin/SimpleAdvancedTab';
import { SimpleAgentsTab } from '@/components/admin/SimpleAgentsTab';
import { SimpleTreasuryTab } from '@/components/admin/SimpleTreasuryTab';
import { SimpleSettingsTab } from '@/components/admin/SimpleSettingsTab';
import { SimpleMessagesTab } from '@/components/admin/SimpleMessagesTab';

export default function MainAdminDashboard() {
  const { user, profile } = useAuth();
  const { isMainAdmin } = useMainAdmin();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!user) {
      console.log('Pas d\'utilisateur connecté.');
    }
  }, [user]);

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      console.log('Accès non autorisé.');
    }
  }, [profile]);

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
    { id: 'dashboard', label: 'Dashboard Principal', icon: '📊' },
    { id: 'advanced', label: 'Dashboard Avancé', icon: '⚙️' },
    { id: 'agents', label: 'Gestion des Agents', icon: '👥' },
    { id: 'treasury', label: 'Trésorerie', icon: '💰' },
    { id: 'settings', label: 'Paramètres Système', icon: '🔧' },
    { id: 'messages', label: 'Messages & Notifications', icon: '💬' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px' }}>Dashboard Principal - Administrateur</h2>
            <p>Bienvenue dans le tableau de bord principal administrateur.</p>
          </div>
        );
      case 'advanced':
        return <SimpleAdvancedTab />;
      case 'agents':
        return <SimpleAgentsTab />;
      case 'treasury':
        return <SimpleTreasuryTab />;
      case 'settings':
        return <SimpleSettingsTab />;
      case 'messages':
        return <SimpleMessagesTab />;
      default:
        return <div>Onglet non trouvé</div>;
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Navigation tabs */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #ddd', padding: '0' }}>
        <div style={{ display: 'flex', overflowX: 'auto' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '15px 20px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#007bff' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#333',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid #007bff' : 'none',
                whiteSpace: 'nowrap',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1 }}>
        {renderTabContent()}
      </div>
    </div>
  );
}
