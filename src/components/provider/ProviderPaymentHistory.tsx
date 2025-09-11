import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt, Eye, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils/currency';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface BillPayment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
    phone: string;
  };
}

export const ProviderPaymentHistory = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<BillPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    if (!user?.id) return;

    try {
      // Récupérer les paiements marchands (paiements de factures) reçus par ce fournisseur
      const { data: merchantPayments, error: mpError } = await supabase
        .from('merchant_payments')
        .select(`
          id,
          amount,
          status,
          created_at,
          user_id
        `)
        .eq('merchant_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (mpError) {
        console.error('Erreur lors du chargement des paiements marchands:', mpError);
        return;
      }

      // Récupérer les profils des payeurs
      const payerIds = merchantPayments?.map(p => p.user_id) || [];
      let profilesData: any[] = [];
      
      if (payerIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', payerIds);

        if (!profilesError) {
          profilesData = profiles || [];
        }
      }

      // Combiner les données
      const combinedPayments: BillPayment[] = (merchantPayments || []).map(payment => {
        const profile = profilesData.find(p => p.id === payment.user_id);
        return {
          id: payment.id,
          amount: payment.amount, // déjà net côté table merchant_payments
          status: payment.status,
          created_at: payment.created_at,
          user_id: payment.user_id,
          profiles: profile ? {
            full_name: profile.full_name,
            phone: profile.phone
          } : undefined
        };
      });

      setPayments(combinedPayments);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();

    // Rafraîchir toutes les 5 secondes
    const interval = setInterval(fetchPayments, 5000);

    // Écouter les nouveaux transferts en temps réel
    const channel = supabase
      .channel('provider-payments')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transfers',
          filter: `recipient_id=eq.${user?.id}`
        },
        (payload) => {
          if (payload.new.status === 'completed') {
            fetchPayments();
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Payé</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Échec</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Paiements de factures reçus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Paiements de factures reçus
          <Badge variant="secondary" className="ml-auto">
            {payments.length} paiements
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun paiement reçu pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {payment.profiles?.full_name || 'Client inconnu'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({payment.profiles?.phone || 'N/A'})
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      {new Date(payment.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                 <div className="flex items-center gap-4">
                   <div className="text-right">
                     <div className="space-y-1">
                       <div className="font-bold text-lg text-green-600">
                         {formatCurrency(payment.amount * 0.985, "XAF")}
                       </div>
                       <div className="text-xs text-muted-foreground">
                         Net après commission
                       </div>
                     </div>
                     {getStatusBadge(payment.status)}
                   </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Détails du paiement</DialogTitle>
                        <DialogDescription>
                          Informations complètes sur ce paiement de facture
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                           <div>
                             <label className="text-sm font-medium">Montant reçu</label>
                             <div className="text-lg font-bold text-green-600">
                               {formatCurrency(payment.amount, "XAF")}
                             </div>
                           </div>
                           <div>
                             <label className="text-sm font-medium">Statut</label>
                             <div>{getStatusBadge(payment.status)}</div>
                           </div>
                         </div>
                         <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                           <div className="flex justify-between items-center mb-2">
                             <span className="text-sm font-medium text-orange-800">Commission SendFlow (1,5%)</span>
                             <span className="text-sm font-bold text-orange-600">
                               -{formatCurrency(payment.amount * 0.015, "XAF")}
                             </span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-sm font-medium text-green-800">Montant net reçu</span>
                             <span className="text-sm font-bold text-green-600">
                               {formatCurrency(payment.amount * 0.985, "XAF")}
                             </span>
                           </div>
                         </div>
                        <div>
                          <label className="text-sm font-medium">Client</label>
                          <div>{payment.profiles?.full_name || 'Client inconnu'}</div>
                          <div className="text-sm text-muted-foreground">
                            {payment.profiles?.phone || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Date et heure</label>
                          <div>
                            {new Date(payment.created_at).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};