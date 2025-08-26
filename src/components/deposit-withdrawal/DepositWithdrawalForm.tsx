import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, calculateFee } from '@/lib/utils/currency';
import { ArrowUpRight, ArrowDownLeft, Wallet, AlertCircle, CheckCircle } from 'lucide-react';

interface PaymentNumber {
  id: string;
  phone_number: string;
  provider: string;
  country: string;
  is_active: boolean;
  is_default: boolean;
  service_type: 'recharge' | 'withdrawal' | 'both';
  description?: string;
}

const DepositWithdrawalForm = ({ type }: { type: 'deposit' | 'withdrawal' }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [paymentNumbers, setPaymentNumbers] = useState<PaymentNumber[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferFee, setTransferFee] = useState(0);
  const [isFeeCalculated, setIsFeeCalculated] = useState(false);

  useEffect(() => {
    fetchPaymentNumbers();
  }, []);

  const fetchPaymentNumbers = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_numbers')
        .select('*')
        .eq('country', profile?.country)
        .eq('is_active', true)
        .in('service_type', type === 'deposit' ? ['recharge', 'both'] : ['withdrawal', 'both']);

      if (error) throw error;
      setPaymentNumbers(data || []);

      // Set default payment number if available
      const defaultNumber = data?.find(number => number.is_default);
      if (defaultNumber) {
        setSelectedNumber(defaultNumber.id);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les numéros de paiement",
        variant: "destructive"
      });
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    setIsFeeCalculated(false); // Reset fee calculation when amount changes
  };

  const calculateTransferFee = () => {
    if (!amount) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un montant",
        variant: "destructive"
      });
      return;
    }

    const amountValue = Number(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Erreur",
        description: "Montant invalide",
        variant: "destructive"
      });
      return;
    }

    const feeDetails = calculateFee(amountValue, profile?.country || 'Congo Brazzaville', profile?.country || 'Congo Brazzaville');
    setTransferFee(feeDetails.fee);
    setIsFeeCalculated(true);
  };

  const handleSubmit = async () => {
    if (!amount || !selectedNumber) {
      toast({
        title: "Données manquantes",
        description: "Veuillez saisir un montant et sélectionner un numéro",
        variant: "destructive"
      });
      return;
    }

    const amountValue = Number(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Erreur",
        description: "Montant invalide",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Find selected payment number details
      const selectedPaymentNumber = paymentNumbers.find(number => number.id === selectedNumber);

      if (!selectedPaymentNumber) {
        throw new Error("Numéro de paiement introuvable");
      }

      // Perform the deposit or withdrawal operation
      const { data, error } = await supabase.from('operations').insert([
        {
          user_id: user?.id,
          type: type,
          amount: amountValue,
          status: 'pending',
          payment_number_id: selectedNumber,
          payment_provider: selectedPaymentNumber.provider,
          transfer_fee: transferFee,
          country: profile?.country,
          currency: 'XAF',
          operation_date: new Date().toISOString(),
        }
      ]).select().single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Votre demande de ${type === 'deposit' ? 'recharge' : 'retrait'} de ${formatCurrency(amountValue, 'XAF')} a été soumise avec succès.`,
      });

      // Reset form
      setAmount('');
      setSelectedNumber(undefined);
      setIsFeeCalculated(false);

    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      toast({
        title: "Erreur",
        description: `Erreur lors de la soumission de la demande: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="backdrop-blur-xl bg-white/90 shadow-2xl border border-white/50 rounded-2xl">
      <CardHeader className={`bg-gradient-to-r ${type === 'deposit' ? 'from-green-50 to-emerald-50' : 'from-red-50 to-orange-50'} rounded-t-2xl`}>
        <CardTitle className={`flex items-center gap-3 text-${type === 'deposit' ? 'green' : 'red'}-700`}>
          {type === 'deposit' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
          {type === 'deposit' ? 'Recharger votre compte' : 'Effectuer un retrait'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Solde actuel */}
        <div className={`bg-gradient-to-r ${type === 'deposit' ? 'from-green-100 to-emerald-100' : 'from-red-100 to-orange-100'} rounded-xl p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm text-${type === 'deposit' ? 'green' : 'red'}-600 font-medium`}>Solde actuel</p>
              <p className={`text-2xl font-bold text-${type === 'deposit' ? 'green' : 'red'}-800`}>
                {formatCurrency(profile?.balance || 0, 'XAF')}
              </p>
            </div>
            <Wallet className={`w-8 h-8 text-${type === 'deposit' ? 'green' : 'red'}-600`} />
          </div>
        </div>

        {/* Formulaire de dépôt/retrait */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-gray-700 font-medium">
              Montant à {type === 'deposit' ? 'recharger' : 'retirer'} (FCFA)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Ex: 50000"
              value={amount}
              onChange={handleAmountChange}
              className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-number" className="text-gray-700 font-medium">
              Numéro de paiement
            </Label>
            <Select value={selectedNumber} onValueChange={setSelectedNumber}>
              <SelectTrigger className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Sélectionner un numéro" />
              </SelectTrigger>
              <SelectContent>
                {paymentNumbers.map((number) => (
                  <SelectItem key={number.id} value={number.id}>
                    {number.phone_number} ({number.provider})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Frais de transfert */}
        {amount && !isFeeCalculated && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={calculateTransferFee}>
              Calculer les frais
            </Button>
          </div>
        )}

        {isFeeCalculated && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Frais de transfert</h4>
                <p className="text-sm text-blue-700">
                  Frais: {formatCurrency(transferFee, 'XAF')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || !amount || !selectedNumber}
            className={`bg-gradient-to-r ${type === 'deposit' ? 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' : 'from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'} rounded-full px-8 h-12`}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Traitement...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                {type === 'deposit' ? 'Recharger mon compte' : 'Confirmer le retrait'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DepositWithdrawalForm;
