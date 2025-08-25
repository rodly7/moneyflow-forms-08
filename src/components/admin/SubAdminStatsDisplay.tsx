
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubAdminStats } from '@/hooks/useSubAdminStats';
import AdminGlobalStats from './AdminGlobalStats';
import { formatCurrency } from '@/lib/utils/currency';

const SubAdminStatsDisplay = () => {
  const { profile } = useAuth();
  const { stats, loading } = useSubAdminStats();

  console.log('📊 SubAdminStatsDisplay - Rendu avec:', { 
    role: profile?.role, 
    stats, 
    loading 
  });

  // Si c'est l'administrateur principal, afficher les statistiques globales
  if (profile?.role === 'admin') {
    console.log('👑 Affichage des stats admin principal');
    return <AdminGlobalStats />;
  }

  // Pour les sous-administrateurs, afficher leurs statistiques spécifiques
  if (profile?.role === 'sub_admin') {
    console.log('🎯 Affichage des stats sous-admin');
    
    if (loading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4 mt-4">
        {/* Première ligne - Quota et utilisateurs gérés */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border-l-4 border-l-blue-500 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Quota journalier</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.dailyRequests}/{stats.dailyLimit}
            </div>
            <span className="text-xs text-blue-600">
              {stats.quotaUtilization}% utilisé
            </span>
          </div>

          <div className="bg-green-50 border-l-4 border-l-green-500 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Utilisateurs gérés</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalUsersManaged}
            </div>
            <span className="text-xs text-gray-500">Dans votre zone</span>
          </div>

          <div className="bg-purple-50 border-l-4 border-l-purple-500 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Agents gérés</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.activeAgents}/{stats.totalAgentsManaged}
            </div>
            <span className="text-xs text-gray-500">Actifs/Total</span>
          </div>

          <div className="bg-orange-50 border-l-4 border-l-orange-500 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Transactions</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.totalTransactions}
            </div>
            {stats.pendingWithdrawals > 0 && (
              <span className="text-xs text-orange-600">
                {stats.pendingWithdrawals} en attente
              </span>
            )}
          </div>
        </div>

        {/* Deuxième ligne - Montants financiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 border-l-4 border-l-emerald-500 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Recharges</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(stats.totalRechargeAmount)}
            </div>
            <span className="text-xs text-gray-500">Montant rechargé par les agents</span>
          </div>

          <div className="bg-red-50 border-l-4 border-l-red-500 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Retraits</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalWithdrawalAmount)}
            </div>
            <span className="text-xs text-gray-500">Montant retiré par les agents</span>
          </div>

          <div className="bg-indigo-50 border-l-4 border-l-indigo-500 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Volume Total</span>
            </div>
            <div className="text-2xl font-bold text-indigo-600">
              {formatCurrency(stats.totalAmount)}
            </div>
            <span className="text-xs text-gray-500">Recharges + Retraits</span>
          </div>
        </div>
      </div>
    );
  }

  console.log('❌ Rôle non autorisé ou pas de profil:', profile?.role);
  return null;
};

export default SubAdminStatsDisplay;
