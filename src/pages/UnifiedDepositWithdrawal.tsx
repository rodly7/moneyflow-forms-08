import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SimpleDepositWithdrawalForm from '@/components/deposit-withdrawal/SimpleDepositWithdrawalForm';
import { formatCurrency } from '@/lib/utils/currency';
import { ArrowDownToLine, ArrowUpFromLine, Wallet } from 'lucide-react';

const UnifiedDepositWithdrawal = () => {
  const { profile } = useAuth();
  const [userBalance, setUserBalance] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setUserBalance(profile?.balance || 0);
  }, [profile]);

  const handleDeposit = async (amount: number, phone: string) => {
    setIsProcessing(true);
    // Handle deposit logic here
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
  };

  const handleWithdrawal = async (amount: number, phone: string) => {
    setIsProcessing(true);
    // Handle withdrawal logic here
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            Solde actuel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-800">
            {formatCurrency(userBalance, 'XAF')}
          </div>
          <Badge variant="secondary" className="mt-2">
            Compte vérifié
          </Badge>
        </CardContent>
      </Card>

      {/* Deposit/Withdrawal Forms */}
      <Tabs defaultValue="deposit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deposit" className="flex items-center gap-2">
            <ArrowDownToLine className="w-4 h-4" />
            Dépôt
          </TabsTrigger>
          <TabsTrigger value="withdrawal" className="flex items-center gap-2">
            <ArrowUpFromLine className="w-4 h-4" />
            Retrait
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deposit">
          <SimpleDepositWithdrawalForm 
            type="deposit"
            onSubmit={handleDeposit}
            isProcessing={isProcessing}
            userBalance={userBalance}
          />
        </TabsContent>

        <TabsContent value="withdrawal">
          <SimpleDepositWithdrawalForm 
            type="withdrawal"
            onSubmit={handleWithdrawal}
            isProcessing={isProcessing}
            userBalance={userBalance}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedDepositWithdrawal;
