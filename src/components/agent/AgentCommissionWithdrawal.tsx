import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils/currency';
import { Wallet, ArrowDownLeft, TrendingDown } from 'lucide-react';

interface Props {
  onWithdrawalSuccess: () => void;
}

const AgentCommissionWithdrawal: React.FC<Props> = ({ onWithdrawalSuccess }) => {
  const { user, profile } = useAuth();
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleWithdrawal = async () => {
    if (!amount || !user?.id) {
      toast({
        title: "Données manquantes",
        description: "Veuillez saisir un montant",
        variant: "destructive"
      });
      return;
    }

    const withdrawalAmount = Number(amount);
    if (withdrawalAmount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Le montant doit être supérieur à 0",
        variant: "destructive"
      });
      return;
    }

    if (withdrawalAmount > (profile?.commission_balance || 0)) {
      toast({
        title: "Solde insuffisant",
        description: "Le montant demandé est supérieur à votre solde de commission disponible",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Call the Supabase function to handle the withdrawal
      const { error } = await supabase.rpc('handle_agent_commission_withdrawal', {
        agent_id: user.id,
        amount: withdrawalAmount
      });

      if (error) {
        console.error('Erreur lors du retrait de commission:', error);
        throw error;
      }

      toast({
        title: "Retrait effectué avec succès",
        description: `Votre demande de retrait de ${formatCurrency(withdrawalAmount, 'XAF')} a été soumise.`,
      });

      // Reset form
      setAmount("");

      // Notify parent component about the successful withdrawal
      onWithdrawalSuccess();

    } catch (error: any) {
      console.error('Erreur lors du retrait:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du retrait de votre commission",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="backdrop-blur-xl bg-white/90 shadow-2xl border border-white/50 rounded-2xl">
      <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 rounded-t-2xl">
        <CardTitle className="flex items-center gap-3 text-red-700">
          <Wallet className="w-6 h-6" />
          Retrait de Commission
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Solde de commission actuel */}
        <div className="bg-gradient-to-r from-red-100 to-pink-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Solde de commission</p>
              <p className="text-2xl font-bold text-red-800">
                {formatCurrency(profile?.commission_balance || 0, 'XAF')}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Formulaire de retrait */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="withdrawal-amount" className="text-gray-700 font-medium">
              Montant à retirer (FCFA)
            </Label>
            <Input
              id="withdrawal-amount"
              type="number"
              placeholder="Ex: 10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 bg-gray-50 border-gray-200 focus:border-red-500 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Action */}
        <div className="flex justify-end">
          <Button
            onClick={handleWithdrawal}
            disabled={isProcessing || !amount || Number(amount) <= 0 || Number(amount) > (profile?.commission_balance || 0)}
            className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-full px-8 h-12"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Traitement...
              </>
            ) : (
              <>
                <ArrowDownLeft className="w-4 h-4 mr-2" />
                Retirer
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentCommissionWithdrawal;
