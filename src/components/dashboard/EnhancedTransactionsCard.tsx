
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, CreditCard, Zap, History, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  type: 'transfer_sent' | 'transfer_received' | 'withdrawal' | 'deposit' | 'bill_payment';
  amount: number;
  created_at: string;
  status: string;
  description?: string;
  recipient_full_name?: string;
  sender_full_name?: string;
  bill_type?: string;
  provider?: string;
}

const EnhancedTransactionsCard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Récupérer les transferts envoyés
      const { data: sentTransfers } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Récupérer les transferts reçus
      const { data: receivedTransfers } = await supabase
        .from('transfers')
        .select('*')
        .or(`recipient_phone.eq.${user.phone},recipient_email.eq.${user.email}`)
        .order('created_at', { ascending: false })
        .limit(10);

      // Récupérer les retraits
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Récupérer les dépôts
      const { data: deposits } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Récupérer les paiements de factures
      const { data: billPayments } = await supabase
        .from('bill_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Combiner toutes les transactions
      const allTransactions: Transaction[] = [];

      // Ajouter les transferts envoyés
      sentTransfers?.forEach(transfer => {
        allTransactions.push({
          id: transfer.id,
          type: 'transfer_sent',
          amount: -transfer.amount,
          created_at: transfer.created_at,
          status: transfer.status,
          description: `Transfert vers ${transfer.recipient_full_name || transfer.recipient_phone}`,
          recipient_full_name: transfer.recipient_full_name
        });
      });

      // Ajouter les transferts reçus
      receivedTransfers?.forEach(transfer => {
        allTransactions.push({
          id: transfer.id,
          type: 'transfer_received',
          amount: transfer.amount,
          created_at: transfer.created_at,
          status: transfer.status,
          description: `Transfert reçu de ${transfer.sender_full_name || 'Expéditeur'}`,
          sender_full_name: transfer.sender_full_name
        });
      });

      // Ajouter les retraits
      withdrawals?.forEach(withdrawal => {
        allTransactions.push({
          id: withdrawal.id,
          type: 'withdrawal',
          amount: -withdrawal.amount,
          created_at: withdrawal.created_at,
          status: withdrawal.status,
          description: `Retrait ${withdrawal.withdrawal_phone || ''}`
        });
      });

      // Ajouter les dépôts
      deposits?.forEach(deposit => {
        allTransactions.push({
          id: deposit.id,
          type: 'deposit',
          amount: deposit.amount,
          created_at: deposit.created_at,
          status: deposit.status || 'completed',
          description: `Dépôt sur le compte`
        });
      });

      // Ajouter les paiements de factures
      billPayments?.forEach(payment => {
        allTransactions.push({
          id: payment.id,
          type: 'bill_payment',
          amount: -payment.amount,
          created_at: payment.created_at,
          status: payment.status,
          description: `Facture ${payment.bill_type || payment.provider || 'Paiement'}`,
          bill_type: payment.bill_type,
          provider: payment.provider
        });
      });

      // Trier par date décroissante et prendre les 5 plus récentes
      allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(allTransactions.slice(0, 5));

    } catch (error) {
      console.error('Erreur lors de la récupération des transactions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les transactions récentes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user?.id]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'transfer_sent':
        return <ArrowUpRight className="w-6 h-6 text-red-500" />;
      case 'transfer_received':
        return <ArrowDownLeft className="w-6 h-6 text-green-500" />;
      case 'withdrawal':
        return <CreditCard className="w-6 h-6 text-orange-500" />;
      case 'deposit':
        return <ArrowDownLeft className="w-6 h-6 text-blue-500" />;
      case 'bill_payment':
        return <Zap className="w-6 h-6 text-purple-500" />;
      default:
        return <History className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'pending':
        return 'En cours';
      case 'failed':
        return 'Échoué';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5" />
            Transactions récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-4 p-4 rounded-lg border">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5" />
            Transactions récentes
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchTransactions}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Aucune transaction récente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate('/transactions')}
              >
                <div className="p-3 rounded-full bg-gray-100 flex-shrink-0">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-base truncate">
                    {transaction.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-500">
                      {format(new Date(transaction.created_at), 'dd/MM à HH:mm', { locale: fr })}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(transaction.status)}`}>
                      {getStatusText(transaction.status)}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-semibold text-base ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XAF',
                      maximumFractionDigits: 0
                    }).format(Math.abs(transaction.amount))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {transactions.length > 0 && (
          <div className="pt-4 border-t mt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/transactions')}
            >
              Voir toutes les transactions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedTransactionsCard;
