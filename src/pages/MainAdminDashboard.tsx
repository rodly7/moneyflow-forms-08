
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMainAdmin } from '@/hooks/useMainAdmin';
import SimpleAdvancedTab from '@/components/admin/SimpleAdvancedTab';
import SimpleAgentsTab from '@/components/admin/SimpleAgentsTab';
import { SimpleTreasuryTab } from '@/components/admin/SimpleTreasuryTab';
import SimpleSettingsTab from '@/components/admin/SimpleSettingsTab';
import { SimpleMessagesTab } from '@/components/admin/SimpleMessagesTab';
import AdminReportsTab from '@/components/admin/AdminReportsTab';
import ExactTransactionMonitor from '@/components/admin/ExactTransactionMonitor';
import EnhancedTreasuryTab from '@/components/admin/EnhancedTreasuryTab';

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
    { id: 'reports', label: 'Rapports Précis', icon: '📈' },
    { id: 'advanced', label: 'Dashboard Avancé', icon: '⚙️' },
    { id: 'agents', label: 'Gestion des Agents', icon: '👥' },
    { id: 'treasury', label: 'Trésorerie Exacte', icon: '💰' },
    { id: 'monitoring', label: 'Surveillance Transactions', icon: '🔍' },
    { id: 'settings', label: 'Paramètres Système', icon: '🔧' },
    { id: 'messages', label: 'Messages & Notifications', icon: '💬' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px' }}>Dashboard Principal - Administrateur</h2>
            <p>Bienvenue dans le tableau de bord principal administrateur avec données exactes.</p>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '20px', 
              marginTop: '30px' 
            }}>
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#f0f9ff', 
                borderRadius: '8px', 
                border: '1px solid #0ea5e9' 
              }}>
                <h3 style={{ color: '#0369a1', marginBottom: '10px' }}>📈 Nouveautés</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ padding: '5px 0', color: '#0369a1' }}>✅ Rapports hebdomadaires et mensuels précis</li>
                  <li style={{ padding: '5px 0', color: '#0369a1' }}>✅ Surveillance des transactions en temps réel</li>
                  <li style={{ padding: '5px 0', color: '#0369a1' }}>✅ Calculs de revenus exacts SendFlow</li>
                  <li style={{ padding: '5px 0', color: '#0369a1' }}>✅ Données agents et sous-admins détaillées</li>
                </ul>
              </div>
            </div>
          </div>
        );
      case 'reports':
        return <AdminReportsTab />;
      case 'advanced':
        return <SimpleAdvancedTab />;
      case 'agents':
        return <SimpleAgentsTab />;
      case 'treasury':
        return <EnhancedTreasuryTab />;
      case 'monitoring':
        return <ExactTransactionMonitor />;
      case 'settings':
        return <SimpleSettingsTab />;
      case 'messages':
        return <SimpleMessagesTab />;
      default:
        return (
          <div style={{ padding: '20px' }}>
            <h2>Contenu par défaut</h2>
          </div>
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
              Administration SendFlow
            </h1>
            <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>
              Tableau de bord avec données exactes et surveillance avancée
            </p>
          </div>
          <div style={{ 
            backgroundColor: '#0ea5e9', 
            color: 'white', 
            padding: '8px 16px', 
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Admin Principal ✨
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e2e8f0',
        overflowX: 'auto'
      }}>
        <div style={{ 
          display: 'flex', 
          padding: '0 20px',
          minWidth: 'max-content'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '16px 20px',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === tab.id ? '#0ea5e9' : '#64748b',
                borderBottom: activeTab === tab.id ? '2px solid #0ea5e9' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '500',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        {renderTabContent()}
      </div>
    </div>
  );
}
