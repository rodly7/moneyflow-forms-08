
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubAdmin } from '@/hooks/useSubAdmin';
import MobileSubAdminDashboard from '@/components/admin/MobileSubAdminDashboard';

const CompactSubAdminDashboard = () => {
  const { profile, loading } = useAuth();
  const { isSubAdmin } = useSubAdmin();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-6"></div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-purple-800">SendFlow</p>
            <p className="text-sm text-purple-600">Chargement du tableau de bord...</p>
          </div>
        </div>
      </div>
    );
  }

  // Vérifier que l'utilisateur est bien un sous-admin
  if (!isSubAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès non autorisé</h1>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <p className="text-sm text-gray-500">
            Contactez un administrateur si vous pensez qu'il s'agit d'une erreur.
          </p>
        </div>
      </div>
    );
  }

  return <MobileSubAdminDashboard />;
};

export default CompactSubAdminDashboard;
