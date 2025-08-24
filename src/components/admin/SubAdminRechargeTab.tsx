
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Phone, CreditCard, User } from 'lucide-react';

interface UserRequest {
  id: string;
  user_id: string;
  operation_type: 'recharge' | 'withdrawal';
  amount: number;
  payment_method: string;
  payment_phone: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
  rejection_reason: string | null;
  profiles?: {
    full_name: string;
    phone: string;
    country: string;
  } | null;
}

const SubAdminRechargeTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Récupérer les demandes en attente
  const { data: requests, isLoading } = useQuery({
    queryKey: ['user-requests', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_requests')
        .select(`
          *,
          profiles!user_requests_user_id_fkey (
            full_name,
            phone,
            country
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filtrer et typer correctement les données
      return (data || []).map(item => ({
        ...item,
        profiles: item.profiles && typeof item.profiles === 'object' && !('error' in item.profiles) 
          ? item.profiles as { full_name: string; phone: string; country: string }
          : null
      })) as UserRequest[];
    },
  });

  // Approuver une demande
  const approveMutation = useMutation({
    mutationFn: async (request: UserRequest) => {
      const { error: updateError } = await supabase
        .from('user_requests')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString(),
          processed_by: user?.id
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Si c'est une recharge, créditer le compte de l'utilisateur
      if (request.operation_type === 'recharge') {
        const { error: balanceError } = await supabase.rpc('increment_balance', {
          user_id: request.user_id,
          amount: request.amount
        });

        if (balanceError) throw balanceError;
      }

      // Si c'est un retrait, débiter le compte de l'utilisateur
      if (request.operation_type === 'withdrawal') {
        const { error: balanceError } = await supabase.rpc('increment_balance', {
          user_id: request.user_id,
          amount: -request.amount
        });

        if (balanceError) throw balanceError;
      }
    },
    onSuccess: (_, request) => {
      toast({
        title: "Demande approuvée",
        description: `La ${request.operation_type === 'recharge' ? 'recharge' : 'retrait'} de ${request.amount.toLocaleString()} FCFA a été approuvée`,
      });
      queryClient.invalidateQueries({ queryKey: ['user-requests'] });
      setSelectedRequest(null);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de l'approbation: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Rejeter une demande
  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const { error } = await supabase
        .from('user_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: user?.id,
          rejection_reason: reason
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Demande rejetée",
        description: "La demande a été rejetée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['user-requests'] });
      setSelectedRequest(null);
      setRejectionReason('');
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Erreur lors du rejet: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleApprove = (request: UserRequest) => {
    approveMutation.mutate(request);
  };

  const handleReject = () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez fournir une raison pour le rejet",
        variant: "destructive"
      });
      return;
    }

    rejectMutation.mutate({
      requestId: selectedRequest.id,
      reason: rejectionReason.trim()
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Demandes de Recharge et Retrait</h2>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {requests?.length || 0} en attente
        </Badge>
      </div>

      {!requests || requests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucune demande en attente</h3>
            <p className="text-muted-foreground">
              Toutes les demandes ont été traitées ou il n'y a pas de nouvelles demandes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      request.operation_type === 'recharge' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <CreditCard className={`w-5 h-5 ${
                        request.operation_type === 'recharge' ? 'text-green-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        {request.operation_type === 'recharge' ? 'Demande de Recharge' : 'Demande de Retrait'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(request.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${
                    request.operation_type === 'recharge' ? 'bg-green-600' : 'bg-blue-600'
                  } text-white`}>
                    {request.amount.toLocaleString()} FCFA
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-sm">Client</p>
                      <p className="text-sm">{request.profiles?.full_name || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-sm">Téléphone</p>
                      <p className="text-sm">{request.profiles?.phone || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-sm">Mode de paiement</p>
                      <p className="text-sm">{request.payment_method}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-semibold text-sm">Numéro de paiement</p>
                    <p className="text-sm font-mono">{request.payment_phone}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApprove(request)}
                    disabled={approveMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approuver
                  </Button>
                  
                  <Button
                    onClick={() => setSelectedRequest(request)}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeter
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de rejet */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Rejeter la demande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Veuillez indiquer la raison du rejet de cette demande de {selectedRequest.operation_type}.
              </p>
              
              <Textarea
                placeholder="Raison du rejet..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
              
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setSelectedRequest(null);
                    setRejectionReason('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Annuler
                </Button>
                
                <Button
                  onClick={handleReject}
                  disabled={rejectMutation.isPending || !rejectionReason.trim()}
                  variant="destructive"
                  className="flex-1"
                >
                  Confirmer le rejet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SubAdminRechargeTab;
