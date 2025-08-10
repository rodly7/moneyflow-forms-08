import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, ArrowRightLeft, Copy, Check, Zap, CreditCard } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import SimpleTransactionDetail from "@/components/transactions/SimpleTransactionDetail";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: Date;
  description: string;
  currency: string;
  status: string;
  verification_code?: string;
  created_at?: string;
  showCode?: boolean;
  userType?: 'agent' | 'user';
  recipient_full_name?: string;
  recipient_phone?: string;
  withdrawal_phone?: string;
  fees?: number;
  sender_id?: string;
}

const Transactions = () => {
  const navigate = useNavigate();
  const { user, isAgent } = useAuth();
  const { toast } = useToast();
  const [copiedCodes, setCopiedCodes] = useState<{[key: string]: boolean}>({});
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Récupérer toutes les transactions de l'utilisateur
  const { data: allTransactions, isLoading } = useQuery({
    queryKey: ['userTransactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log('🔄 Récupération de toutes les transactions pour:', user.id);

      const allTransactions: Transaction[] = [];

      try {
        // 1. Récupérer les retraits
        const { data: withdrawals, error: withdrawalsError } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (withdrawalsError) {
          console.error('❌ Erreur retraits:', withdrawalsError);
        } else if (withdrawals && withdrawals.length > 0) {
          console.log('💳 Retraits trouvés:', withdrawals.length);
          withdrawals.forEach(withdrawal => {
            allTransactions.push({
              id: withdrawal.id,
              type: 'withdrawal',
              amount: -Math.abs(withdrawal.amount),
              date: parseISO(withdrawal.created_at),
              description: `Retrait vers ${withdrawal.withdrawal_phone || 'Mobile Money'}`,
              currency: 'XAF',
              status: withdrawal.status,
              verification_code: withdrawal.verification_code,
              created_at: withdrawal.created_at,
              withdrawal_phone: withdrawal.withdrawal_phone,
              fees: 0, // Pas de frais pour les retraits
              userType: isAgent() ? 'agent' : 'user'
            });
          });
        }

        // 2. Récupérer les transferts envoyés
        const { data: sentTransfers, error: sentError } = await supabase
          .from('transfers')
          .select('*')
          .eq('sender_id', user.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (sentError) {
          console.error('❌ Erreur transferts envoyés:', sentError);
        } else if (sentTransfers && sentTransfers.length > 0) {
          console.log('📤 Transferts envoyés trouvés:', sentTransfers.length);
          sentTransfers.forEach(transfer => {
            allTransactions.push({
              id: transfer.id,
              type: 'transfer_sent',
              amount: -Math.abs(transfer.amount),
              date: parseISO(transfer.created_at),
              description: `Transfert à ${transfer.recipient_full_name || transfer.recipient_phone}`,
              currency: transfer.currency || 'XAF',
              status: transfer.status,
              recipient_full_name: transfer.recipient_full_name,
              recipient_phone: transfer.recipient_phone,
              fees: transfer.fees || 0,
              userType: isAgent() ? 'agent' : 'user'
            });
          });
        }

        // 3. Récupérer les transferts reçus
        const { data: receivedTransfers, error: receivedError } = await supabase
          .from('transfers')
          .select('*')
          .eq('recipient_id', user.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (receivedError) {
          console.error('❌ Erreur transferts reçus:', receivedError);
        } else if (receivedTransfers && receivedTransfers.length > 0) {
          console.log('📥 Transferts reçus trouvés:', receivedTransfers.length);
          
          for (const transfer of receivedTransfers) {
            let senderName = 'Expéditeur inconnu';
            
            // Récupérer le nom de l'expéditeur
            try {
              const { data: senderProfile } = await supabase
                .from('profiles')
                .select('full_name, phone')
                .eq('id', transfer.sender_id)
                .single();
              
              if (senderProfile) {
                senderName = senderProfile.full_name || senderProfile.phone || 'Expéditeur inconnu';
              }
            } catch (error) {
              console.error('❌ Erreur récupération expéditeur:', error);
            }
            
            allTransactions.push({
              id: transfer.id,
              type: 'transfer_received',
              amount: Math.abs(transfer.amount),
              date: parseISO(transfer.created_at),
              description: `Transfert reçu de ${senderName}`,
              currency: transfer.currency || 'XAF',
              status: transfer.status,
              fees: 0, // Pas de frais pour le destinataire
              userType: isAgent() ? 'agent' : 'user'
            });
          }
        }

        // 4. Récupérer les recharges/dépôts
        const { data: recharges, error: rechargesError } = await supabase
          .from('recharges')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (rechargesError) {
          console.error('❌ Erreur recharges:', rechargesError);
        } else if (recharges && recharges.length > 0) {
          console.log('💰 Recharges trouvées:', recharges.length);
          recharges.forEach(recharge => {
            allTransactions.push({
              id: recharge.id,
              type: 'recharge',
              amount: Math.abs(recharge.amount),
              date: parseISO(recharge.created_at),
              description: `Dépôt via ${recharge.payment_method || 'Mobile Money'}`,
              currency: 'XAF',
              status: recharge.status,
              fees: 0, // Pas de frais sur les dépôts
              userType: isAgent() ? 'agent' : 'user'
            });
          });
        }

        // 5. Récupérer les paiements de factures automatiques
        const { data: billPayments, error: billError } = await supabase
          .from('automatic_bills')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'paid')
          .order('updated_at', { ascending: false });

        if (billError) {
          console.error('❌ Erreur paiements factures:', billError);
        } else if (billPayments && billPayments.length > 0) {
          console.log('⚡ Paiements de factures trouvés:', billPayments.length);
          billPayments.forEach(bill => {
            // Calculer les frais pour les factures (1,5%)
            const billFees = bill.amount * 0.015;
            
            allTransactions.push({
              id: bill.id,
              type: 'bill_payment',
              amount: -Math.abs(bill.amount),
              date: parseISO(bill.updated_at || bill.created_at),
              description: `Paiement ${bill.bill_name || 'Facture'}`,
              currency: 'XAF',
              status: 'completed',
              fees: billFees,
              userType: isAgent() ? 'agent' : 'user'
            });
          });
        }

        // Trier toutes les transactions par date décroissante
        allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
        
        console.log('📊 Total transactions récupérées:', allTransactions.length);
        return allTransactions;

      } catch (error) {
        console.error('❌ Erreur générale lors de la récupération des transactions:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les transactions",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!user,
  });

  const { data: withdrawals } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: sentTransfers } = useQuery({
    queryKey: ['sentTransfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: receivedTransfers } = useQuery({
    queryKey: ['receivedTransfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('recipient_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  
  const [processedWithdrawals, setProcessedWithdrawals] = useState<any[]>([]);

  useEffect(() => {
    if (withdrawals) {
      // Process withdrawals to determine which codes should be visible based on creation time
      const processed = withdrawals.map(withdrawal => {
        const createdAt = new Date(withdrawal.created_at);
        const now = new Date();
        const timeDiffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
        const showCode = timeDiffMinutes <= 5 && withdrawal.verification_code && withdrawal.status === 'pending';
        
        return {
          ...withdrawal,
          showCode,
          userType: isAgent() ? 'agent' : 'user'
        };
      });
      
      setProcessedWithdrawals(processed);
    }
    
    // Set up a timer to update the visibility every minute
    const timer = setInterval(() => {
      setProcessedWithdrawals(current => 
        current.map(withdrawal => {
          const createdAt = new Date(withdrawal.created_at);
          const now = new Date();
          const timeDiffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
          const showCode = timeDiffMinutes <= 5 && withdrawal.verification_code && withdrawal.status === 'pending';
          
          return {
            ...withdrawal,
            showCode
          };
        })
      );
    }, 60000); // Check every minute
    
    return () => clearInterval(timer);
  }, [withdrawals, isAgent]);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodes({...copiedCodes, [id]: true});
    
    toast({
      title: "Code copié",
      description: "Le code de vérification a été copié dans le presse-papiers"
    });
    
    // Reset copy indicator after 2 seconds
    setTimeout(() => {
      setCopiedCodes(current => ({...current, [id]: false}));
    }, 2000);
  };

  const openTransactionDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const closeTransactionDetail = () => {
    setSelectedTransaction(null);
    setIsModalOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'withdrawal':
        return <Download className="h-4 w-4 text-red-500" />;
      case 'transfer_sent':
        return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
      case 'transfer_received':
        return <ArrowRightLeft className="h-4 w-4 text-green-500" />;
      case 'recharge':
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'bill_payment':
        return <Zap className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const renderTransaction = (transaction: Transaction) => (
    <div 
      key={transaction.id} 
      className="p-5 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-300 cursor-pointer"
      onClick={() => openTransactionDetail(transaction)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              transaction.type === 'withdrawal' 
                ? 'bg-gradient-to-r from-red-100 to-pink-100' 
                : transaction.type === 'transfer_received' || transaction.type === 'recharge'
                ? 'bg-gradient-to-r from-green-100 to-emerald-100'
                : transaction.type === 'bill_payment'
                ? 'bg-gradient-to-r from-purple-100 to-violet-100'
                : 'bg-gradient-to-r from-blue-100 to-purple-100'
            }`}>
              {getIcon(transaction.type)}
            </div>
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${
              transaction.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
            } flex items-center justify-center`}>
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{transaction.description}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{format(transaction.date, 'dd MMM', { locale: fr })}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                transaction.status === 'completed' ? 'bg-green-100 text-green-700' : 
                transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                'bg-gray-100 text-gray-600'
              }`}>
                {transaction.status === 'completed' ? 'Terminé' : 
                 transaction.status === 'pending' ? 'En cours' : transaction.status}
              </span>
              {transaction.fees && transaction.fees > 0 && (
                <>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="text-xs text-red-600">
                    Frais: {transaction.fees.toLocaleString()} FCFA
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${
            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: transaction.currency || 'XAF',
              maximumFractionDigits: 0
            }).format(transaction.amount)}
          </p>
        </div>
      </div>
      
      {transaction.showCode && transaction.verification_code && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-blue-500 rounded-full">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <p className="text-xs font-semibold text-blue-700">Code de vérification:</p>
              </div>
              <p className="font-mono font-bold text-lg text-blue-900 tracking-wider">
                {transaction.verification_code}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(transaction.verification_code!, transaction.id)}
              className="ml-3 hover:scale-110 transition-transform"
            >
              {copiedCodes[transaction.id] ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 p-1 rounded-2xl shadow-xl">
            <div className="bg-white rounded-2xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 p-1 rounded-2xl shadow-xl">
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/')} 
                  className="h-10 w-10 p-0 hover:scale-110 transition-transform"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full">
                    <ArrowRightLeft className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                      Historique complet
                    </h1>
                    <p className="text-sm text-muted-foreground">Toutes vos transactions</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  {allTransactions?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground">opérations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
          <Card className="relative bg-white border-0 shadow-2xl">
            <CardContent className="p-0">
              {allTransactions && allTransactions.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {allTransactions.map(renderTransaction)}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="relative">
                    <div className="p-6 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-full w-24 h-24 mx-auto mb-4">
                      <ArrowRightLeft className="w-12 h-12 text-emerald-600 mx-auto" />
                    </div>
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-gradient-to-r from-emerald-300 to-blue-300 rounded-full animate-ping opacity-20"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune transaction</h3>
                  <p className="text-sm text-gray-500">Vos opérations apparaîtront ici avec les frais détaillés</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transaction Detail Modal */}
        <SimpleTransactionDetail 
          transaction={selectedTransaction}
          isVisible={isModalOpen}
          onClose={closeTransactionDetail}
        />
      </div>
    </div>
  );
};

export default Transactions;
