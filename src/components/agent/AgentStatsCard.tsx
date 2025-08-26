import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';

interface AgentStatsCardProps {
  totalEarnings: number;
  totalCustomers: number;
  averageTransactionTime: number;
}

const AgentStatsCard: React.FC<AgentStatsCardProps> = ({
  totalEarnings,
  totalCustomers,
  averageTransactionTime,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Total Earnings */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between font-semibold">
            <span>Gains Totaux</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">{formatCurrency(totalEarnings, 'XAF')}</div>
          <p className="text-sm text-gray-500">Revenus générés</p>
        </CardContent>
      </Card>

      {/* Total Customers */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between font-semibold">
            <span>Clients Totaux</span>
            <Users className="w-5 h-5 text-blue-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-700">{totalCustomers}</div>
          <p className="text-sm text-gray-500">Nombre de clients servis</p>
        </CardContent>
      </Card>

      {/* Average Transaction Time */}
      <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between font-semibold">
            <span>Temps Moyen/Transaction</span>
            <Clock className="w-5 h-5 text-yellow-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-700">{averageTransactionTime} sec</div>
          <p className="text-sm text-gray-500">Délai moyen par transaction</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentStatsCard;
