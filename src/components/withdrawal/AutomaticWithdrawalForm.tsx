
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAutomaticWithdrawal } from '@/hooks/useAutomaticWithdrawal';
import { formatCurrency } from '@/integrations/supabase/client';
import { Smartphone, AlertCircle } from 'lucide-react';

export const AutomaticWithdrawalForm = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { processWithdrawal, isProcessing } = useAutomaticWithdrawal();
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      });
      return;
    }

    if (!phoneNumber || phoneNumber.length < 8) {
      toast({
        title: "Numéro invalide",
        description: "Veuillez entrer un numéro de téléphone valide",
        variant: "destructive"
      });
      return;
    }

    const result = await processWithdrawal(Number(amount), phoneNumber);
    
    if (result?.success) {
      setAmount('');
      setPhoneNumber('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retrait automatique</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Montant à retirer (FCFA)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Entrez le montant"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Votre numéro de téléphone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Ex: +242066123456"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>

          {/* Informations Mobile Money */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Numéro Mobile Money</span>
            </div>
            <div className="text-lg font-bold text-green-900">****164686</div>
            <p className="text-sm text-green-700 mt-1">
              Votre numéro Mobile Money va être rechargé dans 2-5 minutes
            </p>
          </div>

          {profile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Solde actuel: {formatCurrency(profile.balance || 0, 'XAF')}
                </span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isProcessing || !amount || !phoneNumber}
            className="w-full"
          >
            {isProcessing ? "Traitement en cours..." : "Demande de retrait"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
