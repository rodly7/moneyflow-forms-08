
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowDownLeft, ArrowUpRight, CreditCard, Receipt, Minus, Plus } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: Date;
  description: string;
  currency: string;
  status: string;
  verification_code?: string;
  created_at: string;
  withdrawal_phone?: string;
  fees?: number;
  userType: "agent" | "user";
  impact: "credit" | "debit";
}

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      console.log("🔍 Début de récupération des transactions pour l'utilisateur:", user.id);

      const allTransactions: Transaction[] = [];

      // 1. Récupérer TOUS les retraits
      console.log("📤 Récupération des retraits...");
      const { data: withdrawals, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (withdrawalError) {
        console.error("❌ Erreur lors de la récupération des retraits:", withdrawalError);
      } else {
        console.log("✅ Retraits récupérés:", withdrawals?.length || 0);
        
        if (withdrawals) {
          withdrawals.forEach(withdrawal => {
            allTransactions.push({
              id: withdrawal.id,
              type: 'withdrawal',
              amount: withdrawal.amount,
              date: new Date(withdrawal.created_at),
              description: `Retrait vers ${withdrawal.withdrawal_phone || 'N/A'}`,
              currency: 'XAF',
              status: withdrawal.status || 'pending',
              verification_code: withdrawal.verification_code || '',
              created_at: withdrawal.created_at,
              withdrawal_phone: withdrawal.withdrawal_phone || '',
              fees: 0,
              userType: "user" as const,
              impact: "debit" as const
            });
          });
        }
      }

      // 2. Récupérer les transferts envoyés
      console.log("📤 Récupération des transferts envoyés...");
      const { data: sentTransfers, error: sentError } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (sentError) {
        console.error("❌ Erreur transferts envoyés:", sentError);
      } else {
        console.log("✅ Transferts envoyés:", sentTransfers?.length || 0);
        
        if (sentTransfers) {
          sentTransfers.forEach(transfer => {
            allTransactions.push({
              id: transfer.id,
              type: 'transfer_sent',
              amount: transfer.amount,
              date: new Date(transfer.created_at),
              description: `Transfert vers ${transfer.recipient_phone}`,
              currency: 'XAF',
              status: transfer.status,
              created_at: transfer.created_at,
              userType: "user" as const,
              impact: "debit" as const,
              fees: transfer.fees || 0
            });
          });
        }
      }

      // 3. Récupérer les transferts reçus
      console.log("📥 Récupération des transferts reçus...");
      const { data: receivedTransfers, error: receivedError } = await supabase
        .from('transfers')
        .select('*')
        .eq('recipient_phone', user.phone)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (receivedError) {
        console.error("❌ Erreur transferts reçus:", receivedError);
      } else {
        console.log("✅ Transferts reçus:", receivedTransfers?.length || 0);
        
        if (receivedTransfers) {
          receivedTransfers.forEach(transfer => {
            allTransactions.push({
              id: `received_${transfer.id}`,
              type: 'transfer_received',
              amount: transfer.amount,
              date: new Date(transfer.created_at),
              description: `Transfert reçu de ${transfer.recipient_full_name || 'Expéditeur'}`,
              currency: 'XAF',
              status: transfer.status,
              created_at: transfer.created_at,
              userType: "user" as const,
              impact: "credit" as const
            });
          });
        }
      }

      // 4. Récupérer les recharges/dépôts
      console.log("🔋 Récupération des recharges...");
      const { data: recharges, error: rechargeError } = await supabase
        .from('recharges')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (rechargeError) {
        console.error("❌ Erreur recharges:", rechargeError);
      } else {
        console.log("✅ Recharges:", recharges?.length || 0);
        
        if (recharges) {
          recharges.forEach(recharge => {
            allTransactions.push({
              id: `recharge_${recharge.id}`,
              type: 'deposit',
              amount: recharge.amount,
              date: new Date(recharge.created_at),
              description: 'Dépôt de compte',
              currency: 'XAF',
              status: recharge.status,
              created_at: recharge.created_at,
              userType: "user" as const,
              impact: "credit" as const
            });
          });
        }
      }

      // 5. Récupérer les paiements de factures
      console.log("🧾 Récupération des paiements de factures...");
      const { data: billPayments, error: billError } = await supabase
        .from('bill_payment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (billError) {
        console.error("❌ Erreur paiements factures:", billError);
      } else {
        console.log("✅ Paiements de factures:", billPayments?.length || 0);
        
        if (billPayments) {
          billPayments.forEach(payment => {
            allTransactions.push({
              id: `bill_${payment.id}`,
              type: 'bill_payment',
              amount: payment.amount,
              date: new Date(payment.created_at),
              description: 'Paiement de facture',
              currency: 'XAF',
              status: payment.status,
              created_at: payment.created_at,
              userType: "user" as const,
              impact: "debit" as const
            });
          });
        }
      }

      // Trier toutes les transactions par date (plus récente en premier)
      const sortedTransactions = allTransactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log("📊 Total transactions récupérées:", sortedTransactions.length);
      console.log("📋 Détail par type:", {
        retraits: sortedTransactions.filter(t => t.type === 'withdrawal').length,
        transferts_envoyés: sortedTransactions.filter(t => t.type === 'transfer_sent').length,
        transferts_reçus: sortedTransactions.filter(t => t.type === 'transfer_received').length,
        dépôts: sortedTransactions.filter(t => t.type === 'deposit').length,
        paiements_factures: sortedTransactions.filter(t => t.type === 'bill_payment').length
      });

      setTransactions(sortedTransactions);
    } catch (error) {
      console.error("❌ Erreur générale lors de la récupération des transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'withdrawal':
        return <ArrowUpRight className="w-5 h-5 text-red-600" />;
      case 'transfer_sent':
        return <ArrowUpRight className="w-5 h-5 text-orange-600" />;
      case 'transfer_received':
        return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
      case 'deposit':
        return <Plus className="w-5 h-5 text-blue-600" />;
      case 'bill_payment':
        return <Receipt className="w-5 h-5 text-purple-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Calculer les totaux
  const creditTransactions = transactions.filter(t => t.impact === 'credit');
  const debitTransactions = transactions.filter(t => t.impact === 'debit');
  
  const totalCredits = creditTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalDebits = debitTransactions.reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Chargement des transactions...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Résumé financier */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Plus className="w-5 h-5" />
              Crédits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalCredits.toLocaleString()} XAF</div>
            <p className="text-sm text-muted-foreground">{creditTransactions.length} opérations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Minus className="w-5 h-5" />
              Débits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalDebits.toLocaleString()} XAF</div>
            <p className="text-sm text-muted-foreground">{debitTransactions.length} opérations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length} transactions</div>
            <p className="text-sm text-muted-foreground">
              Solde: {(totalCredits - totalDebits).toLocaleString()} XAF
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune transaction trouvée.
            </p>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction, index) => (
                <div key={transaction.id}>
                  <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-muted">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{transaction.description}</h3>
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                          <Badge variant={transaction.impact === 'credit' ? 'default' : 'destructive'}>
                            {transaction.impact === 'credit' ? 'Crédit' : 'Débit'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.date)}
                        </p>
                        
                        {transaction.verification_code && (
                          <p className="text-xs text-muted-foreground">
                            Code: {transaction.verification_code}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`font-semibold ${
                        transaction.impact === 'credit' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {transaction.impact === 'credit' ? '+' : '-'}
                        {transaction.amount.toLocaleString()} {transaction.currency}
                      </div>
                      
                      {transaction.fees && transaction.fees > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Frais: {transaction.fees.toLocaleString()} XAF
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {index < transactions.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
