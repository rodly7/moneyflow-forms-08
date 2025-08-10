import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, CreditCard, History, RefreshCw, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  type: 'transfer_sent' | 'transfer_received' | 'withdrawal' | 'recharge' | 'bill_payment';
  amount: number;
  created_at: string;
  status: string;
  description?: string;
  recipient_full_name?: string;
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
      console.log('🔄 Récupération des transactions pour l\'utilisateur:', user.id);

      // Récupérer les transferts envoyés
      const { data: sentTransfers, error: sentError } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (sentError) {
        console.error('Erreur transferts envoyés:', sentError);
      } else {
        console.log('📤 Transferts envoyés récupérés:', sentTransfers?.length || 0);
      }

      // Récupérer les transferts reçus
      const { data: receivedTransfers, error: receivedError } = await supabase
        .from('transfers')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (receivedError) {
        console.error('Erreur transferts reçus:', receivedError);
      } else {
        console.log('📥 Transferts reçus récupérés:', receivedTransfers?.length || 0);
      }

      // Récupérer les retraits
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (withdrawalsError) {
        console.error('Erreur retraits:', withdrawalsError);
      } else {
        console.log('💳 Retraits récupérés:', withdrawals?.length || 0);
      }

      // Récupérer les recharges/dépôts
      const { data: recharges, error: rechargesError } = await supabase
        .from('recharges')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (rechargesError) {
        console.error('Erreur recharges:', rechargesError);
      } else {
        console.log('💰 Recharges/Dépôts récupérés:', recharges?.length || 0);
      }

      // Récupérer les paiements de factures automatiques
      const { data: billPayments, error: billError } = await supabase
        .from('automatic_bills')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['paid', 'completed'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (billError) {
        console.error('Erreur paiements factures:', billError);
      } else {
        console.log('⚡ Paiements de factures récupérés:', billPayments?.length || 0);
      }

      // Combiner toutes les transactions
      const allTransactions: Transaction[] = [];

      // Ajouter les transferts envoyés
      if (sentTransfers && sentTransfers.length > 0) {
        sentTransfers.forEach(transfer => {
          allTransactions.push({
            id: transfer.id,
            type: 'transfer_sent',
            amount: -Math.abs(transfer.amount),
            created_at: transfer.created_at,
            status: transfer.status || 'completed',
            description: `Transfert vers ${transfer.recipient_full_name || transfer.recipient_phone}`,
            recipient_full_name: transfer.recipient_full_name
          });
        });
        console.log('📤 Transferts envoyés ajoutés:', sentTransfers.length);
      }

      // Ajouter les transferts reçus
      if (receivedTransfers && receivedTransfers.length > 0) {
        receivedTransfers.forEach(transfer => {
          allTransactions.push({
            id: transfer.id,
            type: 'transfer_received',
            amount: Math.abs(transfer.amount),
            created_at: transfer.created_at,
            status: transfer.status || 'completed',
            description: `Transfert reçu de ${transfer.recipient_full_name || 'Expéditeur'}`
          });
        });
        console.log('📥 Transferts reçus ajoutés:', receivedTransfers.length);
      }

      // Ajouter les retraits
      if (withdrawals && withdrawals.length > 0) {
        withdrawals.forEach(withdrawal => {
          allTransactions.push({
            id: withdrawal.id,
            type: 'withdrawal',
            amount: -Math.abs(withdrawal.amount),
            created_at: withdrawal.created_at,
            status: withdrawal.status || 'completed',
            description: `Retrait ${withdrawal.withdrawal_phone || ''}`
          });
        });
        console.log('💳 Retraits ajoutés:', withdrawals.length);
      }

      // Ajouter les recharges/dépôts
      if (recharges && recharges.length > 0) {
        recharges.forEach(recharge => {
          allTransactions.push({
            id: recharge.id,
            type: 'recharge',
            amount: Math.abs(recharge.amount),
            created_at: recharge.created_at,
            status: recharge.status || 'completed',
            description: `Dépôt via ${recharge.payment_method || 'Mobile Money'}`
          });
        });
        console.log('💰 Recharges ajoutées:', recharges.length);
      }

      // Ajouter les paiements de factures
      if (billPayments && billPayments.length > 0) {
        billPayments.forEach(bill => {
          allTransactions.push({
            id: bill.id,
            type: 'bill_payment',
            amount: -Math.abs(bill.amount),
            created_at: bill.created_at,
            status: 'completed',
            description: `Paiement ${bill.bill_name || 'Facture'}`
          });
        });
        console.log('⚡ Paiements de factures ajoutés:', billPayments.length);
      }

      // Trier par date décroissante et prendre les 5 plus récentes
      allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      console.log('📊 Total transactions combinées:', allTransactions.length);
      
      const recentTransactions = allTransactions.slice(0, 5);
      console.log('📋 Transactions récentes à afficher:', recentTransactions.length);
      
      setTransactions(recentTransactions);

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
      case 'recharge':
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
          <CardTitle className="text-xl flex items-center gap-2">
            <History className="w-6 h-6" />
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
          <CardTitle className="text-xl flex items-center gap-2">
            <History className="w-6 h-6" />
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
            <p className="text-base">Aucune transaction récente</p>
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
                  <p className="font-medium text-gray-900 text-lg truncate">
                    {transaction.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-base text-gray-500">
                      {format(new Date(transaction.created_at), 'dd/MM à HH:mm', { locale: fr })}
                    </p>
                    <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor(transaction.status)}`}>
                      {getStatusText(transaction.status)}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-semibold text-lg ${
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
              className="w-full text-lg py-3"
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
