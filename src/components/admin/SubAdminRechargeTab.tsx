import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Clock, CheckCircle, XCircle, User, Phone } from 'lucide-react';
import { formatCurrency } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type UserRequestsWithProfiles = Database['public']['Tables']['user_requests']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row'] | null;
};

const SubAdminRechargeTab = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [userRequests, setUserRequests] = useState<UserRequestsWithProfiles[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour charger les demandes
  const fetchUserRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('user_requests')
        .select(`
          *,
          profiles (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des demandes:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les demandes",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Demandes chargées:', data);
      setUserRequests(data || []);
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

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Configuration de l\'écoute temps réel pour user_requests');
    
    const channel = supabase
      .channel('user_requests_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_requests'
        }, 
        (payload) => {
          console.log('📨 Changement détecté dans user_requests:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newRequest = payload.new as Database['public']['Tables']['user_requests']['Row'];
            toast({
              title: "Nouvelle demande",
              description: `Nouvelle demande de ${newRequest.operation_type} de ${formatCurrency(newRequest.amount, 'XAF')}`,
            });
            // Recharger les données pour avoir les profils associés
            fetchUserRequests();
          } else if (payload.eventType === 'UPDATE') {
            // Recharger les données en cas de mise à jour
            fetchUserRequests();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔇 Désabonnement du canal user_requests');
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('user_requests')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString(),
          processed_by: user?.id
        })
        .eq('id', requestId);

      if (error) {
        console.error('Erreur lors de l\'approbation:', error);
        toast({
          title: "Erreur",
          description: "Impossible d'approuver la demande",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Demande approuvée",
        description: "La demande a été approuvée avec succès",
      });

      // Recharger les données
      fetchUserRequests();
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du traitement de la demande",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (requestId: string, reason = 'Demande rejetée par l\'administrateur') => {
    try {
      const { error } = await supabase
        .from('user_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: user?.id,
          rejection_reason: reason
        })
        .eq('id', requestId);

      if (error) {
        console.error('Erreur lors du rejet:', error);
        toast({
          title: "Erreur",
          description: "Impossible de rejeter la demande",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Demande rejetée",
        description: "La demande a été rejetée",
      });

      // Recharger les données
      fetchUserRequests();
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du traitement de la demande",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approuvée</Badge>;
      case 'rejected':
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
                          <span>{request.profiles?.full_name || 'Utilisateur inconnu'}</span>
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
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approuver
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(request.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rejeter
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
                          <span>{request.profiles?.full_name || 'Utilisateur inconnu'}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Traité le: {request.processed_at ? new Date(request.processed_at).toLocaleDateString('fr-FR') : 'N/A'}
                    {request.rejection_reason && (
                      <div className="text-red-600 mt-1">Raison: {request.rejection_reason}</div>
                    )}
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
