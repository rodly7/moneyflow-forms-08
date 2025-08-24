
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Settings, Clock, History } from 'lucide-react';
import { useSubAdminDailyRequests } from '@/hooks/useSubAdminDailyRequests';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const SubAdminDailyLimitSettings = () => {
  const { status, updateDailyLimit, loading } = useSubAdminDailyRequests();
  const { user } = useAuth();
  const [newLimit, setNewLimit] = useState(status.maxRequests.toString());
  const [isUpdating, setIsUpdating] = useState(false);
  const [dynamicQuota, setDynamicQuota] = useState(300);

  useEffect(() => {
    // Calculer le quota automatique basé sur le total des demandes historiques
    const calculateAutomaticQuota = () => {
      const baseQuota = 300;
      const totalRequests = status.totalRequests || 0;
      const bonusQuota = Math.floor(totalRequests / 100) * 50;
      const calculated = Math.min(1000, baseQuota + bonusQuota);
      
      console.log(`Calcul du quota automatique:`, {
        totalRequests,
        baseQuota, 
        bonusQuota,
        calculated
      });
      
      setDynamicQuota(calculated);
    };

    calculateAutomaticQuota();
  }, [status.totalRequests]);

  useEffect(() => {
    setNewLimit(status.maxRequests.toString());
  }, [status.maxRequests]);

  const handleUpdateLimit = async () => {
    const limit = parseInt(newLimit);
    
    if (isNaN(limit) || limit < 100) {
      toast.error('Le plafond doit être un nombre positif minimum de 100');
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Plafond des Demandes Quotidiennes
          </CardTitle>
          <CardDescription>
            Votre quota est calculé automatiquement selon votre total de demandes traitées: {status.totalRequests} demandes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statut actuel */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className={`p-4 border ${getStatusColor()}`}>
              <div className="text-center">
                <div className="text-2xl font-bold">{status.todayRequests}</div>
                <div className="text-sm opacity-80">Aujourd'hui</div>
              </div>
            </Card>
            
            <Card className="p-4 border border-purple-200 bg-purple-50">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{status.totalRequests}</div>
                <div className="text-sm text-purple-600">Total demandes historiques</div>
              </div>
            </Card>
            
            <Card className="p-4 border border-blue-200 bg-blue-50">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{status.maxRequests}</div>
                <div className="text-sm text-blue-600">Plafond actuel</div>
              </div>
            </Card>
            
            <Card className="p-4 border border-green-200 bg-green-50">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{status.remainingRequests}</div>
                <div className="text-sm text-green-600">Restantes aujourd'hui</div>
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

          {/* Explication du système de quota basé sur l'historique */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <History className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Quota Basé sur l'Historique Total</h4>
                <p className="text-sm text-blue-700 mb-2">
                  Calculé à partir de vos <span className="font-semibold">{status.totalRequests} demandes</span> traitées au total
                </p>
                <div className="text-sm text-blue-600">
                  <span className="font-medium">Quota automatique: {dynamicQuota} demandes/jour</span>
                  <br />
                  <span className="text-xs">
                    Formule: 300 (base) + {Math.floor((status.totalRequests || 0) / 100)} × 50 (bonus) = {dynamicQuota}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Modification du plafond */}
          <div className="space-y-4 border-t pt-4">
            <div>
              <Label htmlFor="newLimit" className="text-base font-medium">
                Personnaliser le plafond quotidien
              </Label>
              <p className="text-sm text-gray-600 mb-2">
                Entre 100 et 1000 demandes par jour (quota automatique: {dynamicQuota})
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

          {/* Information système */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 mb-1">Système de Quota Intelligent</h4>
                <p className="text-sm text-amber-700">
                  Votre quota quotidien augmente automatiquement en fonction de votre historique total de demandes traitées.
                  Formule: 300 (base) + 50 points pour chaque tranche de 100 demandes historiques (maximum 1000).
                  Le plafond se remet à zéro chaque jour à minuit.
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
