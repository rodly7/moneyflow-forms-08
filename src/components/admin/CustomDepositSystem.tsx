import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AdminUserService } from '@/services/adminUserService';
import { formatCurrency } from '@/integrations/supabase/client';
import { Search, CreditCard, DollarSign, AlertCircle, Users } from 'lucide-react';

const CustomDepositSystem = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);

  // Charger les agents automatiquement au montage du composant
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setIsLoadingAgents(true);
    try {
      const result = await AdminUserService.fetchAllUsers();
      if (result.success) {
        // Filtrer seulement les agents
        const agentUsers = result.data?.filter(user => user.role === 'agent') || [];
        setAgents(agentUsers);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger la liste des agents",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des agents:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des agents",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un numéro de téléphone ou un nom",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      const result = await AdminUserService.searchUser(searchTerm);
      if (result.success && result.data) {
        setSearchResult(result.data);
      } else {
        setSearchResult(null);
        toast({
          title: "Aucun utilisateur trouvé",
          description: "Aucun utilisateur ne correspond à votre recherche",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la recherche d'utilisateur",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleCustomDeposit = async () => {
    if (!searchResult) {
      toast({
        title: "Erreur",
        description: "Veuillez d'abord rechercher un utilisateur",
        variant: "destructive"
      });
      return;
    }

    const amount = Number(depositAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      });
      return;
    }

    if (!profile?.balance || profile.balance < amount) {
      toast({
        title: "Solde insuffisant",
        description: `Votre solde (${formatCurrency(profile?.balance || 0, 'XAF')}) est insuffisant pour ce dépôt`,
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await AdminUserService.performCustomDeposit(
        searchResult.id,
        amount,
        profile.id,
        `Dépôt manuel de ${profile.role} vers ${searchResult.full_name}`
      );

      if (result.success) {
        toast({
          title: "✅ Dépôt effectué avec succès",
          description: `${formatCurrency(amount, 'XAF')} crédité à ${searchResult.full_name}`,
        });
        
        // Réinitialiser le formulaire
        setSearchResult(null);
        setSearchTerm('');
        setDepositAmount('');
      } else {
        toast({
          title: "Erreur",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Erreur lors du dépôt personnalisé:', error);
      toast({
        title: "Erreur critique",
        description: error.message || "Erreur lors du dépôt personnalisé",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <CreditCard className="w-5 h-5" />
          Système de Dépôt Manuel Personnalisé
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Information sur le solde admin */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700">Votre solde disponible</span>
            <Badge className="bg-blue-600 text-white">
              {formatCurrency(profile?.balance || 0, 'XAF')}
            </Badge>
          </div>
        </div>

        {/* Liste des agents disponibles */}
        <div className="space-y-4">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Agents Disponibles
          </Label>
          
          {isLoadingAgents ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse p-3 bg-gray-100 rounded-lg">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : agents.length > 0 ? (
            <div className="grid gap-3 max-h-64 overflow-y-auto">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-blue-50 ${
                    searchResult?.id === agent.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
                  }`}
                  onClick={() => setSearchResult(agent)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{agent.full_name}</p>
                      <p className="text-sm text-gray-600">{agent.phone}</p>
                      <p className="text-xs text-gray-500">{agent.country}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-blue-600">
                        Solde: {formatCurrency(agent.balance || 0, 'XAF')}
                      </p>
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                        Agent
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucun agent trouvé</p>
            </div>
          )}
        </div>

        {/* Recherche manuelle d'utilisateur */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Ou rechercher manuellement un utilisateur</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Numéro de téléphone ou nom complet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              variant="outline"
            >
              <Search className="w-4 h-4 mr-2" />
              {isSearching ? 'Recherche...' : 'Rechercher'}
            </Button>
          </div>
        </div>

        {/* Résultat de la recherche */}
        {searchResult && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-800">{searchResult.full_name}</p>
                <p className="text-sm text-green-600">{searchResult.phone}</p>
                <p className="text-xs text-green-600">{searchResult.country}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-green-600">
                  Solde: {formatCurrency(searchResult.balance, 'XAF')}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {searchResult.role}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Montant du dépôt */}
        {searchResult && (
          <div className="space-y-4">
            <Label className="text-sm font-medium">Montant à déposer (FCFA)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="number"
                placeholder="Ex: 50000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {depositAmount && Number(depositAmount) > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span>Montant à déposer:</span>
                  <span className="font-semibold">{formatCurrency(Number(depositAmount), 'XAF')}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span>Nouveau solde destinataire:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(searchResult.balance + Number(depositAmount), 'XAF')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span>Votre solde restant:</span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency((profile?.balance || 0) - Number(depositAmount), 'XAF')}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bouton de validation */}
        {searchResult && depositAmount && Number(depositAmount) > 0 && (
          <div className="space-y-4">
            {Number(depositAmount) > (profile?.balance || 0) && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">Solde insuffisant pour effectuer ce dépôt</span>
              </div>
            )}
            
            <Button
              onClick={handleCustomDeposit}
              disabled={isProcessing || Number(depositAmount) > (profile?.balance || 0)}
              className="w-full bg-orange-600 hover:bg-orange-700"
              size="lg"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isProcessing ? 'Traitement...' : `Effectuer le dépôt de ${formatCurrency(Number(depositAmount), 'XAF')}`}
            </Button>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="text-sm font-semibold text-yellow-800 mb-2">Instructions</h4>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• Recherchez un utilisateur par nom ou numéro de téléphone</li>
            <li>• Entrez le montant à déposer sur son compte</li>
            <li>• Le montant sera débité de votre solde administrateur</li>
            <li>• Une notification sera automatiquement envoyée à l'utilisateur</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomDepositSystem;