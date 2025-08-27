
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Send, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";

const CustomDepositSystem = () => {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("XAF");
  const [targetCurrency, setTargetCurrency] = useState("XAF");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDeposit = async () => {
    if (!selectedUserId || !amount) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    const depositAmount = parseFloat(amount);
    const rate = parseFloat(exchangeRate);

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
      const { data, error } = await supabase
        .from('admin_deposits')
        .insert({
          admin_id: (await supabase.auth.getUser()).data.user?.id || '',
          target_user_id: selectedUserId,
          amount: depositAmount,
          currency,
          target_currency: targetCurrency,
          exchange_rate: rate,
          converted_amount: depositAmount * rate,
          reference_number: referenceNumber || undefined,
          notes: notes || undefined
        });

      if (error) throw error;

      toast({
        title: "Dépôt créé",
        description: `Dépôt de ${formatCurrency(depositAmount)} créé avec succès`,
      });

      // Reset form
      setSelectedUserId("");
      setAmount("");
      setReferenceNumber("");
      setNotes("");
      setExchangeRate("1");

    } catch (error) {
      console.error('Erreur dépôt:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le dépôt",
        variant: "destructive"
      });
    }

    setIsProcessing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Système de Dépôt Personnalisé
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="user-id">ID Utilisateur *</Label>
            <Input
              id="user-id"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              placeholder="UUID de l'utilisateur"
            />
          </div>

          <div>
            <Label htmlFor="amount">Montant *</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100000"
            />
          </div>

          <div>
            <Label htmlFor="currency">Devise Source</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="XAF">XAF (Franc CFA)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                <SelectItem value="USD">USD (Dollar US)</SelectItem>
                <SelectItem value="CAD">CAD (Dollar Canadien)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="target-currency">Devise Cible</Label>
            <Select value={targetCurrency} onValueChange={setTargetCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="XAF">XAF (Franc CFA)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                <SelectItem value="USD">USD (Dollar US)</SelectItem>
                <SelectItem value="CAD">CAD (Dollar Canadien)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="exchange-rate">Taux de Change</Label>
            <Input
              id="exchange-rate"
              type="number"
              step="0.0001"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              placeholder="1"
            />
          </div>

          <div>
            <Label htmlFor="reference">Numéro de Référence</Label>
            <Input
              id="reference"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="REF-12345"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Informations supplémentaires..."
            rows={3}
          />
        </div>

        {amount && exchangeRate && (
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium mb-2">Résumé du dépôt</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Montant source</p>
                <p className="font-bold">{formatCurrency(parseFloat(amount))} {currency}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Montant converti</p>
                <p className="font-bold text-green-600">
                  {formatCurrency(parseFloat(amount) * parseFloat(exchangeRate))} {targetCurrency}
                </p>
              </div>
            </div>
          </div>
        )}

        <Button 
          onClick={handleDeposit}
          disabled={isProcessing || !selectedUserId || !amount}
          className="w-full"
        >
          <Send className="w-4 h-4 mr-2" />
          {isProcessing ? "Traitement..." : "Effectuer le Dépôt"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CustomDepositSystem;
