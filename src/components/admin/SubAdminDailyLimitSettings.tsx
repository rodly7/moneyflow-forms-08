
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle, CheckCircle, History } from 'lucide-react';
import { useSubAdminDailyRequests } from '@/hooks/useSubAdminDailyRequests';
import { Progress } from '@/components/ui/progress';

const SubAdminDailyLimitSettings = () => {
  const { status, loading } = useSubAdminDailyRequests();

  const getStatusColor = () => {
    if (status.remainingRequests === 0) return 'text-red-600';
    if (status.remainingRequests <= 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusBadgeVariant = () => {
    if (status.remainingRequests === 0) return 'destructive';
    if (status.remainingRequests <= 5) return 'secondary';
    return 'default';
  };

  const progressPercentage = (status.todayRequests / status.dailyLimit) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Quota Journalier des Demandes
          </CardTitle>
          <CardDescription>
            Limite quotidienne: {status.dailyLimit} demandes par jour
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression du jour</span>
              <span className={getStatusColor()}>
                {status.todayRequests} / {status.dailyLimit}
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-3"
            />
          </div>

          {/* Statut actuel */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4 border border-blue-200 bg-blue-50">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {loading ? '...' : status.todayRequests}
                </div>
                <div className="text-sm text-blue-600">Demandes aujourd'hui</div>
              </div>
            </Card>
            
            <Card className={`p-4 ${status.canMakeRequest ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="text-center">
                <div className={`text-2xl font-bold ${status.canMakeRequest ? 'text-green-600' : 'text-red-600'}`}>
                  {loading ? '...' : status.remainingRequests}
                </div>
                <div className={`text-sm ${status.canMakeRequest ? 'text-green-600' : 'text-red-600'}`}>
                  Demandes restantes
                </div>
              </div>
            </Card>

            <Card className="p-4 border border-purple-200 bg-purple-50">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {loading ? '...' : status.totalRequests}
                </div>
                <div className="text-sm text-purple-600">Total historique</div>
              </div>
            </Card>
          </div>

          {/* Badge de statut */}
          <div className="flex items-center justify-center">
            <Badge variant={getStatusBadgeVariant()} className="text-sm px-4 py-2">
              {status.canMakeRequest ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Quota disponible
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Quota épuisé
                </>
              )}
            </Badge>
          </div>

          {/* Information sur le quota */}
          <div className={`${status.canMakeRequest ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
            <div className="flex items-start gap-3">
              {status.canMakeRequest ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div>
                <h4 className={`font-medium ${status.canMakeRequest ? 'text-green-900' : 'text-red-900'} mb-1`}>
                  {status.canMakeRequest ? 'Quota Disponible' : 'Quota Épuisé'}
                </h4>
                <p className={`text-sm ${status.canMakeRequest ? 'text-green-700' : 'text-red-700'}`}>
                  {status.canMakeRequest 
                    ? `Vous pouvez encore traiter ${status.remainingRequests} demande(s) aujourd'hui.`
                    : 'Vous avez atteint votre limite quotidienne. Le quota se renouvelle à minuit.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Historique des performances */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <History className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Performances Historiques</h4>
                <p className="text-sm text-blue-700">
                  Vous avez traité un total de {status.totalRequests} demandes depuis le début. 
                  Limite quotidienne actuelle: {status.dailyLimit} demandes.
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
