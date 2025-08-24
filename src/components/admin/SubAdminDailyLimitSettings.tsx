
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, History } from 'lucide-react';
import { useSubAdminDailyRequests } from '@/hooks/useSubAdminDailyRequests';

const SubAdminDailyLimitSettings = () => {
  const { status, loading } = useSubAdminDailyRequests();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Statistiques des Demandes (Quota Supprimé)
          </CardTitle>
          <CardDescription>
            Le système de quota quotidien a été supprimé. Vous pouvez maintenant traiter un nombre illimité de demandes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statut actuel */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4 border border-green-200 bg-green-50">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{loading ? '...' : status.todayRequests}</div>
                <div className="text-sm text-green-600">Demandes aujourd'hui</div>
              </div>
            </Card>
            
            <Card className="p-4 border border-purple-200 bg-purple-50">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{loading ? '...' : status.totalRequests}</div>
                <div className="text-sm text-purple-600">Total historique</div>
              </div>
            </Card>
          </div>

          {/* Information système */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <History className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900 mb-1">Quota Illimité Activé</h4>
                <p className="text-sm text-green-700">
                  Le système de quota quotidien a été désactivé. Vous pouvez maintenant traiter autant de demandes que nécessaire sans limitation.
                  Les statistiques sont toujours suivies pour le reporting.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubAdminDailyLimitSettings;
