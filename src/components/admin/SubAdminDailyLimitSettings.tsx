
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Settings, TrendingUp, Clock } from 'lucide-react';
import { useSubAdminDailyRequests } from '@/hooks/useSubAdminDailyRequests';
import { toast } from 'sonner';

const SubAdminDailyLimitSettings = () => {
  const { status, updateDailyLimit, loading } = useSubAdminDailyRequests();
  const [newLimit, setNewLimit] = useState(status.maxRequests.toString());
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateLimit = async () => {
    const limit = parseInt(newLimit);
    
    if (isNaN(limit) || limit < 1) {
      toast.error('Le plafond doit être un nombre positif');
      return;
    }

    if (limit < 100) {
      toast.error('Le plafond minimum est de 100 demandes par jour');
      return;
    }

    if (limit > 1000) {
      toast.error('Le plafond maximum est de 1000 demandes par jour');
      return;
    }

    setIsUpdating(true);
    const success = await updateDailyLimit(limit);
    if (success) {
      setNewLimit(limit.toString());
    }
    setIsUpdating(false);
  };

  const getStatusColor = () => {
    const percentage = (status.todayRequests / status.maxRequests) * 100;
    if (percentage >= 90) return 'bg-red-100 text-red-800 border-red-200';
    if (percentage >= 70) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getRecommendedLimit = () => {
    const avgDailyUsage = status.todayRequests; // Simplification pour l'exemple
    return Math.min(1000, Math.max(300, avgDailyUsage * 1.5));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Plafond des Demandes Quotidiennes
          </CardTitle>
          <CardDescription>
            Gérez votre limite quotidienne de demandes administratives
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statut actuel */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className={`p-4 border ${getStatusColor()}`}>
              <div className="text-center">
                <div className="text-2xl font-bold">{status.todayRequests}</div>
                <div className="text-sm opacity-80">Utilisées aujourd'hui</div>
              </div>
            </Card>
            
            <Card className="p-4 border border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{status.maxRequests}</div>
                <div className="text-sm text-gray-600">Plafond actuel</div>
              </div>
            </Card>
            
            <Card className="p-4 border border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{status.remainingRequests}</div>
                <div className="text-sm text-gray-600">Restantes</div>
              </div>
            </Card>
          </div>

          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression du jour</span>
              <span>{Math.round((status.todayRequests / status.maxRequests) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  status.todayRequests >= status.maxRequests 
                    ? 'bg-red-500' 
                    : status.todayRequests >= status.maxRequests * 0.8 
                      ? 'bg-orange-500' 
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, (status.todayRequests / status.maxRequests) * 100)}%` }}
              />
            </div>
          </div>

          {/* Modification du plafond */}
          <div className="space-y-4 border-t pt-4">
            <div>
              <Label htmlFor="newLimit" className="text-base font-medium">
                Modifier le plafond quotidien
              </Label>
              <p className="text-sm text-gray-600 mb-2">
                Entre 100 et 1000 demandes par jour
              </p>
            </div>
            
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  id="newLimit"
                  type="number"
                  min="100"
                  max="1000"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  placeholder="Nouveau plafond"
                />
              </div>
              <Button 
                onClick={handleUpdateLimit}
                disabled={isUpdating || loading || newLimit === status.maxRequests.toString()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                {isUpdating ? 'Mise à jour...' : 'Mettre à jour'}
              </Button>
            </div>
          </div>

          {/* Recommandation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Recommandation</h4>
                <p className="text-sm text-blue-700">
                  Basé sur votre utilisation actuelle, nous recommandons un plafond de{' '}
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {getRecommendedLimit()} demandes/jour
                  </Badge>
                </p>
              </div>
            </div>
          </div>

          {/* Avertissement */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 mb-1">Important</h4>
                <p className="text-sm text-amber-700">
                  Le plafond se remet à zéro chaque jour à minuit. 
                  Une fois le plafond atteint, vous ne pourrez plus effectuer de nouvelles demandes jusqu'au lendemain.
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
