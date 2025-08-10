
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMainAdmin } from '@/hooks/useMainAdmin';
import { SimpleAdminDashboard } from '@/components/admin/SimpleAdminDashboard';
import { SimpleUsersList } from '@/components/admin/SimpleUsersList';
import { SimpleTransactionsList } from '@/components/admin/SimpleTransactionsList';

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
    { id: 'users', label: 'Utilisateurs', icon: '👥' },
    { id: 'transactions', label: 'Transactions', icon: '💸' },
    { id: 'settings', label: 'Paramètres', icon: '⚙️' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <SimpleAdminDashboard />;
      case 'users':
        return <SimpleUsersList />;
      case 'transactions':
        return <SimpleTransactionsList />;
      case 'settings':
        return (
          <div style={{ padding: '20px' }}>
            <h2>Paramètres système</h2>
            <p>Configuration et paramètres avancés du système.</p>
            <div style={{ marginTop: '20px' }}>
              <button
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#cc0000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir redémarrer le système ?')) {
                    alert('Redémarrage du système...');
                  }
                }}
              >
                Redémarrer système
              </button>
              <button
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#ff6600',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => alert('Sauvegarde en cours...')}
              >
                Sauvegarder données
              </button>
            </div>
          </div>
        );
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
