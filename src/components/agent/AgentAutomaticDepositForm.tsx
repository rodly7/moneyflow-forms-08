
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils/currency';
import { Wallet, DollarSign, CreditCard, Phone } from 'lucide-react';

interface Props {
  onDepositSuccess: () => void;
}

const AgentAutomaticDepositForm: React.FC<Props> = ({ onDepositSuccess }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [availablePaymentNumbers, setAvailablePaymentNumbers] = useState<{ id: string; phone_number: string; provider: string; }[]>([]);

  useEffect(() => {
    const fetchPaymentNumbers = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_numbers')
          .select('id, phone_number, provider')
          .eq('is_active', true)
          .eq('service_type', 'recharge');

        if (error) {
          console.error('Error fetching payment numbers:', error);
          toast({
            title: "Erreur",
            description: "Impossible de charger les numéros de paiement",
            variant: "destructive"
          });
        } else {
          setAvailablePaymentNumbers(data || []);
        }
      } catch (error) {
        console.error('Erreur:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors du chargement des numéros de paiement",
          variant: "destructive"
        });
      }
    };

    fetchPaymentNumbers();
  }, [toast]);

  const handleDeposit = async () => {
    if (!amount || !user?.id || !phoneNumber) {
      toast({
        title: "Données manquantes",
        description: "Veuillez saisir un montant et un numéro de téléphone",
        variant: "destructive"
      });
      return;
    }

    const depositAmount = Number(amount);
    if (depositAmount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Le montant doit être supérieur à 0",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Call the Supabase function to handle the deposit
      const { error } = await supabase.from('recharges').insert({
        user_id: user.id,
        amount: depositAmount,
        payment_provider: paymentMethod,
        payment_phone: phoneNumber,
        payment_method: paymentMethod,
        country: profile?.country || 'CM',
        transaction_reference: `DEP_${Date.now()}`,
        status: 'pending',
      });

      if (error) {
        console.error('Erreur lors du dépôt automatique:', error);
        throw error;
      }

      toast({
        title: "Dépôt effectué avec succès",
        description: `Votre demande de dépôt de ${formatCurrency(depositAmount, 'XAF')} a été soumise.`,
      });

      // Reset form
      setAmount("");
      setPhoneNumber("");

      // Notify parent component about the successful deposit
      onDepositSuccess();

    } catch (error: any) {
      console.error('Erreur lors du dépôt:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du dépôt automatique",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="backdrop-blur-xl bg-white/90 shadow-2xl border border-white/50 rounded-2xl">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-2xl">
        <CardTitle className="flex items-center gap-3 text-green-700">
          <Wallet className="w-6 h-6" />
          Dépôt Automatique
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Formulaire de dépôt */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deposit-amount" className="text-gray-700 font-medium">
              Montant à déposer (FCFA)
            </Label>
            <Input
              id="deposit-amount"
              type="number"
              placeholder="Ex: 10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method" className="text-gray-700 font-medium">
              Méthode de paiement
            </Label>
            <Select onValueChange={setPaymentMethod} defaultValue={paymentMethod}>
              <SelectTrigger className="h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500">
                <SelectValue placeholder="Sélectionner une méthode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                {/* <SelectItem value="credit_card">Carte de Crédit</SelectItem> */}
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === 'mobile_money' && (
            <div className="space-y-2">
              <Label htmlFor="phone-number" className="text-gray-700 font-medium">
                Numéro de téléphone Mobile Money
              </Label>
              <Select onValueChange={setPhoneNumber} value={phoneNumber}>
                <SelectTrigger className="h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500">
                  <SelectValue placeholder="Sélectionner un numéro" />
                </SelectTrigger>
                <SelectContent>
                  {availablePaymentNumbers.map(number => (
                    <SelectItem key={number.id} value={number.phone_number}>
                      {number.phone_number} ({number.provider})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {paymentMethod === 'credit_card' && (
            <div className="space-y-2">
              <Label htmlFor="card-number" className="text-gray-700 font-medium">
                Numéro de carte de crédit
              </Label>
              <Input
                id="card-number"
                type="text"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
          )}
        </div>

        {/* Action */}
        <div className="flex justify-end">
          <Button
            onClick={handleDeposit}
            disabled={isProcessing || !amount || Number(amount) <= 0}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-full px-8 h-12"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Traitement...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 mr-2" />
                Déposer
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentAutomaticDepositForm;
