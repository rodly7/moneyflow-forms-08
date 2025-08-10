
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMainAdmin } from '@/hooks/useMainAdmin';
import { SimpleAdminDashboard } from '@/components/admin/SimpleAdminDashboard';
import { AdminUsersManagement } from '@/components/admin/AdminUsersManagement';
import { AgentManagementPanel } from '@/components/admin/AgentManagementPanel';
import { RevenueAnalytics } from '@/components/admin/RevenueAnalytics';
import { SimpleTransactionsList } from '@/components/admin/SimpleTransactionsList';
import LogoutButton from '@/components/auth/LogoutButton';

export default function MainAdminDashboard() {
  const { user, profile } = useAuth();
  const { isMainAdmin } = useMainAdmin();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Chargement...</h2>
          <p className="text-gray-600">Veuillez patienter pendant le chargement des informations d'authentification.</p>
        </div>
      </div>
    );
  }

  if (profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Accès refusé</h2>
          <p className="text-gray-600">Vous n'avez pas les autorisations nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (!isMainAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Accès refusé</h2>
          <p className="text-gray-600">Seul l'administrateur principal peut accéder à cette page.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
    { id: 'users', label: 'Gestion Utilisateurs', icon: '👥' },
    { id: 'agents', label: 'Gestion Agents', icon: '🔧' },
    { id: 'revenue', label: 'Revenus & Analytics', icon: '💰' },
    { id: 'transactions', label: 'Transactions', icon: '💸' },
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
      case 'settings':
        return (
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-4">Paramètres système</h2>
            <p className="text-gray-600 mb-6">Configuration et paramètres avancés du système.</p>
            <div className="space-y-4">
              <button
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir redémarrer le système ?')) {
                    alert('Redémarrage du système...');
                  }
                }}
              >
                🔄 Redémarrer système
              </button>
              <button
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors ml-4"
                onClick={() => alert('Sauvegarde en cours...')}
              >
                💾 Sauvegarder données
              </button>
            </div>
          </div>
        );
      default:
        return <SimpleAdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec bouton de déconnexion */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Administration Sendflow</h1>
            <p className="text-sm text-gray-600">
              Connecté en tant que: {profile.full_name} ({profile.phone})
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Contenu */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {renderTabContent()}
      </main>
    </div>
  );
}
