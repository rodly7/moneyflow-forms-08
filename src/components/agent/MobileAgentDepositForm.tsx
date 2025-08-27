import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ClientData {
  id: string;
  full_name: string;
  balance: number;
}

const MobileAgentDepositForm = () => {
  const [clientPhone, setClientPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const handleDeposit = async () => {
    if (!clientPhone || !amount) {
      setError('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Check if client exists
      const { data: clientData, error: clientError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', clientPhone)
        .single();

      if (clientError) {
        setError('Client non trouvé');
        return;
      }

      // Create deposit using transfers table instead of transactions
      const { error: depositError } = await supabase
        .from('transfers')
        .insert({
          sender_id: profile?.id,
          recipient_id: clientData.id,
          amount: parseFloat(amount),
          status: 'completed',
          type: 'deposit'
        });

      if (depositError) throw depositError;

      // Update client balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ 
          balance: clientData.balance + parseFloat(amount)
        })
        .eq('id', clientData.id);

      if (balanceError) throw balanceError;

      toast({
        title: "Succès",
        description: `Dépôt de ${formatCurrency(parseFloat(amount))} effectué avec succès`
      });

      // Reset form
      setAmount('');
      setClientPhone('');
      setClientData(null);

    } catch (error) {
      console.error('Deposit error:', error);
      setError('Erreur lors du dépôt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Effectuer un Dépôt</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="clientPhone">Numéro de téléphone du client</label>
          <Input
            type="tel"
            id="clientPhone"
            placeholder="Entrez le numéro de téléphone"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="amount">Montant à déposer</label>
          <Input
            type="number"
            id="amount"
            placeholder="Entrez le montant"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <Button onClick={handleDeposit} disabled={isLoading}>
          {isLoading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            'Déposer'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MobileAgentDepositForm;
