
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Clock, CheckCircle, XCircle, User, Phone } from 'lucide-react';
import { formatCurrency } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Types simplifiés basés sur les vraies tables
type RechargeData = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string;
  payment_phone: string;
  created_at: string;
  updated_at: string;
  country: string;
  transaction_reference: string;
  payment_provider: string;
  provider_transaction_id: string | null;
};

type WithdrawalData = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  withdrawal_phone: string;
  verification_code: string;
  is_deleted: boolean;
};

type ProfileData = {
  id: string;
  full_name: string | null;
  phone: string;
  country: string | null;
};

type UserRequest = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string;
  payment_phone: string;
  created_at: string;
  updated_at: string;
  operation_type: 'recharge' | 'withdrawal';
  profile?: ProfileData | null;
};

const SubAdminRechargeTab = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [userRequests, setUserRequests] = useState<UserRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Fonction pour charger les demandes
  const fetchUserRequests = async () => {
    try {
      console.log('🔄 Chargement des recharges et retraits...');

      // Fetch recharges
      const { data: rechargesData, error: rechargesError } = await supabase
        .from('recharges')
        .select('*')
        .order('created_at', { ascending: false });

      if (rechargesError) {
        console.error('Erreur lors du chargement des recharges:', rechargesError);
        throw rechargesError;
      }

      // Fetch withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });

      if (withdrawalsError) {
        console.error('Erreur lors du chargement des retraits:', withdrawalsError);
        throw withdrawalsError;
      }

      // Get unique user IDs
      const userIds = [
        ...(rechargesData || []).map(r => r.user_id),
        ...(withdrawalsData || []).map(w => w.user_id)
      ].filter((id, index, arr) => arr.indexOf(id) === index);

      // Fetch profiles for all users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, country')
        .in('id', userIds);

      if (profilesError) {
        console.error('Erreur lors du chargement des profils:', profilesError);
      }

      // Create a map for quick profile lookup
      const profilesMap = new Map<string, ProfileData>();
      (profilesData || []).forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Transform recharges data
      const transformedRecharges: UserRequest[] = (rechargesData || []).map((recharge) => ({
        id: recharge.id,
        user_id: recharge.user_id,
        amount: recharge.amount,
        status: recharge.status,
        payment_method: recharge.payment_method,
        payment_phone: recharge.payment_phone,
        created_at: recharge.created_at,
        updated_at: recharge.updated_at,
        operation_type: 'recharge' as const,
        profile: profilesMap.get(recharge.user_id) || null
      }));

      // Transform withdrawals data
      const transformedWithdrawals: UserRequest[] = (withdrawalsData || []).map((withdrawal) => ({
        id: withdrawal.id,
        user_id: withdrawal.user_id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        payment_method: 'mobile_money',
        payment_phone: withdrawal.withdrawal_phone || '',
        created_at: withdrawal.created_at,
        updated_at: withdrawal.updated_at,
        operation_type: 'withdrawal' as const,
        profile: profilesMap.get(withdrawal.user_id) || null
      }));

      const allRequests = [...transformedRecharges, ...transformedWithdrawals]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log('✅ Demandes chargées:', allRequests);
      
      setUserRequests(allRequests);
    } catch (error) {
      console.error('Erreur critique:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des données",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les demandes au montage
  useEffect(() => {
    fetchUserRequests();
  }, []);

  // Auto-refresh toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isProcessing) {
        fetchUserRequests();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isProcessing]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Configuration de l\'écoute temps réel pour recharges et retraits');
    
    const rechargesChannel = supabase
      .channel('recharges_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'recharges'
        }, 
        (payload) => {
          console.log('📨 Changement détecté dans recharges:', payload);
          if (!isProcessing) {
            setTimeout(() => {
              fetchUserRequests();
            }, 500);
          }
        }
      )
      .subscribe();

    const withdrawalsChannel = supabase
      .channel('withdrawals_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'withdrawals'
        }, 
        (payload) => {
          console.log('📨 Changement détecté dans withdrawals:', payload);
          if (!isProcessing) {
            setTimeout(() => {
              fetchUserRequests();
            }, 500);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔇 Désabonnement des canaux');
      supabase.removeChannel(rechargesChannel);
      supabase.removeChannel(withdrawalsChannel);
    };
  }, [user, isProcessing]);

  const handleApprove = async (requestId: string) => {
    try {
      setIsProcessing(requestId);
      
      console.log('🔄 Début approbation pour:', requestId);
      
      const request = userRequests.find(r => r.id === requestId);
      if (!request) {
        console.error('Demande non trouvée:', requestId);
        return;
      }

      const tableName = request.operation_type === 'recharge' ? 'recharges' : 'withdrawals';
      console.log('📊 Mise à jour dans la table:', tableName);
      
      const { error } = await supabase
        .from(tableName as any)
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        console.error('❌ Erreur lors de l\'approbation:', error);
        toast({
          title: "Erreur",
          description: "Impossible d'approuver la demande: " + error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Approbation réussie pour:', requestId);

      toast({
        title: "Demande approuvée",
        description: `${request.operation_type === 'recharge' ? 'Recharge' : 'Retrait'} approuvé avec succès`,
      });

      // Recharger immédiatement les données pour voir le changement
      fetchUserRequests();

    } catch (error) {
      console.error('💥 Erreur lors de l\'approbation:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du traitement de la demande",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (requestId: string, reason = 'Demande rejetée par l\'administrateur') => {
    try {
      setIsProcessing(requestId);
      
      console.log('🔄 Début rejet pour:', requestId);
      
      const request = userRequests.find(r => r.id === requestId);
      if (!request) {
        console.error('Demande non trouvée:', requestId);
        return;
      }

      const tableName = request.operation_type === 'recharge' ? 'recharges' : 'withdrawals';
      console.log('📊 Mise à jour dans la table:', tableName);
      
      const { error } = await supabase
        .from(tableName as any)
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        console.error('❌ Erreur lors du rejet:', error);
        toast({
          title: "Erreur",
          description: "Impossible de rejeter la demande: " + error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Rejet réussi pour:', requestId);

      toast({
        title: "Demande rejetée",
        description: `${request.operation_type === 'recharge' ? 'Recharge' : 'Retrait'} rejeté`,
      });

      // Recharger immédiatement les données pour voir le changement
      fetchUserRequests();

    } catch (error) {
      console.error('💥 Erreur lors du rejet:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du traitement de la demande",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approuvée</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejetée</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  const getOperationTypeLabel = (type: string) => {
    return type === 'recharge' ? 'Recharge' : 'Retrait';
  };

  const getOperationIcon = (type: string) => {
    return type === 'recharge' ? 
      <CreditCard className="w-4 h-4 text-green-600" /> : 
      <CreditCard className="w-4 h-4 text-red-600" />;
  };

  // Séparer les demandes basées uniquement sur le statut de la base de données
  const pendingRequests = userRequests.filter(req => req.status === 'pending');
  const processedRequests = userRequests.filter(req => req.status !== 'pending');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Chargement des demandes...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Demandes de Recharge et Retrait</h2>
        </div>
        <Button 
          onClick={fetchUserRequests}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demandes en attente</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total demandes</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant total</CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(userRequests.reduce((sum, req) => sum + req.amount, 0), 'XAF')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demandes en attente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Demandes en Attente ({pendingRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getOperationIcon(request.operation_type)}
                      <div>
                        <h4 className="font-semibold">{getOperationTypeLabel(request.operation_type)} - {formatCurrency(request.amount, 'XAF')}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span>{request.profile?.full_name || 'Utilisateur inconnu'}</span>
                          <Phone className="w-3 h-3 ml-2" />
                          <span>{request.payment_phone}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-muted-foreground">Méthode: </span>
                      <span className="font-semibold">{request.payment_method}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date: </span>
                      <span>{new Date(request.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApprove(request.id)}
                      disabled={isProcessing === request.id}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {isProcessing === request.id ? 'Traitement...' : 'Approuver'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(request.id)}
                      disabled={isProcessing === request.id}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      {isProcessing === request.id ? 'Traitement...' : 'Rejeter'}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucune demande en attente
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Historique des demandes traitées */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Demandes Traitées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {processedRequests.length > 0 ? (
              processedRequests.slice(0, 10).map((request) => (
                <div key={request.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getOperationIcon(request.operation_type)}
                      <div>
                        <h4 className="font-semibold">{getOperationTypeLabel(request.operation_type)} - {formatCurrency(request.amount, 'XAF')}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span>{request.profile?.full_name || 'Utilisateur inconnu'}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Traité le: {new Date(request.updated_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucune demande traitée
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubAdminRechargeTab;
