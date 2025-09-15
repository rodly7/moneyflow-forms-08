import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt, Eye, User, Clock, CheckCircle, XCircle, Download } from 'lucide-react';
import jsPDF from 'jspdf';
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
  bill_type?: string;
  account_number?: string;
  company?: string;
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

      console.log('📥 Paiements marchands chargés:', {
        merchantId: user.id,
        count: merchantPayments?.length || 0,
        error: mpError?.message,
      });

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
          bill_type: 'Facture', // Valeur par défaut
          account_number: 'N/A', // Valeur par défaut
          company: 'Divers', // Valeur par défaut
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
    if (!user?.id) return;

    fetchPayments();

    // Rafraîchir toutes les 5 secondes
    const interval = setInterval(fetchPayments, 5000);

    // Écouter les paiements marchands en temps réel (INSERT/UPDATE)
    const channel = supabase
      .channel(`provider-payments-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'merchant_payments',
          filter: `merchant_id=eq.${user.id}`,
        },
        (payload) => {
          const eventType = (payload as any).eventType;
          const newRow: any = (payload as any).new || {};
          const oldRow: any = (payload as any).old || {};
          const isForThisMerchant = newRow?.merchant_id === user.id || oldRow?.merchant_id === user.id;

          if (!isForThisMerchant) return;

          console.log('🔔 Changement paiement marchand détecté:', eventType, payload);

          if (eventType === 'INSERT' && newRow) {
            // Mise à jour optimiste immédiate
            setPayments((prev) => {
              if (prev.some((p) => p.id === newRow.id)) return prev; // déjà présent
              const optimistic: BillPayment = {
                id: newRow.id,
                amount: Number(newRow.amount) || 0,
                status: newRow.status,
                created_at: newRow.created_at,
                user_id: newRow.user_id,
                bill_type: 'Facture',
                account_number: 'N/A',
                company: newRow.business_name || 'Divers',
                profiles: undefined,
              };
              return [optimistic, ...prev].slice(0, 50);
            });

            // Charger le profil du payeur pour enrichir la ligne
            supabase
              .from('profiles')
              .select('full_name, phone')
              .eq('id', newRow.user_id)
              .maybeSingle()
              .then(({ data, error }) => {
                if (data) {
                  setPayments((prev) => prev.map((p) => (p.id === newRow.id ? { ...p, profiles: { full_name: data.full_name, phone: data.phone } } : p)));
                }
              });
          } else if (eventType === 'UPDATE' && newRow) {
            // Synchroniser statut/montant
            setPayments((prev) =>
              prev.map((p) => (p.id === newRow.id ? { ...p, amount: Number(newRow.amount) || p.amount, status: newRow.status } : p))
            );
          }

          // Sécurité: lancer un fetch pour aligner l'état si besoin
          fetchPayments();
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut realtime paiements fournisseur:', status);
      });

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
      console.log('🧹 Nettoyage canal paiements fournisseur');
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

  const downloadPaymentPDF = (payment: BillPayment) => {
    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(20);
    doc.text('Reçu de Paiement de Facture', 20, 30);
    
    // Ligne de séparation
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Informations du paiement
    doc.setFontSize(12);
    doc.text('DÉTAILS DU PAIEMENT', 20, 50);
    
    doc.setFontSize(10);
    doc.text(`ID de transaction: ${payment.id}`, 20, 65);
    doc.text(`Date: ${new Date(payment.created_at).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 20, 75);
    
    doc.text(`Montant reçu: ${formatCurrency(payment.amount, "XAF")}`, 20, 85);
    doc.text(`Statut: ${payment.status === 'completed' ? 'Payé' : payment.status}`, 20, 95);
    
    // Informations du client
    doc.setFontSize(12);
    doc.text('INFORMATIONS DU CLIENT', 20, 115);
    
    doc.setFontSize(10);
    doc.text(`Nom: ${payment.profiles?.full_name || 'Client inconnu'}`, 20, 130);
    doc.text(`Téléphone: ${payment.profiles?.phone || 'N/A'}`, 20, 140);
    
    // Informations de la facture
    if (payment.bill_type || payment.company || payment.account_number) {
      doc.setFontSize(12);
      doc.text('DÉTAILS DE LA FACTURE', 20, 160);
      
      doc.setFontSize(10);
      if (payment.bill_type) doc.text(`Type: ${payment.bill_type}`, 20, 175);
      if (payment.company) doc.text(`Compagnie: ${payment.company}`, 20, 185);
      if (payment.account_number) doc.text(`Numéro de compte: ${payment.account_number}`, 20, 195);
    }
    
    // Note
    doc.setFontSize(8);
    doc.text('Note: Ce montant est net après déduction de la commission SendFlow (1,5%)', 20, 250);
    
    // Télécharger
    doc.save(`recu-paiement-${payment.id.slice(0, 8)}.pdf`);
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
                         {formatCurrency(payment.amount, "XAF")}
                       </div>
                       <div className="text-xs text-muted-foreground">
                         Montant net reçu
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
                             <label className="text-sm font-medium">Montant net reçu</label>
                             <div className="text-lg font-bold text-green-600">
                               {formatCurrency(payment.amount, "XAF")}
                             </div>
                           </div>
                           <div>
                             <label className="text-sm font-medium">Statut</label>
                             <div>{getStatusBadge(payment.status)}</div>
                           </div>
                         </div>
                         <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                           <div className="text-sm text-blue-800">
                             <strong>Note:</strong> Ce montant est déjà net après déduction de la commission SendFlow (1,5%).
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
                         
                         {/* Détails de la facture */}
                         {(payment.bill_type || payment.company || payment.account_number) && (
                           <div className="border-t pt-4">
                             <label className="text-sm font-medium">Détails de la facture</label>
                             <div className="space-y-1 mt-2">
                               {payment.bill_type && (
                                 <div className="text-sm">
                                   <span className="text-muted-foreground">Type: </span>
                                   {payment.bill_type}
                                 </div>
                               )}
                               {payment.company && (
                                 <div className="text-sm">
                                   <span className="text-muted-foreground">Compagnie: </span>
                                   {payment.company}
                                 </div>
                               )}
                               {payment.account_number && (
                                 <div className="text-sm">
                                   <span className="text-muted-foreground">Numéro de compte: </span>
                                   {payment.account_number}
                                 </div>
                               )}
                             </div>
                           </div>
                         )}
                         
                         <div className="border-t pt-4">
                           <Button 
                             onClick={() => downloadPaymentPDF(payment)}
                             variant="outline" 
                             className="w-full"
                           >
                             <Download className="h-4 w-4 mr-2" />
                             Télécharger le reçu PDF
                           </Button>
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