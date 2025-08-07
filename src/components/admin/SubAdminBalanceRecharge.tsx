import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSecureAdminOperations } from '@/hooks/useSecureAdminOperations';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, User, CreditCard } from 'lucide-react';

interface SubAdmin {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
  country: string;
}

const SubAdminBalanceRecharge = () => {
  const { toast } = useToast();
  const { secureUpdateUserBalance, isProcessing } = useSecureAdminOperations();
  const [selectedSubAdmin, setSelectedSubAdmin] = useState<SubAdmin | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState('');

  // Fetch sub-admins
  const { data: subAdmins, isLoading, refetch } = useQuery({
    queryKey: ['sub-admins'],
    queryFn: async () => {
      console.log('🔍 Chargement des sous-administrateurs...');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance, country')
        .eq('role', 'sub_admin')
        .order('full_name');

      if (error) {
        console.error('❌ Erreur lors du chargement des sous-administrateurs:', error);
        throw error;
      }

      console.log('✅ Sous-administrateurs chargés:', data);
      return data as SubAdmin[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleRecharge = async () => {
    if (!selectedSubAdmin || !rechargeAmount) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un sous-administrateur et saisir un montant",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un montant valide",
        variant: "destructive"
      });
      return;
    }

    try {
      await secureUpdateUserBalance(selectedSubAdmin.phone, amount);
      setRechargeAmount('');
      setSelectedSubAdmin(null);
      refetch(); // Refresh the list
    } catch (error) {
      console.error('Erreur lors de la recharge:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Recharge Sous-Administrateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subAdmins || subAdmins.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Recharge Sous-Administrateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Aucun sous-administrateur trouvé</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          Recharge Sous-Administrateurs
          <Badge variant="outline" className="ml-auto">
            {subAdmins.length} sous-admin(s)
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Liste des sous-administrateurs */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Sélectionner un sous-administrateur:</Label>
          <div className="grid gap-2 max-h-48 overflow-y-auto">
            {subAdmins.map((subAdmin) => (
              <div
                key={subAdmin.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedSubAdmin?.id === subAdmin.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedSubAdmin(subAdmin)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {subAdmin.full_name}
                    </p>
                    <p className="text-xs text-gray-500">{subAdmin.phone}</p>
                    <p className="text-xs text-gray-500">{subAdmin.country}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Wallet className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-sm">
                        {subAdmin.balance.toLocaleString()} FCFA
                      </span>
                    </div>
                    <Badge 
                      variant={subAdmin.balance < 100000 ? "destructive" : "secondary"}
                      className="text-xs mt-1"
                    >
                      {subAdmin.balance < 100000 ? "Solde faible" : "Solde OK"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulaire de recharge */}
        {selectedSubAdmin && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-sm mb-3 text-blue-800">
              Recharger le compte de {selectedSubAdmin.full_name}
            </h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="amount" className="text-sm">
                  Montant à créditer (FCFA)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="1000"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  placeholder="Ex: 50000"
                  className="mt-1"
                />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-gray-600">
                  Solde actuel: <span className="font-semibold">{selectedSubAdmin.balance.toLocaleString()} FCFA</span>
                </div>
                {rechargeAmount && !isNaN(parseFloat(rechargeAmount)) && (
                  <div className="text-xs text-green-600">
                    Nouveau solde: <span className="font-semibold">
                      {(selectedSubAdmin.balance + parseFloat(rechargeAmount)).toLocaleString()} FCFA
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSubAdmin(null);
                    setRechargeAmount('');
                  }}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleRecharge}
                  disabled={isProcessing || !rechargeAmount}
                  size="sm"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? 'Traitement...' : 'Recharger'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Boutons de montants rapides */}
        {selectedSubAdmin && !rechargeAmount && (
          <div className="space-y-2">
            <Label className="text-sm">Montants rapides:</Label>
            <div className="grid grid-cols-3 gap-2">
              {[25000, 50000, 100000].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setRechargeAmount(amount.toString())}
                  className="text-xs"
                >
                  {amount.toLocaleString()} FCFA
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubAdminBalanceRecharge;