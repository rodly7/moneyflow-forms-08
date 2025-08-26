
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw } from "lucide-react";
import { AgentTransactionItem } from "./AgentTransactionItem";
import { useAgentTransactions } from "@/hooks/useAgentTransactions";

const AgentTransactionHistory = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { transactions, isLoading, refetch } = useAgentTransactions(user?.id, selectedDate);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Historique des Transactions
        </CardTitle>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {transactions.length} transaction{transactions.length > 1 ? 's' : ''}
            </Badge>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="w-full">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucune transaction ce jour</p>
            <p className="text-sm">Sélectionnez une autre date pour voir l'historique</p>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            {transactions.map((transaction) => (
              <AgentTransactionItem
                key={`${transaction.type}-${transaction.id}`}
                transaction={transaction}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentTransactionHistory;
