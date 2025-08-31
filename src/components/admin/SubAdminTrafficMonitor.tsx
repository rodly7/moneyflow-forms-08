import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Eye,
  Filter,
  CreditCard,
  Wallet,
  Download,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMainAdmin } from '@/hooks/useMainAdmin';
import jsPDF from 'jspdf';

type SubAdminRequest = {
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

type SubAdminStats = {
  id: string;
  full_name: string;
  phone: string;
  country: string;
  total_processed: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
};

const SubAdminTrafficMonitor = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isMainAdmin } = useMainAdmin();
  const [subAdmins, setSubAdmins] = useState<SubAdminStats[]>([]);
  const [subAdminRequests, setSubAdminRequests] = useState<SubAdminRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SubAdminRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Nouveaux états pour les totaux
  const [totalApprovedRecharges, setTotalApprovedRecharges] = useState(0);
  const [totalApprovedWithdrawals, setTotalApprovedWithdrawals] = useState(0);

  // Fonction pour charger les sous-administrateurs
  const fetchSubAdmins = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, country')
        .eq('role', 'sub_admin');

      if (error) throw error;

      // Pour chaque sous-admin, calculer les statistiques
      const subAdminStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: requests } = await supabase
            .from('user_requests')
            .select('status, processed_by')
            .eq('processed_by', profile.id);

          const totalProcessed = requests?.length || 0;
          const pendingRequests = requests?.filter(r => r.status === 'pending').length || 0;
          const approvedRequests = requests?.filter(r => r.status === 'approved').length || 0;
          const rejectedRequests = requests?.filter(r => r.status === 'rejected').length || 0;

          return {
            id: profile.id,
            full_name: profile.full_name,
            phone: profile.phone,
            country: profile.country,
            total_processed: totalProcessed,
            pending_requests: pendingRequests,
            approved_requests: approvedRequests,
            rejected_requests: rejectedRequests,
          };
        })
      );

      setSubAdmins(subAdminStats);
    } catch (error) {
      console.error('Erreur lors du chargement des sous-admins:', error);
    }
  };

  // Fonction pour calculer les totaux des opérations approuvées
  const calculateApprovedTotals = (requests: SubAdminRequest[]) => {
    const approvedRequests = requests.filter(req => req.status === 'approved');
    
    const rechargesTotal = approvedRequests
      .filter(req => req.operation_type === 'recharge')
      .reduce((sum, req) => sum + req.amount, 0);
    
    const withdrawalsTotal = approvedRequests
      .filter(req => req.operation_type === 'withdrawal')
      .reduce((sum, req) => sum + req.amount, 0);
    
    setTotalApprovedRecharges(rechargesTotal);
    setTotalApprovedWithdrawals(withdrawalsTotal);
  };

  // Fonction pour télécharger le rapport en PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('fr-FR');
    
    // Titre du document
    doc.setFontSize(20);
    doc.text('Rapport Trafic Sous-Administrateurs', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Date de génération: ${currentDate}`, 20, 30);
    
    // Totaux
    doc.setFontSize(16);
    doc.text('Résumé des montants approuvés:', 20, 50);
    
    doc.setFontSize(12);
    doc.text(`Total Recharges Approuvées: ${formatCurrency(totalApprovedRecharges, 'XAF')}`, 20, 60);
    doc.text(`Total Retraits Approuvés: ${formatCurrency(totalApprovedWithdrawals, 'XAF')}`, 20, 70);
    doc.text(`Total Général: ${formatCurrency(totalApprovedRecharges + totalApprovedWithdrawals, 'XAF')}`, 20, 80);
    
    // Statistiques par sous-admin
    doc.setFontSize(16);
    doc.text('Statistiques par Sous-Admin:', 20, 100);
    
    let yPos = 110;
    subAdmins.forEach((subAdmin, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.text(`${subAdmin.full_name} (${subAdmin.country})`, 20, yPos);
      doc.text(`  - Total traité: ${subAdmin.total_processed}`, 20, yPos + 10);
      doc.text(`  - Approuvées: ${subAdmin.approved_requests}`, 20, yPos + 20);
      doc.text(`  - Rejetées: ${subAdmin.rejected_requests}`, 20, yPos + 30);
      
      yPos += 45;
    });
    
    // Liste des demandes filtrées
    const filteredRequests = statusFilter === 'all' 
      ? subAdminRequests 
      : subAdminRequests.filter(req => req.status === statusFilter);
    
    if (filteredRequests.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Historique des Demandes:', 20, 20);
      
      yPos = 30;
      filteredRequests.forEach((request, index) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        const operationType = request.operation_type === 'recharge' ? 'Recharge' : 'Retrait';
        const status = request.status === 'approved' ? 'Approuvée' : 
                      request.status === 'rejected' ? 'Rejetée' : 'En attente';
        
        doc.setFontSize(10);
        doc.text(`${operationType} - ${formatCurrency(request.amount, 'XAF')} - ${status}`, 20, yPos);
        doc.text(`Utilisateur: ${request.profiles?.full_name || 'Inconnu'}`, 20, yPos + 10);
        doc.text(`Traité par: ${request.processor_profile?.full_name || 'Non traité'}`, 20, yPos + 20);
        
        yPos += 30;
      });
    }
    
    // Sauvegarde
    doc.save(`rapport-sous-admins-${currentDate.replace(/\//g, '-')}.pdf`);
    
    toast({
      title: "PDF généré",
      description: "Le rapport a été téléchargé avec succès",
    });
  };

  // Fonction pour charger toutes les demandes traitées par les sous-admins
  const fetchSubAdminRequests = async () => {
    try {
      console.log('🔄 Chargement des demandes traitées par les sous-admins...');

      // D'abord, récupérer tous les IDs des sous-admins
      const { data: subAdminProfiles, error: subAdminError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'sub_admin');

      if (subAdminError) throw subAdminError;

      const subAdminIds = subAdminProfiles?.map(p => p.id) || [];

      if (subAdminIds.length === 0) {
        setSubAdminRequests([]);
        calculateApprovedTotals([]);
        return;
      }

      // Récupérer toutes les demandes traitées par des sous-admins
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
        .in('processed_by', subAdminIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Récupérer les profils des demandeurs et des processeurs
      const requestsWithProfiles = await Promise.all(
        (requests || []).map(async (request) => {
          // Profile du demandeur
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone, country')
            .eq('id', request.user_id)
            .single();
          
          // Profile du sous-admin qui a traité
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

      console.log('✅ Demandes des sous-admins chargées:', requestsWithProfiles);
      setSubAdminRequests(requestsWithProfiles);
      calculateApprovedTotals(requestsWithProfiles);
    } catch (error) {
      console.error('Erreur critique:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des demandes des sous-admins",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (isMainAdmin) {
      fetchSubAdmins();
      fetchSubAdminRequests();
    }
    setIsLoading(false);
  }, [isMainAdmin]);

  // Auto-refresh toutes les 10 secondes
  useEffect(() => {
    if (!isMainAdmin) return;
    
    const interval = setInterval(() => {
      if (!isProcessing) {
        fetchSubAdmins();
        fetchSubAdminRequests();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isProcessing, isMainAdmin]);

  const handleAdminOverride = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      setIsProcessing(requestId);
      console.log(`🔄 Début ${action} admin pour:`, requestId);
      
      const request = subAdminRequests.find(r => r.id === requestId);
      if (!request) {
        console.error('Demande non trouvée:', requestId);
        return;
      }

      let updateData: any = {
        processed_by: user?.id,
        processed_at: new Date().toISOString()
      };

      if (action === 'approve') {
        updateData.status = 'approved';
        
        // Traiter automatiquement le solde
        if (request.operation_type === 'recharge') {
          const { error: creditError } = await supabase.rpc('secure_increment_balance', {
            target_user_id: request.user_id,
            amount: request.amount,
            operation_type: 'admin_override_recharge',
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
            operation_type: 'admin_override_withdrawal',
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
      } else {
        updateData.status = 'rejected';
        updateData.rejection_reason = `[ADMIN OVERRIDE] ${rejectionReason}`;
      }

      // Mettre à jour le statut de la demande
      const { error: updateError } = await supabase
        .from('user_requests')
        .update(updateData)
        .eq('id', requestId);

      if (updateError) {
        console.error(`❌ Erreur lors du ${action} admin:`, updateError);
        toast({
          title: "Erreur",
          description: `Impossible de ${action === 'approve' ? 'approuver' : 'rejeter'} la demande: ` + updateError.message,
          variant: "destructive"
        });
        return;
      }

      console.log(`✅ ${action} admin réussi pour:`, requestId);

      const operationText = request.operation_type === 'recharge' ? 'Recharge' : 'Retrait';
      
      toast({
        title: `Demande ${action === 'approve' ? 'approuvée' : 'rejetée'} par l'admin`,
        description: `${operationText} ${action === 'approve' ? 'approuvé' : 'rejeté'} par l'administrateur principal (override)`,
      });

      if (action === 'reject') {
        setShowRejectDialog(false);
        setSelectedRequest(null);
        setRejectionReason('');
      }
      
      fetchSubAdminRequests();
    } catch (error) {
      console.error(`💥 Erreur lors du ${action} admin:`, error);
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
    ? subAdminRequests 
    : subAdminRequests.filter(req => req.status === statusFilter);

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
              <Users className="w-5 h-5" />
              Chargement du trafic des sous-admins...
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
          <Users className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Trafic des Sous-Administrateurs</h2>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Historique des demandes
          </TabsTrigger>
        </TabsList>

        {/* Onglet Vue d'ensemble */}
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subAdmins.map((subAdmin) => (
              <Card key={subAdmin.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {subAdmin.full_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {subAdmin.phone} • {subAdmin.country}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total traité:</span>
                    <Badge variant="outline">{subAdmin.total_processed}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">En attente:</span>
                    <Badge className="bg-yellow-100 text-yellow-800">{subAdmin.pending_requests}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Approuvées:</span>
                    <Badge className="bg-green-100 text-green-800">{subAdmin.approved_requests}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rejetées:</span>
                    <Badge className="bg-red-100 text-red-800">{subAdmin.rejected_requests}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Onglet Historique des demandes */}
        <TabsContent value="requests">
          <div className="space-y-4">
            {/* Cartes de résumé des totaux */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Recharges Approuvées</CardTitle>
                  <Wallet className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalApprovedRecharges, 'XAF')}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Retraits Approuvés</CardTitle>
                  <CreditCard className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(totalApprovedWithdrawals, 'XAF')}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Général</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totalApprovedRecharges + totalApprovedWithdrawals, 'XAF')}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Historique des demandes traitées par les sous-admins</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={downloadPDF}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger PDF
                </Button>
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

            <Card>
              <CardHeader>
                <CardTitle>Demandes traitées par les sous-admins ({filteredRequests.length})</CardTitle>
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
                        <TableHead>Actions Admin</TableHead>
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
                                  <div className="text-sm text-muted-foreground">Sous-admin</div>
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
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleAdminOverride(request.id, 'approve')}
                                  disabled={isProcessing === request.id}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {isProcessing === request.id ? 'Traitement...' : 'Override Approuver'}
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
                                  Override Rejeter
                                </Button>
                              </div>
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
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de rejet */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande (Override Administrateur)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Raison du rejet (Override)</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Expliquez pourquoi cette demande est rejetée par l'administrateur principal (override)..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleAdminOverride(selectedRequest?.id || '', 'reject')} 
                disabled={!rejectionReason.trim()}
              >
                Rejeter (Override)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubAdminTrafficMonitor;
