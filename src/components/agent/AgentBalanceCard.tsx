import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';

interface AgentBalanceCardProps {
  balance: number;
  totalEarnings: number;
  totalWithdrawals: number;
}

const AgentBalanceCard: React.FC<AgentBalanceCardProps> = ({ balance, totalEarnings, totalWithdrawals }) => {
  const earningsDifference = totalEarnings - totalWithdrawals;
  const isPositiveDifference = earningsDifference >= 0;

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Solde du compte
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold">{formatCurrency(balance, 'XAF')}</div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="mr-1">Gains</span>
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-green-600">{formatCurrency(totalEarnings, 'XAF')}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="mr-1">Retraits</span>
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-red-600">{formatCurrency(totalWithdrawals, 'XAF')}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="mr-1">Différence</span>
            {isPositiveDifference ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={isPositiveDifference ? "text-green-600" : "text-red-600"}>
              {formatCurrency(earningsDifference, 'XAF')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentBalanceCard;
