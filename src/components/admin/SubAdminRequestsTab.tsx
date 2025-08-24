
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Clock,
  Smartphone,
  CreditCard
} from 'lucide-react';

interface UserRequest {
  id: string;
  user_id: string;
  operation_type: 'recharge' | 'retrait';
  amount: number;
  payment_method: string;
  payment_phone: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_name?: string;
  user_phone?: string;
}

const SubAdminRequestsTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Pour l'instant, nous utilisons les transactions existantes comme exemple
  // En attendant que la table user_requests soit créée
  const { 
    data: requests = [], 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ['user-requests'],
    queryFn: async () => {
      // Temporairement, nous simulons des demandes avec les transactions existantes
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          sender:profiles!sender_id(name, phone),
          receiver:profiles!receiver_id(name, phone)
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Erreur lors du chargement des demandes:', error);
        throw error;
      }
      
      // Simuler des demandes de recharge/retrait
      return transactions?.map(t => ({
        id: t.id,
        user_id: t.sender_id,
        operation_type: Math.random() > 0.5 ? 'recharge' : 'retrait',
        amount: t.amount,
        payment_method: 'airtel_money',
        payment_phone: t.sender?.phone || '+242 XX XX XX XX',
        status: 'pending',
        created_at: t.created_at,
        user_name: t.sender?.name || 'Utilisateur',
        user_phone: t.sender?.phone || '+242 XX XX XX XX'
      })) || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      // Ici on simule l'approbation
      // Dans la vraie implémentation, on mettrait à jour la table user_requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Demande approuvée",
        description: "La demande a été approuvée avec succès",
      });
      refetch();
    },
    onError: (error) => {
      console.error('Erreur lors de l\'approbation:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'approbation de la demande",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setProcessingId(null);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      // Ici on simule le rejet
      // Dans la vraie implémentation, on mettrait à jour la table user_requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Demande rejetée",
        description: "La demande a été rejetée",
      });
      refetch();
    },
    onError: (error) => {
      console.error('Erreur lors du rejet:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du rejet de la demande",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setProcessingId(null);
    }
  });

  const handleApprove = (request: UserRequest) => {
    setProcessingId(request.id);
    approveMutation.mutate(request.id);
  };

  const handleReject = (request: UserRequest) => {
    setProcessingId(request.id);
    rejectMutation.mutate(request.id);
  };

  const getOperationIcon = (type: string) => {
    return type === 'recharge' ? ArrowDownCircle : ArrowUpCircle;
  };

  const getOperationColor = (type: string) => {
    return type === 'recharge' ? 'text-green-600' : 'text-blue-600';
  };

  const getPaymentMethodIcon = (method: string) => {
    return method.includes('money') ? Smartphone : CreditCard;
  };

  const getPaymentMethodName = (method: string) => {
    const methods: { [key: string]: string } = {
      'airtel_money': 'Airtel Money',
      'moov_money': 'Moov Money',
      'orange_money_congo': 'Orange Money Congo',
      'orange_money_senegal': 'Orange Money Sénégal',
      'wave': 'Wave'
    };
    return methods[method] || method;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Demandes en attente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Demandes en attente ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune demande en attente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const OperationIcon = getOperationIcon(request.operation_type);
                const PaymentIcon = getPaymentMethodIcon(request.payment_method);
                const isProcessing = processingId === request.id;

                return (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full bg-gray-100 ${getOperationColor(request.operation_type)}`}>
                          <OperationIcon className="w-6 h-6" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant={request.operation_type === 'recharge' ? 'default' : 'secondary'}
                              className={request.operation_type === 'recharge' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                            >
                              {request.operation_type === 'recharge' ? 'Recharge' : 'Retrait'}
                            </Badge>
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                              En attente
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              <span className="font-medium">Utilisateur:</span> {request.user_name}
                            </p>
                            <p>
                              <span className="font-medium">Montant:</span> {request.amount.toLocaleString()} FCFA
                            </p>
                            <div className="flex items-center gap-2">
                              <PaymentIcon className="w-4 h-4" />
                              <span className="font-medium">Mode:</span> {getPaymentMethodName(request.payment_method)}
                            </div>
                            <p>
                              <span className="font-medium">Téléphone:</span> {request.payment_phone}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(request.created_at).toLocaleString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request)}
                          disabled={isProcessing}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isProcessing ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(request)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubAdminRequestsTab;
