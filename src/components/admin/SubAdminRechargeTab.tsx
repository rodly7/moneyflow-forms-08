
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Clock, CheckCircle, XCircle, User, Phone } from 'lucide-react';
import { formatCurrency } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserRequest {
  id: string;
  user_id: string;
  operation_type: 'recharge' | 'withdrawal';
  amount: number;
  payment_method: string;
  payment_phone: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  processed_at?: string;
  profiles?: {
    full_name: string;
    phone: string;
  };
}

const SubAdminRechargeTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userRequests = [], isLoading } = useQuery({
    queryKey: ['user-requests'],
    queryFn: async (): Promise<UserRequest[]> => {
      const { data, error } = await supabase
        .from('user_requests')
        .select(`
          *,
          profiles!user_requests_user_id_fkey(full_name, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des demandes:', error);
        return [];
      }

      return data || [];
    },
    refetchInterval: 10000, // Actualiser toutes les 10 secondes
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('user_requests')
        .update({ 
          status: 'approved',
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-requests'] });
      toast({
        title: "Demande approuvée",
        description: "La demande a été approuvée avec succès",
      });
    },
    onError: (error) => {
      console.error('Erreur lors de l\'approbation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'approuver la demande",
        variant: "destructive"
      });
    }
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const { error } = await supabase
        .from('user_requests')
        .update({ 
          status: 'rejected',
          processed_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-requests'] });
      toast({
        title: "Demande rejetée",
        description: "La demande a été rejetée",
      });
    },
    onError: (error) => {
      console.error('Erreur lors du rejet:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter la demande",
        variant: "destructive"
      });
    }
  });

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const pendingRequests = userRequests.filter(req => req.status === 'pending');
  const processedRequests = userRequests.filter(req => req.status !== 'pending');

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
                      onClick={() => approveRequestMutation.mutate(request.id)}
                      disabled={approveRequestMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approuver
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectRequestMutation.mutate({ requestId: request.id, reason: 'Rejeté par l\'administrateur' })}
                      disabled={rejectRequestMutation.isPending}
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
