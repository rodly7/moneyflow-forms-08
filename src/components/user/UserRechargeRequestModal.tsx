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
import { Wallet, CreditCard, AlertCircle, CheckCircle, Phone, User } from 'lucide-react';

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

const UserRechargeRequestModal = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentNumberId, setPaymentNumberId] = useState('');
  const [paymentNumbers, setPaymentNumbers] = useState<PaymentNumber[]>([]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        .in('service_type', ['recharge', 'both'])
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

  const handleSubmit = async () => {
    if (!amount || !paymentNumberId) {
      toast({
        title: "Erreur",
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
      const { data, error } = await supabase
        .from('recharge_requests')
        .insert([
          {
            user_id: user?.id,
            amount: rechargeAmount,
            payment_number_id: paymentNumberId,
            description: description,
            status: 'pending',
          },
        ])
        .select()

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Votre demande de recharge a été soumise avec succès",
      });

      setOpen(false);
      setAmount('');
      setPaymentNumberId('');
      setDescription('');
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la soumission de la demande",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <DialogTitle>Demande de Recharge de Compte</DialogTitle>
        </DialogHeader>

        <Card className="border-0 shadow-md">
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant à recharger (FCFA)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Ex: 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentNumber">Numéro de paiement</Label>
              <Select value={paymentNumberId} onValueChange={setPaymentNumberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un numéro" />
                </SelectTrigger>
                <SelectContent>
                  {paymentNumbers.map((number) => (
                    <SelectItem key={number.id} value={number.id}>
                      <div className="flex items-center justify-between">
                        <span>{number.phone_number}</span>
                        <Badge variant="secondary">{number.provider}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                placeholder="Informations supplémentaires"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Traitement...
              </>
            ) : (
              "Envoyer la demande"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserRechargeRequestModal;
