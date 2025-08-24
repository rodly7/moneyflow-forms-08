
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubAdmin } from '@/hooks/useSubAdmin';
import SubAdminDashboardTabs from '@/components/admin/SubAdminDashboardTabs';

const CompactSubAdminDashboard = () => {
  const { profile } = useAuth();
  const { isSubAdmin } = useSubAdmin();

  // Vérifier que l'utilisateur est bien un sous-admin
  if (!isSubAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès non autorisé</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto p-4">
        <SubAdminDashboardTabs />
      </div>
    </div>
  );
};

export default CompactSubAdminDashboard;
