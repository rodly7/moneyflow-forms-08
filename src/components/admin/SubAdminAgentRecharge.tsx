
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
import { Search, Users, Wallet, CreditCard, AlertCircle, UserCheck } from 'lucide-react';

interface AgentData {
  id: string;
  user_id: string;
  agent_id: string;
  full_name: string;
  phone: string;
  country: string;
  status: 'pending' | 'active' | 'suspended';
  commission_balance: number;
  user_balance: number;
}

const SubAdminAgentRecharge = () => {
  const { toast } = useToast();
  const { canDepositToAgent, userCountry } = useSubAdmin();
  const { secureUpdateUserBalance, isProcessing } = useSecureAdminOperations();
  const [searchTerm, setSearchTerm] = useState('');
  const [foundAgent, setFoundAgent] = useState<AgentData | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const searchAgent = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un ID agent ou numéro de téléphone",
        variant: "destructive"
      });
      return;
    }

    setSearchLoading(true);
    try {
      console.log('🔍 Recherche agent avec le terme:', searchTerm);
      
      // Rechercher l'agent par agent_id ou phone
      let query = supabase
        .from('agents')
        .select(`
          id,
          user_id,
          agent_id,
          full_name,
          phone,
          country,
          status,
          commission_balance
        `)
        .or(`agent_id.eq.${searchTerm.trim()},phone.eq.${searchTerm.trim()}`);

      // Filtrer par pays pour les sous-admins
      if (userCountry) {
        query = query.eq('country', userCountry);
      }

      const { data: agentData, error: agentError } = await query.maybeSingle();

      if (agentError) {
        console.error('❌ Erreur lors de la recherche agent:', agentError);
        throw agentError;
      }

      if (!agentData) {
        toast({
          title: "Agent non trouvé",
          description: `Aucun agent trouvé avec ce terme dans votre territoire (${userCountry})`,
          variant: "destructive"
        });
        setFoundAgent(null);
        return;
      }

      // Récupérer le solde principal de l'agent
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', agentData.user_id)
        .single();

      if (profileError) {
        console.error('❌ Erreur lors de la récupération du profil:', profileError);
      }

      const agentWithBalance: AgentData = {
        ...agentData,
        user_balance: profileData?.balance || 0
      };

      setFoundAgent(agentWithBalance);
      console.log('✅ Agent trouvé:', agentWithBalance);

    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la recherche de l'agent",
        variant: "destructive"
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRecharge = async () => {
    if (!foundAgent || !rechargeAmount) {
      toast({
        title: "Erreur",
        description: "Veuillez rechercher un agent et saisir un montant",
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
      await secureUpdateUserBalance(foundAgent.phone, amount);
      
      // Réinitialiser les champs
      setRechargeAmount('');
      setFoundAgent(null);
      setSearchTerm('');
      
      toast({
        title: "Recharge effectuée",
        description: `Compte agent de ${foundAgent.full_name} rechargé avec succès`,
      });

    } catch (error) {
      console.error('Erreur lors de la recharge:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspendu</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!canDepositToAgent) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Accès limité</h3>
            <p className="text-muted-foreground">
              Vous n'avez pas les permissions pour recharger les agents.
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
          <h2 className="text-2xl font-bold tracking-tight">Recharge des Agents</h2>
          <p className="text-muted-foreground">
            Rechercher et recharger les agents dans votre territoire{userCountry && ` (${userCountry})`}
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50">
          <Users className="w-4 h-4 mr-2" />
          Gestion Agents
        </Badge>
      </div>

      {/* Recherche agent */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Rechercher un agent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="search">ID Agent ou Numéro de téléphone</Label>
              <Input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ex: AGT001 ou +241 XX XX XX XX"
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={searchAgent}
                disabled={searchLoading || !searchTerm.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {searchLoading ? 'Recherche...' : 'Rechercher'}
              </Button>
            </div>
          </div>

          {foundAgent && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-8 h-8 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-800">{foundAgent.full_name}</h4>
                    <p className="text-sm text-green-600">ID: {foundAgent.agent_id}</p>
                    <p className="text-sm text-green-600">{foundAgent.phone}</p>
                    <p className="text-xs text-green-600">{foundAgent.country}</p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  {getStatusBadge(foundAgent.status)}
                  <div className="flex items-center gap-1">
                    <Wallet className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-800">
                      {foundAgent.user_balance.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="text-xs text-green-600">
                    Commission: {foundAgent.commission_balance.toLocaleString()} FCFA
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulaire de recharge */}
      {foundAgent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Recharger l'agent
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
                placeholder="Ex: 100000"
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-gray-600">
                Solde actuel: <span className="font-semibold">{foundAgent.user_balance.toLocaleString()} FCFA</span>
              </div>
              {rechargeAmount && !isNaN(parseFloat(rechargeAmount)) && (
                <div className="text-sm text-green-600">
                  Nouveau solde: <span className="font-semibold">
                    {(foundAgent.user_balance + parseFloat(rechargeAmount)).toLocaleString()} FCFA
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setFoundAgent(null);
                  setRechargeAmount('');
                  setSearchTerm('');
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
                {isProcessing ? 'Traitement...' : 'Recharger Agent'}
              </Button>
            </div>

            {/* Montants rapides */}
            <div className="space-y-2 pt-2">
              <Label className="text-sm">Montants rapides pour agents:</Label>
              <div className="grid grid-cols-4 gap-2">
                {[50000, 100000, 200000, 500000].map((amount) => (
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

export default SubAdminAgentRecharge;
