import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreditCard, Clock, CheckCircle, XCircle, User, Phone, Wallet } from 'lucide-react';
import { formatCurrency } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubAdminQuota } from '@/hooks/useSubAdminQuota';

type UserRequest = {
  id: string;
  user_id: string;
  operation_type: string;
  amount: number;
  payment_method: string;
  payment_phone: string;
  status: string;
  created_at: string;
  processed_by?: string | null;
  processed_at?: string | null;
  rejection_reason?: string | null;
  profiles?: {
    full_name: string;
    phone: string;
    country: string;
  } | null;
};

const SubAdminRechargeTab = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { checkAmountAndQuota, recordRequest } = useSubAdminQuota();
  const [userRequests, setUserRequests] = useState<UserRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fonction pour charger les demandes utilisateurs
  const fetchUserRequests = async () => {
    try {
      console.log('🔄 Chargement des demandes utilisateurs...');

      const { data: requests, error } = await supabase
        .from('user_requests')
        .select(`
          id,
          user_id,
          operation_type,
          amount,
          payment_method,
          payment_phone,
          status,
          created_at,
          processed_by,
          processed_at,
          rejection_reason
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des demandes:', error);
        throw error;
      }

      // Fetch profile data separately for each request
      const requestsWithProfiles = await Promise.all(
        (requests || []).map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone, country')
            .eq('id', request.user_id)
            .single();
          
          return {
            ...request,
            profiles: profile
          };
        })
      );

      console.log('✅ Demandes chargées:', requestsWithProfiles);
      setUserRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Erreur critique:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des demandes",
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
          if (!isProcessing) {
            setTimeout(() => {
              fetchUserRequests();
            }, 500);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔇 Désabonnement du canal user_requests');
      supabase.removeChannel(channel);
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

      // Vérifier les quotas et montants pour les sous-administrateurs
      if (!checkAmountAndQuota(request.amount)) {
        return;
      }

      // 1. Mettre à jour le statut de la demande
      const { error: updateError } = await supabase
        .from('user_requests')
        .update({
          status: 'approved',
          processed_by: user?.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('❌ Erreur lors de l\'approbation:', updateError);
        toast({
          title: "Erreur",
          description: "Impossible d'approuver la demande: " + updateError.message,
          variant: "destructive"
        });
        return;
      }

      // 2. Traiter automatiquement le solde selon le type d'opération
      if (request.operation_type === 'recharge') {
        // Pour une recharge approuvée : créditer le compte de l'utilisateur
        const { error: creditError } = await supabase.rpc('secure_increment_balance', {
          target_user_id: request.user_id,
          amount: request.amount,
          operation_type: 'sub_admin_approved_recharge',
          performed_by: user?.id
        });

        if (creditError) {
          console.error('❌ Erreur lors du crédit:', creditError);
          toast({
            title: "Erreur",
            description: "Erreur lors du crédit automatique: " + creditError.message,
            variant: "destructive"
          });
          // Annuler l'approbation en cas d'erreur
          await supabase
            .from('user_requests')
            .update({ status: 'pending', processed_by: null, processed_at: null })
            .eq('id', requestId);
          return;
        }

        console.log(`✅ Compte crédité de ${request.amount} FCFA pour l'utilisateur`);
      } else if (request.operation_type === 'withdrawal') {
        // Pour un retrait approuvé : débiter le compte de l'utilisateur
        const { error: debitError } = await supabase.rpc('secure_increment_balance', {
          target_user_id: request.user_id,
          amount: -request.amount,
          operation_type: 'sub_admin_approved_withdrawal',
          performed_by: user?.id
        });

        if (debitError) {
          console.error('❌ Erreur lors du débit:', debitError);
          toast({
            title: "Erreur",
            description: "Erreur lors du débit automatique: " + debitError.message,
            variant: "destructive"
          });
          // Annuler l'approbation en cas d'erreur
          await supabase
            .from('user_requests')
            .update({ status: 'pending', processed_by: null, processed_at: null })
            .eq('id', requestId);
          return;
        }

        console.log(`✅ Compte débité de ${request.amount} FCFA pour l'utilisateur`);
      }

      // Enregistrer l'utilisation du quota
      await recordRequest('user_request_approval');

      console.log('✅ Approbation et traitement automatique réussis pour:', requestId);

      const operationText = request.operation_type === 'recharge' ? 'Recharge' : 'Retrait';
      const balanceAction = request.operation_type === 'recharge' ? 'crédité' : 'débité';
      
      toast({
        title: "Demande approuvée",
        description: `${operationText} approuvé avec succès. Le compte a été ${balanceAction} automatiquement de ${request.amount.toLocaleString()} FCFA`,
      });

      // Recharger les données immédiatement
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

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez fournir une raison pour le rejet",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(selectedRequest.id);
      console.log('🔄 Début rejet pour:', selectedRequest.id);

      const { error } = await supabase
        .from('user_requests')
        .update({
          status: 'rejected',
          processed_by: user?.id,
          processed_at: new Date().toISOString(),
          rejection_reason: rejectionReason
        })
        .eq('id', selectedRequest.id);

      if (error) {
        console.error('❌ Erreur lors du rejet:', error);
        toast({
          title: "Erreur",
          description: "Impossible de rejeter la demande: " + error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Rejet réussi pour:', selectedRequest.id);

      toast({
        title: "Demande rejetée",
        description: `${selectedRequest.operation_type === 'recharge' ? 'Recharge' : 'Retrait'} rejeté`,
      });

      // Fermer le dialogue et réinitialiser
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason('');
      
      // Recharger les données immédiatement
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
      <Wallet className="w-4 h-4 text-green-600" /> : 
      <CreditCard className="w-4 h-4 text-red-600" />;
  };

  // Filtrer les demandes
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
                          <span>{request.profiles?.full_name || 'Utilisateur inconnu'}</span>
                          <Phone className="w-3 h-3 ml-2" />
                          <span>{request.profiles?.phone || 'Téléphone inconnu'}</span>
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
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowRejectDialog(true);
                      }}
                      disabled={isProcessing === request.id}
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
                     Traité le: {request.processed_at ? new Date(request.processed_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
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

      {/* Dialog de rejet */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Veuillez indiquer la raison du rejet :
              </p>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Informations insuffisantes, montant incorrect..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || isProcessing === selectedRequest?.id}
              >
                {isProcessing === selectedRequest?.id ? 'Traitement...' : 'Confirmer le rejet'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubAdminRechargeTab;
