
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSubAdmin } from '@/hooks/useSubAdmin';
import { useSecureAdminOperations } from '@/hooks/useSecureAdminOperations';
import { supabase } from '@/integrations/supabase/client';
import { Search, CreditCard, User, Wallet, AlertCircle } from 'lucide-react';

interface UserData {
  id: string;
  full_name: string | null;
  phone: string;
  balance: number;
  country: string | null;
  role: 'user' | 'agent' | 'admin' | 'sub_admin';
}

const SubAdminRechargeTab = () => {
  const { toast } = useToast();
  const { canRechargeNational, userCountry } = useSubAdmin();
  const { secureUpdateUserBalance, isProcessing } = useSecureAdminOperations();
  const [searchPhone, setSearchPhone] = useState('');
  const [foundUser, setFoundUser] = useState<UserData | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const searchUser = async () => {
    if (!searchPhone.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un numéro de téléphone",
        variant: "destructive"
      });
      return;
    }

    setSearchLoading(true);
    try {
      console.log('🔍 Recherche utilisateur avec le téléphone:', searchPhone);
      
      let query = supabase
        .from('profiles')
        .select('id, full_name, phone, balance, country, role')
        .eq('phone', searchPhone.trim());

      // Filtrer par pays pour les sous-admins
      if (userCountry) {
        query = query.eq('country', userCountry);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('❌ Erreur lors de la recherche:', error);
        throw error;
      }

      if (!data) {
        toast({
          title: "Utilisateur non trouvé",
          description: `Aucun utilisateur trouvé avec ce numéro dans votre territoire (${userCountry})`,
          variant: "destructive"
        });
        setFoundUser(null);
        return;
      }

      setFoundUser(data);
      console.log('✅ Utilisateur trouvé:', data);

    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la recherche de l'utilisateur",
        variant: "destructive"
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRecharge = async () => {
    if (!foundUser || !rechargeAmount) {
      toast({
        title: "Erreur",
        description: "Veuillez rechercher un utilisateur et saisir un montant",
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
      await secureUpdateUserBalance(foundUser.phone, amount);
      
      // Réinitialiser les champs
      setRechargeAmount('');
      setFoundUser(null);
      setSearchPhone('');
      
      toast({
        title: "Recharge effectuée",
        description: `Compte de ${foundUser.full_name} rechargé avec succès`,
      });

    } catch (error) {
      console.error('Erreur lors de la recharge:', error);
    }
  };

  if (!canRechargeNational) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Accès limité</h3>
            <p className="text-muted-foreground">
              Vous n'avez pas les permissions pour effectuer des recharges.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recharge des Comptes</h2>
          <p className="text-muted-foreground">
            Recharge pour les comptes perdus dans votre territoire{userCountry && ` (${userCountry})`}
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50">
          <CreditCard className="w-4 h-4 mr-2" />
          Recharge Nationale
        </Badge>
      </div>

      {/* Recherche utilisateur */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Rechercher un utilisateur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="Ex: +241 XX XX XX XX"
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={searchUser}
                disabled={searchLoading || !searchPhone.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {searchLoading ? 'Recherche...' : 'Rechercher'}
              </Button>
            </div>
          </div>

          {foundUser && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-8 h-8 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-800">{foundUser.full_name}</h4>
                    <p className="text-sm text-green-600">{foundUser.phone}</p>
                    <p className="text-xs text-green-600">{foundUser.country}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Wallet className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-800">
                      {foundUser.balance.toLocaleString()} FCFA
                    </span>
                  </div>
                  <Badge 
                    variant={foundUser.role === 'agent' ? 'default' : 'secondary'}
                    className="text-xs mt-1"
                  >
                    {foundUser.role === 'agent' ? 'Agent' : 'Utilisateur'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulaire de recharge */}
      {foundUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Recharger le compte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount">Montant à créditer (FCFA)</Label>
              <Input
                id="amount"
                type="number"
                min="1000"
                step="1000"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder="Ex: 50000"
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-gray-600">
                Solde actuel: <span className="font-semibold">{foundUser.balance.toLocaleString()} FCFA</span>
              </div>
              {rechargeAmount && !isNaN(parseFloat(rechargeAmount)) && (
                <div className="text-sm text-green-600">
                  Nouveau solde: <span className="font-semibold">
                    {(foundUser.balance + parseFloat(rechargeAmount)).toLocaleString()} FCFA
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setFoundUser(null);
                  setRechargeAmount('');
                  setSearchPhone('');
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleRecharge}
                disabled={isProcessing || !rechargeAmount}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? 'Traitement...' : 'Recharger'}
              </Button>
            </div>

            {/* Montants rapides */}
            <div className="space-y-2 pt-2">
              <Label className="text-sm">Montants rapides:</Label>
              <div className="grid grid-cols-4 gap-2">
                {[10000, 25000, 50000, 100000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setRechargeAmount(amount.toString())}
                    className="text-xs"
                  >
                    {amount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubAdminRechargeTab;
