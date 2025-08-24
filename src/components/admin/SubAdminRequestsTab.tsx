
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  CreditCard, 
  ArrowUpCircle, 
  ArrowDownCircle,
  User,
  Phone,
  Banknote
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UserRequest {
  id: string;
  user_id: string;
  operation_type: 'recharge' | 'retrait';
  amount: number;
  payment_method: string;
  payment_phone: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_name: string;
  user_phone: string;
}

const SubAdminRequestsTab = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  // Récupérer les demandes en attente
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['sub-admin-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_requests')
        .select(`
          *,
          profiles!user_id (
            full_name,
            phone
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des demandes:', error);
        throw error;
      }

      return data.map(request => ({
        ...request,
        user_name: request.profiles?.full_name || 'Utilisateur inconnu',
        user_phone: request.profiles?.phone || 'N/A'
      }));
    },
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
  });

  const handleApproveRequest = async (request: UserRequest) => {
    setProcessingRequest(request.id);
    
    try {
      if (request.operation_type === 'recharge') {
        // Pour une recharge, créditer le compte utilisateur
        const { error: creditError } = await supabase.rpc('secure_increment_balance', {
          target_user_id: request.user_id,
          amount: request.amount,
          operation_type: 'sub_admin_recharge',
          performed_by: user?.id
        });

        if (creditError) {
          throw new Error('Erreur lors du crédit du compte');
        }

        // Créer l'enregistrement de recharge
        const { error: rechargeError } = await supabase
          .from('recharges')
          .insert({
            user_id: request.user_id,
            amount: request.amount,
            country: 'Congo Brazzaville',
            payment_method: request.payment_method,
            payment_phone: request.payment_phone,
            payment_provider: 'sub_admin',
            transaction_reference: `SUBADMIN-${Date.now()}`,
            status: 'completed',
            provider_transaction_id: user?.id
          });

        if (rechargeError) {
          console.error('Erreur recharge:', rechargeError);
        }
      } else {
        // Pour un retrait, débiter le compte utilisateur
        const { error: debitError } = await supabase.rpc('secure_increment_balance', {
          target_user_id: request.user_id,
          amount: -request.amount,
          operation_type: 'sub_admin_withdrawal',
          performed_by: user?.id
        });

        if (debitError) {
          throw new Error('Erreur lors du débit du compte');
        }

        // Créer l'enregistrement de retrait
        const { error: withdrawalError } = await supabase
          .from('withdrawals')
          .insert({
            user_id: request.user_id,
            amount: request.amount,
            withdrawal_phone: request.payment_phone,
            status: 'completed'
          });

        if (withdrawalError) {
          console.error('Erreur retrait:', withdrawalError);
        }
      }

      // Mettre à jour le statut de la demande
      const { error: updateError } = await supabase
        .from('user_requests')
        .update({ 
          status: 'approved',
          processed_at: new Date().toISOString(),
          processed_by: user?.id
        })
        .eq('id', request.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Demande approuvée",
        description: `${request.operation_type === 'recharge' ? 'Recharge' : 'Retrait'} de ${request.amount} FCFA approuvé pour ${request.user_name}`,
      });

      queryClient.invalidateQueries({ queryKey: ['sub-admin-requests'] });

    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du traitement de la demande",
        variant: "destructive"
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (request: UserRequest) => {
    setProcessingRequest(request.id);
    
    try {
      const { error } = await supabase
        .from('user_requests')
        .update({ 
          status: 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: user?.id
        })
        .eq('id', request.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Demande rejetée",
        description: `${request.operation_type === 'recharge' ? 'Recharge' : 'Retrait'} de ${request.amount} FCFA rejeté`,
      });

      queryClient.invalidateQueries({ queryKey: ['sub-admin-requests'] });

    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du rejet de la demande",
        variant: "destructive"
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Demandes en Attente
            </h2>
            <p className="text-gray-600">
              Gérez les demandes de recharge et retrait des utilisateurs
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <Clock className="w-4 h-4 mr-2" />
          {requests.length} demande(s) en attente
        </Badge>
      </div>

      {/* Liste des demandes */}
      {requests.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="p-4 bg-gray-100 rounded-full mx-auto w-fit">
                <CheckCircle className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Aucune demande en attente</h3>
              <p className="text-gray-600">
                Toutes les demandes ont été traitées
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {/* Informations de la demande */}
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                      request.operation_type === 'recharge' 
                        ? 'bg-green-100' 
                        : 'bg-blue-100'
                    }`}>
                      {request.operation_type === 'recharge' ? (
                        <ArrowDownCircle className={`w-6 h-6 ${
                          request.operation_type === 'recharge' 
                            ? 'text-green-600' 
                            : 'text-blue-600'
                        }`} />
                      ) : (
                        <ArrowUpCircle className={`w-6 h-6 ${
                          request.operation_type === 'recharge' 
                            ? 'text-green-600' 
                            : 'text-blue-600'
                        }`} />
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {request.operation_type === 'recharge' ? 'Demande de Recharge' : 'Demande de Retrait'}
                        </h3>
                        <Badge variant={request.operation_type === 'recharge' ? 'default' : 'secondary'}>
                          {request.amount.toLocaleString()} FCFA
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{request.user_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>{request.user_phone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Banknote className="w-4 h-4" />
                          <span>{request.payment_method}</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1">
                        Numéro de paiement: {request.payment_phone}
                      </p>
                      <p className="text-xs text-gray-500">
                        Il y a {formatDistanceToNow(new Date(request.created_at), { locale: fr })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => handleApproveRequest(request)}
                      disabled={processingRequest === request.id}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                    >
                      {processingRequest === request.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Approuver
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => handleRejectRequest(request)}
                      disabled={processingRequest === request.id}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubAdminRequestsTab;
