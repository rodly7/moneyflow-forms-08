import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';

interface AgentEarningsCardProps {
  totalEarnings: number;
  commissionRate: number;
  totalWithdrawals: number;
}

const AgentEarningsCard: React.FC<AgentEarningsCardProps> = ({ totalEarnings, commissionRate, totalWithdrawals }) => {
  const netEarnings = totalEarnings - totalWithdrawals;

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          Gains
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Gains Totaux</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(totalEarnings)}</p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Taux de Commission</p>
            <p className="text-2xl font-bold text-blue-700">{commissionRate}%</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Percent className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Retraits Totaux</p>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(totalWithdrawals)}</p>
          </div>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-red-600" />
          </div>
        </div>
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Gains Nets</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(netEarnings)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentEarningsCard;
