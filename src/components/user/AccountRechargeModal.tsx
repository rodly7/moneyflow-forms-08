import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils/currency';
import { Wallet, CreditCard, AlertCircle, CheckCircle, Phone } from 'lucide-react';

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

const AccountRechargeModal = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentNumbers, setPaymentNumbers] = useState<PaymentNumber[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<string | undefined>(undefined);
  const [rechargeNote, setRechargeNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPaymentNumbers();
  }, []);

  const fetchPaymentNumbers = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_numbers')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setPaymentNumbers(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les numéros de paiement",
        variant: "destructive"
      });
    }
  };

  const handleRechargeRequest = async () => {
    if (!amount || !selectedNumber) {
      toast({
        title: "Données manquantes",
        description: "Veuillez saisir un montant et sélectionner un numéro de paiement",
        variant: "destructive"
      });
      return;
    }

    const rechargeAmount = Number(amount);
    if (rechargeAmount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Le montant doit être supérieur à 0",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: paymentNumber, error: paymentNumberError } = await supabase
        .from('payment_numbers')
        .select('*')
        .eq('id', selectedNumber)
        .single();

      if (paymentNumberError) throw paymentNumberError;

      const { error } = await supabase
        .from('recharge_requests')
        .insert({
          user_id: user?.id,
          amount: rechargeAmount,
          payment_number_id: selectedNumber,
          recharge_note: rechargeNote,
          status: 'pending',
          phone_number: profile?.phone,
          full_name: profile?.full_name,
          country: profile?.country,
          provider: paymentNumber.provider,
          payment_number: paymentNumber.phone_number
        });

      if (error) throw error;

      toast({
        title: "Demande de recharge envoyée",
        description: "Votre demande a été soumise avec succès. Veuillez patienter pendant le traitement.",
      });

      setOpen(false);
      setAmount('');
      setSelectedNumber(undefined);
      setRechargeNote('');
    } catch (error) {
      console.error('Erreur lors de la demande de recharge:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la soumission de la demande de recharge",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultNumber = paymentNumbers.find(number => number.is_default);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-3">
          <Wallet className="w-4 h-4" />
          Recharger mon compte
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
            Demande de Recharge de Compte
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Montant à recharger */}
          <div>
            <Label htmlFor="amount">Montant à recharger (XAF)</Label>
            <Input
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              placeholder="Ex: 5000"
            />
          </div>

          {/* Numéro de paiement */}
          <div>
            <Label htmlFor="paymentNumber">Numéro de paiement</Label>
            <Select onValueChange={setSelectedNumber} defaultValue={defaultNumber?.id}>
              <SelectTrigger id="paymentNumber">
                <SelectValue placeholder="Sélectionner un numéro" />
              </SelectTrigger>
              <SelectContent>
                {paymentNumbers.map((number) => (
                  <SelectItem key={number.id} value={number.id}>
                    {number.phone_number} ({number.provider})
                    {number.is_default && (
                      <Badge className="ml-2" variant="secondary">Par défaut</Badge>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Note de recharge */}
          <div>
            <Label htmlFor="rechargeNote">Note de recharge (optionnel)</Label>
            <Textarea
              id="rechargeNote"
              value={rechargeNote}
              onChange={(e) => setRechargeNote(e.target.value)}
              placeholder="Ex: Recharge pour achat de crédit"
            />
          </div>

          {/* Aperçu de la demande */}
          {amount && selectedNumber && (
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center space-x-4">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-800">
                      Aperçu de la demande
                    </h3>
                    <p className="text-xs text-gray-500">
                      Veuillez vérifier les informations avant de soumettre
                    </p>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-gray-700 text-sm">
                    <span className="font-semibold">Montant:</span> {formatCurrency(Number(amount), 'XAF')}
                  </p>
                  {paymentNumbers.find(number => number.id === selectedNumber) && (
                    <p className="text-gray-700 text-sm">
                      <span className="font-semibold">Numéro de paiement:</span>{' '}
                      {paymentNumbers.find(number => number.id === selectedNumber)?.phone_number} ({paymentNumbers.find(number => number.id === selectedNumber)?.provider})
                    </p>
                  )}
                  {rechargeNote && (
                    <p className="text-gray-700 text-sm">
                      <span className="font-semibold">Note:</span> {rechargeNote}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Button type="submit" onClick={handleRechargeRequest} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-top-transparent"></div>
              Envoi en cours...
            </>
          ) : (
            <>
              Envoyer la demande
              <CheckCircle className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AccountRechargeModal;
