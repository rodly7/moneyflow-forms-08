import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Receipt, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BillPayment {
  id: string;
  amount: number;
  status: string;
  bill_type: string;
  provider_name?: string;
  payment_number?: string;
  meter_number?: string;
  created_at: string;
  user_id: string;
  client_name?: string;
  client_phone?: string;
  profiles?: {
    full_name: string;
    phone: string;
  };
}

const BillPaymentRequests = () => {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<BillPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<BillPayment | null>(null);
  const [totalReceived, setTotalReceived] = useState(0);
  const [todayReceived, setTodayReceived] = useState(0);
  const prevBalanceRef = useRef<number | null>(null);

  const fetchBillPayments = async () => {
    if (!profile?.id) return;

    try {
      // Récupérer les paiements de factures où ce marchand est le bénéficiaire
      const { data: merchantPayments, error } = await supabase
        .from('merchant_payments')
        .select(`
          *
        `)
        .eq('merchant_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des paiements:', error);
        toast.error('Erreur lors du chargement des paiements');
        return;
      }

      // Récupérer aussi les factures automatiques payées pour ce marchand
      const { data: billPayments, error: billError } = await supabase
        .from('bill_payment_history')
        .select(`
          *,
          automatic_bills!inner (
            bill_name,
            provider_name,
            payment_number,
            meter_number
          )
        `)
        .eq('automatic_bills.provider_name', profile.full_name || '')
        .eq('status', 'success')
        .order('created_at', { ascending: false });

      if (billError) {
        console.error('Erreur lors de la récupération des factures:', billError);
      }

      // Récupérer les retraits effectués par ce marchand (agent)
      const { data: withdrawals, error: withdrawalError } = await (supabase as any)
        .from('withdrawals')
        .select('id, user_id, amount, status, created_at')
        .eq('agent_id', profile.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (withdrawalError) {
        console.error('Erreur lors de la récupération des retraits:', withdrawalError);
      }

      // Récupérer les profils des utilisateurs
      const userIds = [
        ...(merchantPayments || []).map(p => p.user_id),
        ...(billPayments || []).map(p => p.user_id),
        ...(withdrawals || []).map(p => p.user_id)
      ];
      
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', [...new Set(userIds)]);

      const profilesMap = new Map(
        (userProfiles || []).map(profile => [profile.id, profile])
      );

      // Combiner et formater les données
      const allPayments: BillPayment[] = [
        // Paiements marchands
        ...(merchantPayments || []).map(payment => ({
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          bill_type: 'payment_merchant',
          provider_name: payment.business_name,
          payment_number: '',
          meter_number: payment.meter_number || '',
          client_name: payment.client_name,
          client_phone: payment.client_phone,
          created_at: payment.created_at,
          user_id: payment.user_id,
          profiles: profilesMap.get(payment.user_id) || { full_name: payment.client_name || 'N/A', phone: payment.client_phone || 'N/A' }
        })),
        // Paiements de factures
        ...(billPayments || []).map(payment => ({
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          bill_type: payment.automatic_bills.bill_name,
          provider_name: payment.automatic_bills.provider_name,
          payment_number: payment.automatic_bills.payment_number,
          meter_number: payment.automatic_bills.meter_number,
          created_at: payment.created_at,
          user_id: payment.user_id,
          profiles: profilesMap.get(payment.user_id) || { full_name: 'N/A', phone: 'N/A' }
        })),
        // Retraits effectués par ce marchand
        ...(withdrawals || []).map(withdrawal => ({
          id: withdrawal.id,
          amount: withdrawal.amount,
          status: withdrawal.status,
          bill_type: 'retrait',
          provider_name: 'Retrait d\'espèces',
          payment_number: '',
          meter_number: '',
          created_at: withdrawal.created_at,
          user_id: withdrawal.user_id,
          profiles: profilesMap.get(withdrawal.user_id) || { full_name: 'N/A', phone: 'N/A' }
        }))
      ];

      setPayments(allPayments);

      // Calculer les totaux
      const successfulPayments = allPayments.filter(p => 
        p.status === 'completed' || p.status === 'success'
      );
      
      const total = successfulPayments.reduce((sum, payment) => sum + payment.amount, 0);
      setTotalReceived(total);

      // Calculer le total d'aujourd'hui
      const today = new Date().toDateString();
      const todayPayments = successfulPayments.filter(payment => 
        new Date(payment.created_at).toDateString() === today
      );
      const todayTotal = todayPayments.reduce((sum, payment) => sum + payment.amount, 0);
      setTodayReceived(todayTotal);

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillPayments();

    // Rafraîchissement automatique toutes les 5 secondes
    const refreshInterval = setInterval(() => {
      fetchBillPayments();
    }, 5000);

    // Écouter les nouveaux paiements en temps réel
    const merchantChannel = supabase
      .channel('merchant-bill-payments')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'merchant_payments',
        filter: `merchant_id=eq.${profile?.id}`
      }, () => {
        fetchBillPayments();
        toast.success('Nouveau paiement reçu!');
      })
      .subscribe();

    // Écouter les nouveaux retraits effectués par ce marchand
    const withdrawalChannel = supabase
      .channel('merchant-withdrawals')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'withdrawals',
        filter: `agent_id=eq.${profile?.id}`
      }, (payload) => {
        console.log('🔔 Nouveau retrait détecté:', payload);
        fetchBillPayments();
        if (payload.new && (payload.new as any).amount) {
          const amt = Number((payload.new as any).amount) || 0;
          toast.success(`💰 Retrait de ${amt.toLocaleString()} FCFA effectué pour un client`);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'withdrawals',
        filter: `agent_id=eq.${profile?.id}`
      }, (payload) => {
        try {
          const newRow: any = payload.new;
          if (newRow?.status === 'completed') {
            const amt = Number(newRow.amount) || 0;
            toast.success(`💰 Retrait confirmé: ${amt.toLocaleString()} FCFA`);
            fetchBillPayments();
          }
        } catch (e) {
          console.error('Erreur écoute retraits:', e);
        }
      })
      .subscribe();

    // Écouter les variations du solde du marchand pour afficher une notification de débit
    if (typeof (profile as any)?.balance === 'number') {
      prevBalanceRef.current = (profile as any).balance as number;
    }
    const balanceChannel = supabase
      .channel('profile-balance-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${profile?.id}`
      }, (payload) => {
        const newBal = Number((payload.new as any)?.balance) || 0;
        if (prevBalanceRef.current !== null && newBal < prevBalanceRef.current) {
          toast.info(`💸 Retrait débité: ${Math.abs(newBal - prevBalanceRef.current).toLocaleString()} FCFA`);
        }
        prevBalanceRef.current = newBal;
      })
      .subscribe();

    return () => {
      clearInterval(refreshInterval);
      supabase.removeChannel(merchantChannel);
      supabase.removeChannel(withdrawalChannel);
      supabase.removeChannel(balanceChannel);
    };
  }, [profile?.id]);

  // Afficher une notification quand le solde est débité
  useEffect(() => {
    const current = (profile as any)?.balance;
    if (typeof current === 'number' && prevBalanceRef.current !== null) {
      const delta = current - prevBalanceRef.current;
      if (delta < 0) {
        toast.info(`💸 Retrait débité: ${Math.abs(delta).toLocaleString()} FCFA`);
      }
    }
    if (typeof current === 'number') {
      prevBalanceRef.current = current;
    }
  }, [profile?.balance]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Receipt className="w-4 h-4" />;
    }
  };

      const getBillTypeLabel = (billType: string) => {
        const types: Record<string, string> = {
          'payment_merchant': 'Paiement par scanner',
          'retrait': 'Retrait d\'espèces',
          'electricity': 'Électricité',
          'water': 'Eau',
          'internet': 'Internet',
          'phone': 'Téléphone',
          'tv': 'Télévision',
          'insurance': 'Assurance',
        };
        return types[billType] || billType;
      };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Chargement des paiements...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Paiements de factures reçus
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Résumé des montants reçus */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-center">
            <p className="text-sm font-medium text-green-700 mb-1">Argent reçu aujourd'hui</p>
            <p className="text-2xl font-bold text-green-800">
              {todayReceived.toLocaleString()} FCFA
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-green-700 mb-1">Total argent reçu</p>
            <p className="text-2xl font-bold text-green-800">
              {totalReceived.toLocaleString()} FCFA
            </p>
          </div>
        </div>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun paiement reçu</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(payment.status)}>
                        {getStatusIcon(payment.status)}
                        <span className="ml-1">
                          {payment.status === 'completed' || payment.status === 'success' 
                            ? 'Payé' 
                            : payment.status === 'pending' 
                              ? 'En attente' 
                              : 'Échoué'
                          }
                        </span>
                      </Badge>
                      <Badge variant="outline">
                        {getBillTypeLabel(payment.bill_type)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Montant: </span>
                        <span className="text-green-600 font-bold">
                          {payment.amount.toLocaleString()} FCFA
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Client: </span>
                        <span>{payment.client_name || payment.profiles?.full_name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium">Téléphone: </span>
                        <span>{payment.client_phone || payment.profiles?.phone || 'N/A'}</span>
                      </div>
                    </div>
                    
                    {(payment.payment_number || payment.meter_number) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-2">
                        {payment.payment_number && (
                          <div>
                            <span className="font-medium">N° Paiement: </span>
                            <span>{payment.payment_number}</span>
                          </div>
                        )}
                        {payment.meter_number && (
                          <div>
                            <span className="font-medium">N° Compteur: </span>
                            <span>{payment.meter_number}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-2">
                      {formatDistanceToNow(new Date(payment.created_at), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Détails du paiement</DialogTitle>
                        </DialogHeader>
                        {selectedPayment && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-500">
                                  Montant
                                </label>
                                <p className="text-lg font-bold text-green-600">
                                  {selectedPayment.amount.toLocaleString()} FCFA
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">
                                  Statut
                                </label>
                                <Badge className={getStatusColor(selectedPayment.status)}>
                                  {getStatusIcon(selectedPayment.status)}
                                  <span className="ml-1">
                                    {selectedPayment.status === 'completed' || selectedPayment.status === 'success' 
                                      ? 'Payé' 
                                      : selectedPayment.status === 'pending' 
                                        ? 'En attente' 
                                        : 'Échoué'
                                    }
                                  </span>
                                </Badge>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-500">
                                Type de facture
                              </label>
                              <p>{getBillTypeLabel(selectedPayment.bill_type)}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-500">
                                  Client
                                </label>
                                <p>{selectedPayment.client_name || selectedPayment.profiles?.full_name || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">
                                  Téléphone
                                </label>
                                <p>{selectedPayment.client_phone || selectedPayment.profiles?.phone || 'N/A'}</p>
                              </div>
                            </div>
                            
                             {(selectedPayment.provider_name || selectedPayment.meter_number) && (
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {selectedPayment.provider_name && (
                                   <div>
                                     <label className="text-sm font-medium text-gray-500">
                                       Fournisseur
                                     </label>
                                     <p>{selectedPayment.provider_name}</p>
                                   </div>
                                 )}
                                 {selectedPayment.meter_number && (
                                   <div>
                                     <label className="text-sm font-medium text-gray-500">
                                       Numéro de compteur
                                     </label>
                                     <p>{selectedPayment.meter_number}</p>
                                   </div>
                                 )}
                               </div>
                             )}
                             
                             <div>
                               <label className="text-sm font-medium text-gray-500">
                                 Date et heure
                               </label>
                               <p>{new Date(selectedPayment.created_at).toLocaleString('fr-FR')}</p>
                             </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BillPaymentRequests;