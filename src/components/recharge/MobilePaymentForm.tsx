
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CreditCard, Smartphone } from 'lucide-react';

interface PaymentProvider {
  id: string;
  name: string;
  icon: string;
  requiresPhone: boolean;
}

const paymentProviders: PaymentProvider[] = [
  { id: 'wave', name: 'Wave', icon: '🌊', requiresPhone: false },
  { id: 'orange', name: 'Orange Money', icon: '🟠', requiresPhone: true },
  { id: 'airtel', name: 'Airtel Money', icon: '🔴', requiresPhone: true },
  { id: 'momo', name: 'MTN MoMo', icon: '🟡', requiresPhone: true },
];

const MobilePaymentForm = () => {
  const [amount, setAmount] = useState<string>('');
  const [provider, setProvider] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedProvider = paymentProviders.find(p => p.id === provider);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const numericAmount = parseFloat(amount);
      
      if (!numericAmount || numericAmount <= 0) {
        toast({
          title: "Erreur",
          description: "Veuillez saisir un montant valide",
          variant: "destructive"
        });
        return;
      }

      if (!provider) {
        toast({
          title: "Erreur", 
          description: "Veuillez sélectionner un mode de paiement",
          variant: "destructive"
        });
        return;
      }

      if (selectedProvider?.requiresPhone && !phone) {
        toast({
          title: "Erreur",
          description: "Veuillez saisir votre numéro de téléphone",
          variant: "destructive"
        });
        return;
      }

      // Appeler l'Edge Function pour initier le paiement
      const { data, error } = await supabase.functions.invoke('initiate-mobile-payment', {
        body: {
          amount: numericAmount,
          provider,
          phone: selectedProvider?.requiresPhone ? phone : undefined
        }
      });

      if (error) {
        console.error('Erreur paiement:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors de l'initiation du paiement",
          variant: "destructive"
        });
        return;
      }

      // Gérer la réponse selon le provider
      if (data.checkoutUrl) {
        // Redirection pour Wave
        window.open(data.checkoutUrl, '_blank');
        toast({
          title: "Paiement initié",
          description: "Veuillez compléter le paiement dans la nouvelle fenêtre",
        });
      } else if (data.ussdCode) {
        // Afficher le code USSD pour les autres providers
        toast({
          title: "Code USSD généré",
          description: `Composez ${data.ussdCode} sur votre téléphone pour valider le paiement`,
          duration: 10000
        });
      }

      // Réinitialiser le formulaire
      setAmount('');
      setProvider('');
      setPhone('');

    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Recharge Mobile
        </CardTitle>
        <CardDescription>
          Rechargez votre compte via paiement mobile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Montant (XAF)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Ex: 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              step="100"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Mode de paiement</Label>
            <Select value={provider} onValueChange={setProvider} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un mode de paiement" />
              </SelectTrigger>
              <SelectContent>
                {paymentProviders.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <span>{p.icon}</span>
                      <span>{p.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProvider?.requiresPhone && (
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Ex: +221 77 123 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <Smartphone className="mr-2 h-4 w-4" />
                Initier le paiement
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MobilePaymentForm;
