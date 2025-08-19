
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
      console.log("🔍 Récupération des transactions pour:", user.id);
      setLoading(true);

      const allTransactions: Transaction[] = [];

      // 1. Récupérer les retraits
      console.log("📤 Récupération des retraits...");
      const { data: withdrawals, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (withdrawalError) {
        console.error("❌ Erreur retraits:", withdrawalError);
      } else if (withdrawals) {
        console.log("✅ Retraits trouvés:", withdrawals.length);
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

      // 2. Récupérer les transferts envoyés
      console.log("📤 Récupération des transferts envoyés...");
      const { data: sentTransfers, error: sentError } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (sentError) {
        console.error("❌ Erreur transferts envoyés:", sentError);
      } else if (sentTransfers) {
        console.log("✅ Transferts envoyés trouvés:", sentTransfers.length);
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

      // 3. Récupérer les transferts reçus
      console.log("📥 Récupération des transferts reçus...");
      const { data: receivedTransfers, error: receivedError } = await supabase
        .from('transfers')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (receivedError) {
        console.error("❌ Erreur transferts reçus:", receivedError);
      } else if (receivedTransfers) {
        console.log("✅ Transferts reçus trouvés:", receivedTransfers.length);
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

      // 4. Récupérer les dépôts/recharges
      console.log("🔋 Récupération des dépôts...");
      const { data: recharges, error: rechargeError } = await supabase
        .from('recharges')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (rechargeError) {
        console.error("❌ Erreur dépôts:", rechargeError);
      } else if (recharges) {
        console.log("✅ Dépôts trouvés:", recharges.length);
        recharges.forEach(recharge => {
          allTransactions.push({
            id: `deposit_${recharge.id}`,
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

      // 5. Récupérer les paiements de factures
      console.log("🧾 Récupération des paiements de factures...");
      const { data: billPayments, error: billError } = await supabase
        .from('bill_payment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (billError) {
        console.error("❌ Erreur paiements factures:", billError);
      } else if (billPayments) {
        console.log("✅ Paiements de factures trouvés:", billPayments.length);
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

      // Trier par date
      const sortedTransactions = allTransactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log("📊 Total transactions:", sortedTransactions.length);
      console.log("📋 Détail:", {
        retraits: sortedTransactions.filter(t => t.type === 'withdrawal').length,
        transferts_envoyés: sortedTransactions.filter(t => t.type === 'transfer_sent').length,
        transferts_reçus: sortedTransactions.filter(t => t.type === 'transfer_received').length,
        dépôts: sortedTransactions.filter(t => t.type === 'deposit').length,
        paiements_factures: sortedTransactions.filter(t => t.type === 'bill_payment').length
      });

      setTransactions(sortedTransactions);
    } catch (error) {
      console.error("❌ Erreur générale:", error);
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
              Entrées (Crédits)
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
              Sorties (Débits)
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
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-sm text-muted-foreground">
              Solde net: {(totalCredits - totalDebits).toLocaleString()} XAF
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Historique Complet des Transactions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Toutes vos entrées et sorties d'argent
          </p>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-muted-foreground mb-2">Aucune transaction trouvée</p>
              <p className="text-sm text-muted-foreground">
                Vos dépôts, retraits, transferts et paiements apparaîtront ici
              </p>
            </div>
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
                            {transaction.status === 'completed' ? 'Complété' : 
                             transaction.status === 'pending' ? 'En attente' : 
                             transaction.status}
                          </Badge>
                          <Badge variant={transaction.impact === 'credit' ? 'default' : 'destructive'}>
                            {transaction.impact === 'credit' ? 'Entrée' : 'Sortie'}
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
                      <div className={`font-semibold text-lg ${
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
