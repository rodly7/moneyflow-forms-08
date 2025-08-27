import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Award, 
  AlertTriangle,
  Gift,
  ArrowUp
} from "lucide-react";
import { useAgentEarnings } from "@/hooks/useAgentEarnings";
import { formatCurrency } from "@/integrations/supabase/client";

const AgentEarningsCard = () => {
  const { 
    earnings, 
    isLoading, 
    getNextTierInfo, 
    getBonusProgress 
  } = useAgentEarnings();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!earnings) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Aucune donnée de gains disponible
          </p>
        </CardContent>
      </Card>
    );
  }

  const nextTier = getNextTierInfo();
  const bonusProgress = getBonusProgress();

  const getTierBadgeVariant = (tierName: string) => {
    switch (tierName) {
      case 'Bronze': return 'secondary';
      case 'Silver': return 'default';
      case 'Gold': return 'default';
      default: return 'secondary';
    }
  };

  const getTierColor = (tierName: string) => {
    switch (tierName) {
      case 'Bronze': return 'text-yellow-600';
      case 'Silver': return 'text-gray-600';
      case 'Gold': return 'text-yellow-500';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Résumé principal */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <DollarSign className="w-5 h-5" />
            Revenus Mensuels Estimés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-emerald-700 mb-2">
            {formatCurrency(earnings.totalEarnings, 'XAF')}
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Badge 
              variant={getTierBadgeVariant(earnings.tierName)}
              className={`${getTierColor(earnings.tierName)} font-semibold`}
            >
              <Award className="w-3 h-3 mr-1" />
              Niveau {earnings.tierName}
            </Badge>
            <Badge variant="outline">
              {(earnings.commissionRate * 100).toFixed(1)}% de commission
            </Badge>
          </div>
          
          {/* Détail des gains */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Commission de base:</span>
              <div className="font-semibold text-emerald-700">
                {formatCurrency(earnings.baseCommission, 'XAF')}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Bonus totaux:</span>
              <div className="font-semibold text-emerald-700">
                {formatCurrency(
                  earnings.volumeBonus + earnings.transactionBonus + earnings.noComplaintBonus, 
                  'XAF'
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques mensuelles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance du Mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {earnings.totalTransactions}
              </div>
              <div className="text-sm text-blue-600">Transactions</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">
                {formatCurrency(earnings.totalVolume, 'XAF')}
              </div>
              <div className="text-sm text-purple-600">Volume traité</div>
            </div>
          </div>

          {earnings.complaintsCount > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-semibold">
                  {earnings.complaintsCount} réclamation(s) ce mois
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progression vers le niveau supérieur */}
      {nextTier && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <ArrowUp className="w-5 h-5" />
              Progression vers {nextTier.tierName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Volume requis:</span>
                <span className="font-semibold">
                  {formatCurrency(nextTier.requiredVolume, 'XAF')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Restant:</span>
                <span className="font-semibold text-amber-700">
                  {formatCurrency(nextTier.remainingVolume, 'XAF')}
                </span>
              </div>
              <Progress 
                value={(earnings.totalVolume / nextTier.requiredVolume) * 100}
                className="h-2"
              />
              <div className="text-xs text-amber-700">
                Nouveau taux: {(nextTier.commissionRate * 100).toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progression des bonus */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Bonus Mensuels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bonusProgress.map((bonus, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{bonus.description}</span>
                  {bonus.achieved ? (
                    <Badge className="bg-green-100 text-green-800">
                      <Award className="w-3 h-3 mr-1" />
                      Atteint
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      {formatCurrency(bonus.bonusAmount, 'XAF')}
                    </Badge>
                  )}
                </div>
                <Progress 
                  value={bonus.progress}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                     {bonus.bonusType === 'no_complaints' 
                      ? `${bonus.current} réclamation(s)`
                      : bonus.bonusType === 'volume'
                      ? formatCurrency(bonus.current, 'XAF')
                      : `${bonus.current} transactions`
                    }
                  </span>
                  <span>
                    {bonus.bonusType === 'no_complaints'
                      ? 'Objectif: 0 réclamation'
                      : bonus.bonusType === 'volume'
                      ? `Objectif: ${formatCurrency(bonus.requirementValue, 'XAF')}`
                      : `Objectif: ${bonus.requirementValue} transactions`
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentEarningsCard;