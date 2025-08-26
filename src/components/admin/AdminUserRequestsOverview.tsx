
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Phone, 
  Wallet,
  Eye,
  Filter
} from 'lucide-react';
import { formatCurrency } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMainAdmin } from '@/hooks/useMainAdmin';

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
  processor_profile?: {
    full_name: string;
    phone: string;
    role: string;
  } | null;
};

const AdminUserRequestsOverview = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isMainAdmin } = useMainAdmin();
  const [userRequests, setUserRequests] = useState<UserRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fonction pour charger toutes les demandes utilisateurs
  const fetchAllUserRequests = async () => {
    try {
      console.log('🔄 Chargement de toutes les demandes utilisateurs...');

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

      // Fetch profile data for each request and processor
      const requestsWithProfiles = await Promise.all(
        (requests || []).map(async (request) => {
          // Profile du demandeur
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone, country')
            .eq('id', request.user_id)
            .single();
          
          // Profile du processeur (sous-admin qui a traité)
          let processorProfile = null;
          if (request.processed_by) {
            const { data: processor } = await supabase
              .from('profiles')
              .select('full_name, phone, role')
              .eq('id', request.processed_by)
              .single();
            processorProfile = processor;
          }
          
          return {
            ...request,
            profiles: profile,
            processor_profile: processorProfile
          };
        })
      );

      console.log('✅ Toutes les demandes chargées:', requestsWithProfiles);
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

  useEffect(() => {
    if (isMainAdmin) {
      fetchAllUserRequests();
    }
  }, [isMainAdmin]);

  // Auto-refresh toutes les 10 secondes
  useEffect(() => {
    if (!isMainAdmin) return;
    
    const interval = setInterval(() => {
      if (!isProcessing) {
        fetchAllUserRequests();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isProcessing, isMainAdmin]);

  const handleAdminApprove = async (requestId: string) => {
    try {
      setIsProcessing(requestId);
      console.log('🔄 Début approbation admin pour:', requestId);
      
      const request = userRequests.find(r => r.id === requestId);
      if (!request) {
        console.error('Demande non trouvée:', requestId);
        return;
      }

      // Mettre à jour le statut de la demande avec l'admin principal
      const { error: updateError } = await supabase
        .from('user_requests')
        .update({
          status: 'approved',
          processed_by: user?.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('❌ Erreur lors de l\'approbation admin:', updateError);
        toast({
          title: "Erreur",
          description: "Impossible d'approuver la demande: " + updateError.message,
          variant: "destructive"
        });
        return;
      }

      // Traiter automatiquement le solde
      if (request.operation_type === 'recharge') {
        const { error: creditError } = await supabase.rpc('secure_increment_balance', {
          target_user_id: request.user_id,
          amount: request.amount,
          operation_type: 'admin_approved_recharge',
          performed_by: user?.id
        });

        if (creditError) {
          console.error('❌ Erreur lors du crédit admin:', creditError);
          toast({
            title: "Erreur",
            description: "Erreur lors du crédit automatique: " + creditError.message,
            variant: "destructive"
          });
          return;
        }
      } else if (request.operation_type === 'withdrawal') {
        const { error: debitError } = await supabase.rpc('secure_increment_balance', {
          target_user_id: request.user_id,
          amount: -request.amount,
          operation_type: 'admin_approved_withdrawal',
          performed_by: user?.id
        });

        if (debitError) {
          console.error('❌ Erreur lors du débit admin:', debitError);
          toast({
            title: "Erreur",
            description: "Erreur lors du débit automatique: " + debitError.message,
            variant: "destructive"
          });
          return;
        }
      }

      console.log('✅ Approbation admin réussie pour:', requestId);

      const operationText = request.operation_type === 'recharge' ? 'Recharge' : 'Retrait';
      const balanceAction = request.operation_type === 'recharge' ? 'crédité' : 'débité';
      
      toast({
        title: "Demande approuvée par l'admin",
        description: `${operationText} approuvé par l'administrateur principal. Le compte a été ${balanceAction} automatiquement de ${request.amount.toLocaleString()} FCFA`,
      });

      fetchAllUserRequests();
    } catch (error) {
      console.error('💥 Erreur lors de l\'approbation admin:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du traitement de la demande",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleAdminReject = async () => {
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
      console.log('🔄 Début rejet admin pour:', selectedRequest.id);

      const { error } = await supabase
        .from('user_requests')
        .update({
          status: 'rejected',
          processed_by: user?.id,
          processed_at: new Date().toISOString(),
          rejection_reason: `[ADMIN] ${rejectionReason}`
        })
        .eq('id', selectedRequest.id);

      if (error) {
        console.error('❌ Erreur lors du rejet admin:', error);
        toast({
          title: "Erreur",
          description: "Impossible de rejeter la demande: " + error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Rejet admin réussi pour:', selectedRequest.id);

      toast({
        title: "Demande rejetée par l'admin",
        description: `${selectedRequest.operation_type === 'recharge' ? 'Recharge' : 'Retrait'} rejeté par l'administrateur principal`,
      });

      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason('');
      
      fetchAllUserRequests();
    } catch (error) {
      console.error('💥 Erreur lors du rejet admin:', error);
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

  // Filtrer les demandes selon le statut
  const filteredRequests = statusFilter === 'all' 
    ? userRequests 
    : userRequests.filter(req => req.status === statusFilter);

  if (!isMainAdmin) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Accès refusé</h3>
          <p className="text-muted-foreground">Seul l'administrateur principal peut accéder à cette section.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Chargement de l'historique...
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

  const pendingRequests = filteredRequests.filter(req => req.status === 'pending');
  const approvedRequests = filteredRequests.filter(req => req.status === 'approved');
  const rejectedRequests = filteredRequests.filter(req => req.status === 'rejected');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Historique de toutes les demandes</h2>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            <Filter className="w-4 h-4 mr-1" />
            Toutes
          </Button>
          <Button 
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('pending')}
          >
            En attente
          </Button>
          <Button 
            variant={statusFilter === 'approved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('approved')}
          >
            Approuvées
          </Button>
          <Button 
            variant={statusFilter === 'rejected' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('rejected')}
          >
            Rejetées
          </Button>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total demandes</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejetées</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedRequests.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des demandes */}
      <Card>
        <CardHeader>
          <CardTitle>Toutes les demandes ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Traité par</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getOperationIcon(request.operation_type)}
                          {getOperationTypeLabel(request.operation_type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.profiles?.full_name || 'Inconnu'}</div>
                          <div className="text-sm text-muted-foreground">{request.profiles?.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{formatCurrency(request.amount, 'XAF')}</TableCell>
                      <TableCell>
                        <div>
                          <div>{request.payment_method}</div>
                          <div className="text-sm text-muted-foreground">{request.payment_phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {request.processor_profile ? (
                          <div>
                            <div className="font-medium">{request.processor_profile.full_name}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {request.processor_profile.role?.replace('_', ' ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Non traité</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>Créé: {new Date(request.created_at).toLocaleDateString('fr-FR')}</div>
                        {request.processed_at && (
                          <div className="text-muted-foreground">
                            Traité: {new Date(request.processed_at).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {request.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleAdminApprove(request.id)}
                              disabled={isProcessing === request.id}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
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
                              <XCircle className="w-3 h-3 mr-1" />
                              Rejeter
                            </Button>
                          </div>
                        )}
                        {request.status !== 'pending' && (
                          <span className="text-sm text-muted-foreground">
                            {request.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucune demande trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de rejet */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande (Administrateur)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Raison du rejet</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Expliquez pourquoi cette demande est rejetée par l'administrateur principal..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleAdminReject} 
                disabled={!rejectionReason.trim()}
              >
                Rejeter définitivement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserRequestsOverview;
