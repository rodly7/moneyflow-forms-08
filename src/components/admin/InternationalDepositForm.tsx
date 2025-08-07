import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Globe, DollarSign, ArrowRight } from "lucide-react";

interface InternationalDepositFormProps {
  targetUserId: string;
  targetUserName: string;
  onSuccess?: () => void;
}

const currencies = [
  { code: 'XAF', name: 'Franc CFA', flag: '🇨🇲' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'USD', name: 'Dollar US', flag: '🇺🇸' },
  { code: 'GBP', name: 'Livre Sterling', flag: '🇬🇧' },
  { code: 'CAD', name: 'Dollar Canadien', flag: '🇨🇦' },
  { code: 'CHF', name: 'Franc Suisse', flag: '🇨🇭' },
];

const InternationalDepositForm = ({ targetUserId, targetUserName, onSuccess }: InternationalDepositFormProps) => {
  const [amount, setAmount] = useState('');
  const [sourceCurrency, setSourceCurrency] = useState('EUR');
  const [targetCurrency, setTargetCurrency] = useState('XAF');
  const [exchangeRate, setExchangeRate] = useState('655.957'); // EUR to XAF default rate
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const convertedAmount = parseFloat(amount || '0') * parseFloat(exchangeRate || '1');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un montant valide",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('process_international_deposit', {
        target_user_id: targetUserId,
        deposit_amount: parseFloat(amount),
        deposit_currency: sourceCurrency,
        target_currency: targetCurrency,
        exchange_rate: parseFloat(exchangeRate),
        reference_number: reference || null,
        notes: notes || null
      });

      if (error) throw error;

      toast({
        title: "Dépôt effectué",
        description: `Dépôt de ${convertedAmount.toFixed(2)} ${targetCurrency} effectué avec succès`,
      });

      // Reset form
      setAmount('');
      setReference('');
      setNotes('');
      onSuccess?.();
    } catch (error) {
      console.error('Erreur dépôt international:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du dépôt international",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Dépôt International - {targetUserName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sourceCurrency">Devise source</Label>
              <Select value={sourceCurrency} onValueChange={setSourceCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.flag} {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="targetCurrency">Devise cible</Label>
              <Select value={targetCurrency} onValueChange={setTargetCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.flag} {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Montant ({sourceCurrency})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="exchangeRate">Taux de change</Label>
              <Input
                id="exchangeRate"
                type="number"
                step="0.000001"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder="1.0"
                required
              />
            </div>
          </div>

          {amount && exchangeRate && (
            <div className="p-3 bg-muted rounded-lg flex items-center justify-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">
                {amount} {sourceCurrency}
              </span>
              <ArrowRight className="w-4 h-4" />
              <span className="font-bold text-primary">
                {convertedAmount.toFixed(2)} {targetCurrency}
              </span>
            </div>
          )}

          <div>
            <Label htmlFor="reference">Référence (optionnel)</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Numéro de référence"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes sur la transaction..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Traitement..." : "Effectuer le dépôt"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default InternationalDepositForm;