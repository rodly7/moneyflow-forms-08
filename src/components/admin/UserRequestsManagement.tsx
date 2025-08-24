
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

type UserRequest = {
  id: string;
  user_id: string;
  operation_type: 'recharge' | 'withdrawal';
  amount: number;
  payment_method: string;
  payment_phone: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  processed_by?: string;
  processed_at?: string;
  rejection_reason?: string;
  profiles?: {
    full_name: string;
    phone: string;
    country: string;
  } | null;
};

const UserRequestsManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
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
          updated_at,
          processed_by,
          processed_at,
          rejection_reason,
          profiles!user_id (
            full_name,
            phone,
            country
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des demandes:', error);
        throw error;
      }

      console.log('✅ Demandes chargées:', requests);
      setUserRequests(requests as UserRequest[] || []);
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

      const { error } = await supabase
        .from('user_requests')
        .update({
          status: 'approved',
          processed_by: user?.id,
          processed_at: new Date().toISOString()
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
          <h2 className="text-2xl font-bold">Demandes des Utilisateurs</h2>
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
                          <span>{request.profiles?.phone}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-muted-foreground">Méthode: </span>
                      <span className="font-semibold">{request.payment_method}</span>
                      <span className="text-muted-foreground ml-2">Numéro: </span>
                      <span className="font-mono">{request.payment_phone}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date: </span>
                      <span>{new Date(request.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                    <p className="text-blue-800">
                      <strong>Instruction:</strong> {request.operation_type === 'recharge' 
                        ? `Vérifiez que vous avez reçu ${formatCurrency(request.amount, 'XAF')} via ${request.payment_method} au numéro ${request.payment_phone}`
                        : `Envoyez ${formatCurrency(request.amount, 'XAF')} à l'utilisateur via ${request.payment_method} au numéro ${request.payment_phone}`
                      }
                    </p>
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
                    Traité le: {request.processed_at ? new Date(request.processed_at).toLocaleDateString('fr-FR') : 'N/A'}
                  </div>
                  {request.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-800">
                      <strong>Raison du rejet:</strong> {request.rejection_reason}
                    </div>
                  )}
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
              <label className="text-sm font-medium">Raison du rejet</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Expliquez pourquoi cette demande est rejetée..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>
                Rejeter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserRequestsManagement;
