import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Copy, Check, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TransactionItem from "./TransactionItem";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import SimpleTransactionDetail from "@/components/transactions/SimpleTransactionDetail";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: Date;
  description: string;
  currency: string;
  status: string;
  userType?: 'agent' | 'user';
}

interface Withdrawal {
  id: string;
  amount: number;
  created_at: string;
  withdrawal_phone: string;
  status: string;
  verification_code?: string;
  showCode?: boolean;
  userType?: 'agent' | 'user';
}

interface TransactionsCardProps {
  transactions: Transaction[];
  withdrawals?: Withdrawal[];
  receivedTransfers?: any[];
  onDeleteTransaction: (id: string, type: string) => void;
  isLoading?: boolean;
}

const TransactionsCard = ({ 
  transactions, 
  withdrawals = [],
  receivedTransfers = [],
  onDeleteTransaction,
  isLoading = false
}: TransactionsCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAgent } = useAuth();
  const [processedWithdrawals, setProcessedWithdrawals] = useState<Withdrawal[]>([]);
  const [copiedCodes, setCopiedCodes] = useState<{[key: string]: boolean}>({});
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Process withdrawals to determine which codes should be visible based on creation time
    const processed = withdrawals.map(withdrawal => {
      const createdAt = new Date(withdrawal.created_at);
      const now = new Date();
      const timeDiffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      const showCode = timeDiffMinutes <= 5 && withdrawal.verification_code && withdrawal.status === 'pending';
      
      return {
        ...withdrawal,
        showCode,
        userType: (isAgent() ? 'agent' : 'user') as 'agent' | 'user'
      };
    });
    
    setProcessedWithdrawals(processed);
    
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

  const openTransactionDetail = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const closeTransactionDetail = () => {
    setSelectedTransaction(null);
    setIsModalOpen(false);
  };
  // Add userType to transactions
  const transactionsWithUserType = transactions.map(transaction => ({
    ...transaction,
    userType: (isAgent() ? 'agent' : 'user') as 'agent' | 'user'
  }));

  // Combine all transactions, withdrawals and received transfers for the history view
  const allOperations = [
    ...transactionsWithUserType,
    ...processedWithdrawals.map(withdrawal => ({
      id: withdrawal.id,
      type: 'withdrawal' as const,
      amount: -withdrawal.amount,
      date: new Date(withdrawal.created_at),
      description: `Retrait vers ${withdrawal.withdrawal_phone}`,
      currency: 'XAF',
      status: withdrawal.status,
      userType: withdrawal.userType,
      withdrawal_phone: withdrawal.withdrawal_phone,
      verification_code: withdrawal.verification_code,
      created_at: withdrawal.created_at,
      showCode: withdrawal.showCode
    })),
    ...receivedTransfers.map(transfer => ({
      id: transfer.id,
      type: 'transfer_received' as const,
      amount: transfer.amount,
      date: new Date(transfer.created_at),
      description: `Reçu de ${transfer.recipient_full_name || 'un expéditeur'}`,
      currency: 'XAF',
      status: transfer.status,
      userType: (isAgent() ? 'agent' : 'user') as 'agent' | 'user'
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Show only 3 most recent transactions
  const recentOperations = allOperations.slice(0, 3);

  if (isLoading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 rounded-2xl overflow-hidden mx-2 sm:mx-4">
        <CardHeader className="py-6 px-6 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-full">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-800">Historique des transactions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-12 px-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Chargement des transactions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 rounded-2xl overflow-hidden mx-2 sm:mx-4">
      <CardHeader className="py-6 px-6 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-full">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-800">Historique des transactions</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {recentOperations.length > 0 ? (
            <>
              {recentOperations.map((operation) => {
                if (operation.type === 'withdrawal') {
                  const withdrawal = processedWithdrawals.find(w => w.id === operation.id);
                  return (
                     <div 
                       key={operation.id} 
                       className="flex flex-col p-4 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-all duration-300 w-full shadow-sm hover:shadow-md cursor-pointer"
                       onClick={() => openTransactionDetail(operation)}
                     >
                      <div className="flex justify-between items-start w-full">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="p-3 rounded-xl bg-gradient-to-r from-red-100 to-pink-100 shrink-0">
                            <Download className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-gray-900 truncate">{operation.description}</p>
                              {operation.userType && (
                                <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${
                                  operation.userType === 'agent' 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {operation.userType === 'agent' ? 'Agent' : 'Utilisateur'}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1 font-medium">
                              {format(operation.date, 'PPP', { locale: fr })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="font-bold text-red-600 whitespace-nowrap text-lg">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: operation.currency || 'XAF',
                              maximumFractionDigits: 0
                            }).format(operation.amount)}
                          </p>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap inline-block mt-2 ${
                            operation.status === 'completed' ? 'bg-green-100 text-green-700' : 
                            operation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {operation.status === 'completed' ? 'Complété' : 
                             operation.status === 'pending' ? 'En attente' : operation.status}
                          </span>
                        </div>
                      </div>
                      
                      {withdrawal?.showCode && withdrawal.verification_code && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 w-full">
                          <div className="flex justify-between items-center">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-blue-700 mb-2 font-medium">Code de vérification (valide 5 min):</p>
                              <p className="font-mono font-bold tracking-widest text-lg text-blue-900 break-all">{withdrawal.verification_code}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(withdrawal.verification_code!, withdrawal.id)}
                              className="h-10 w-10 p-0 shrink-0 ml-3 rounded-full hover:bg-blue-100"
                            >
                              {copiedCodes[withdrawal.id] ? (
                                <Check className="h-5 w-5 text-green-600" />
                              ) : (
                                <Copy className="h-5 w-5 text-blue-600" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  if (operation.type === 'transfer_received') {
                    return (
                      <div 
                        key={operation.id} 
                        className="flex flex-col p-4 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-all duration-300 w-full shadow-sm hover:shadow-md cursor-pointer"
                        onClick={() => openTransactionDetail(operation)}
                      >
                        <div className="flex justify-between items-start w-full">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="p-3 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 shrink-0">
                              <Download className="w-5 h-5 text-green-600 rotate-180" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-gray-900 truncate">{operation.description}</p>
                                {operation.userType && (
                                  <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${
                                    operation.userType === 'agent' 
                                      ? 'bg-purple-100 text-purple-700' 
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {operation.userType === 'agent' ? 'Agent' : 'Utilisateur'}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1 font-medium">
                                {format(operation.date, 'PPP', { locale: fr })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className="font-bold text-green-600 whitespace-nowrap text-lg">
                              +{new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: operation.currency || 'XAF',
                                maximumFractionDigits: 0
                              }).format(operation.amount)}
                            </p>
                            <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap inline-block mt-2 ${
                              operation.status === 'completed' ? 'bg-green-100 text-green-700' : 
                              operation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {operation.status === 'completed' ? 'Complété' : 
                               operation.status === 'pending' ? 'En attente' : operation.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <TransactionItem 
                        key={operation.id} 
                        transaction={operation} 
                        onDelete={onDeleteTransaction}
                      />
                    );
                  }
                }
              })}
              
              {allOperations.length > 3 && (
                <div className="text-center pt-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-semibold rounded-full px-6 py-2 transition-all duration-300"
                    onClick={() => navigate('/transactions')}
                  >
                    Voir toutes les transactions <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Activity className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium text-lg mb-2">Aucune transaction</p>
              <p className="text-gray-500 text-sm">Vos transactions apparaîtront ici</p>
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Détails simples de transaction */}
      <SimpleTransactionDetail 
        transaction={selectedTransaction}
        isVisible={isModalOpen}
        onClose={closeTransactionDetail}
      />
    </Card>
  );
};

export default TransactionsCard;
