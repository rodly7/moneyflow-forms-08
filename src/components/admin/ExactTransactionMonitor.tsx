
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  user_id?: string;
}

const ExactTransactionMonitor = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["exact-transactions", refreshKey, searchTerm],
    queryFn: async () => {
      // Get data from pending_transfers table as our main transaction source
      const { data: pendingTransfers, error } = await supabase
        .from('pending_transfers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error("Erreur lors de la récupération des transactions:", error);
        return [];
      }

      // Transform to match Transaction interface
      const transformedTransactions: Transaction[] = pendingTransfers?.map(transfer => ({
        id: transfer.id,
        type: 'transfer',
        amount: transfer.amount,
        status: transfer.status,
        created_at: transfer.created_at,
        user_id: transfer.sender_id
      })) || [];

      // Filter by search term if provided
      if (searchTerm) {
        return transformedTransactions.filter(transaction =>
          transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return transformedTransactions;
    },
  });

  const refreshTransactions = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Moniteur de Transactions Exactes
            <Button variant="outline" size="sm" onClick={refreshTransactions}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par ID transaction ou utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                        <span className="font-mono text-sm">{transaction.id}</span>
                        <span className="text-sm text-muted-foreground">
                          Type: {transaction.type}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Utilisateur: {transaction.user_id || 'N/A'} • 
                        Date: {new Date(transaction.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(transaction.amount)}
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Aucune transaction trouvée pour cette recherche' : 'Aucune transaction disponible'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExactTransactionMonitor;
