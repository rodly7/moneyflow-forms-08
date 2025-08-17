
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
import { Search, CreditCard, User, Wallet, AlertCircle, CheckCircle, Globe } from 'lucide-react';

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
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="p-4 bg-yellow-100 rounded-full mx-auto w-fit">
              <AlertCircle className="w-12 h-12 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Accès limité</h3>
            <p className="text-gray-600 max-w-md">
              Vous n'avez pas les permissions pour effectuer des recharges.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header avec gradient */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Recharge des Comptes
            </h2>
            <p className="text-gray-600">
              Recharge pour les comptes perdus dans votre territoire{userCountry && ` (${userCountry})`}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <Globe className="w-4 h-4 mr-2" />
          Recharge Nationale
        </Badge>
      </div>

      {/* Recherche utilisateur */}
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <Search className="w-5 h-5 text-white" />
            </div>
            Rechercher un utilisateur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Numéro de téléphone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="Ex: +241 XX XX XX XX"
                className="mt-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={searchUser}
                disabled={searchLoading || !searchPhone.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-2.5"
              >
                {searchLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Recherche...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Rechercher
                  </>
                )}
              </Button>
            </div>
          </div>

          {foundUser && (
            <div className="p-6 bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-teal-600 rounded-full">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-green-800">{foundUser.full_name}</h4>
                    <p className="text-green-600 font-medium">{foundUser.phone}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Globe className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-green-600">{foundUser.country}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="flex items-center gap-2 justify-end">
                    <Wallet className="w-5 h-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-800">
                      {foundUser.balance.toLocaleString()} FCFA
                    </span>
                  </div>
                  <Badge 
                    variant={foundUser.role === 'agent' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {foundUser.role === 'agent' ? '🏢 Agent' : '👤 Utilisateur'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulaire de recharge */}
      {foundUser && (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              Recharger le compte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                Montant à créditer (FCFA)
              </Label>
              <Input
                id="amount"
                type="number"
                min="1000"
                step="1000"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder="Ex: 50000"
                className="mt-2 text-lg border-gray-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
              <div className="text-sm text-gray-600">
                Solde actuel: <span className="text-lg font-semibold text-gray-800">{foundUser.balance.toLocaleString()} FCFA</span>
              </div>
              {rechargeAmount && !isNaN(parseFloat(rechargeAmount)) && (
                <div className="text-sm text-green-600">
                  Nouveau solde: <span className="text-lg font-semibold text-green-700">
                    {(foundUser.balance + parseFloat(rechargeAmount)).toLocaleString()} FCFA
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setFoundUser(null);
                  setRechargeAmount('');
                  setSearchPhone('');
                }}
                className="flex-1 border-gray-300 hover:bg-gray-50"
              >
                Annuler
              </Button>
              <Button
                onClick={handleRecharge}
                disabled={isProcessing || !rechargeAmount}
                className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Traitement...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Recharger
                  </>
                )}
              </Button>
            </div>

            {/* Montants rapides */}
            <div className="space-y-3 pt-2">
              <Label className="text-sm font-medium text-gray-700">Montants rapides:</Label>
              <div className="grid grid-cols-4 gap-3">
                {[10000, 25000, 50000, 100000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setRechargeAmount(amount.toString())}
                    className="text-xs hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 transition-all duration-200"
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
