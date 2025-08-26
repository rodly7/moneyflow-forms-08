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
import { ArrowUpRight, Wallet, AlertCircle, CheckCircle } from 'lucide-react';

interface DepositFormProps {
  onDepositSuccess: () => void;
}

const DepositForm: React.FC<DepositFormProps> = ({ onDepositSuccess }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [paymentNumber, setPaymentNumber] = useState('');
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feeDetails, setFeeDetails] = useState<{ fee: number; rate: number; agentCommission: number; moneyFlowCommission: number; }>({ fee: 0, rate: 0, agentCommission: 0, moneyFlowCommission: 0 });

  useEffect(() => {
    const fetchPaymentNumbers = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_numbers')
          .select('*')
          .eq('country', profile?.country)
          .eq('is_active', true)
          .order('is_default', { ascending: false });

        if (error) throw error;
        setAvailableNumbers(data || []);
        if (data && data.length > 0) {
          setPaymentNumber(data[0].phone_number);
        }
      } catch (error) {
        console.error('Error fetching payment numbers:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les numéros de paiement",
          variant: "destructive"
        });
      }
    };

    fetchPaymentNumbers();
  }, [profile?.country, supabase, toast]);

  useEffect(() => {
    if (amount && profile?.country) {
      const amountValue = Number(amount);
      if (!isNaN(amountValue) && amountValue > 0) {
        const calculatedFee = calculateFee(amountValue, profile.country, profile.country);
        setFeeDetails(calculatedFee);
      } else {
        setFeeDetails({ fee: 0, rate: 0, agentCommission: 0, moneyFlowCommission: 0 });
      }
    } else {
      setFeeDetails({ fee: 0, rate: 0, agentCommission: 0, moneyFlowCommission: 0 });
    }
  }, [amount, profile?.country]);

  const handleDeposit = async () => {
    if (!amount || !paymentNumber) {
      toast({
        title: "Données manquantes",
        description: "Veuillez saisir un montant et sélectionner un numéro de paiement",
        variant: "destructive"
      });
      return;
    }

    const depositAmount = Number(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez saisir un montant valide",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create a deposit request
      const { data: depositRequest, error: depositError } = await supabase
        .from('deposit_requests')
        .insert([
          {
            user_id: user?.id,
            amount: depositAmount,
            payment_number: paymentNumber,
            status: 'pending',
            fee: feeDetails.fee,
            rate: feeDetails.rate,
            agent_commission: feeDetails.agentCommission,
            money_flow_commission: feeDetails.moneyFlowCommission
          }
        ])
        .select()
        .single();

      if (depositError) throw depositError;

      toast({
        title: "Demande de dépôt créée",
        description: "Votre demande de dépôt a été créée avec succès et est en attente de validation",
      });

      // Reset form
      setAmount('');
      onDepositSuccess();

    } catch (error: any) {
      console.error('Error during deposit:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la demande de dépôt",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="backdrop-blur-xl bg-white/90 shadow-2xl border border-white/50 rounded-2xl">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
        <CardTitle className="flex items-center gap-3 text-green-700">
          <Wallet className="w-6 h-6" />
          Demande de dépôt
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Solde actuel */}
        {profile?.balance !== undefined && (
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Solde actuel</p>
                <p className="text-2xl font-bold text-green-800">
                  {formatCurrency(profile?.balance, 'XAF')}
                </p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-green-600" />
            </div>
          </div>
        )}

        {/* Formulaire de dépôt */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deposit-amount" className="text-gray-700 font-medium">
              Montant à déposer (FCFA)
            </Label>
            <Input
              id="deposit-amount"
              type="number"
              placeholder="Ex: 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">
              Numéro de paiement
            </Label>
            <Select value={paymentNumber} onValueChange={setPaymentNumber}>
              <SelectTrigger className="bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500">
                <SelectValue placeholder="Sélectionner un numéro" />
              </SelectTrigger>
              <SelectContent>
                {availableNumbers.map((number) => (
                  <SelectItem key={number.id} value={number.phone_number}>
                    {number.phone_number} ({number.provider})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Aperçu des frais */}
        {amount && Number(amount) > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Aperçu des frais</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Montant à déposer: {formatCurrency(Number(amount), 'XAF')}</p>
                  <p>• Frais de dépôt: {formatCurrency(feeDetails.fee, 'XAF')}</p>
                  <p className="font-semibold">• Montant total à payer: {formatCurrency(Number(amount) + feeDetails.fee, 'XAF')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action */}
        <div className="flex justify-end">
          <Button
            onClick={handleDeposit}
            disabled={isProcessing || !amount || !paymentNumber}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-full px-8 h-12"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Traitement...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmer le dépôt
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DepositForm;
