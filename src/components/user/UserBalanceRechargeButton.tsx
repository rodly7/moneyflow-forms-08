
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Moyens de paiement par pays
const paymentMethodsByCountry = {
  "Cameroun": ["Orange Money", "MTN Mobile Money"],
  "Congo Brazzaville": ["Airtel Money", "MTN Mobile Money"],
  "Gabon": ["Airtel Money", "Moov Money"],
  "Sénégal": ["Orange Money", "Wave", "Free Money"],
  "France": ["Carte bancaire", "Virement"],
  "Canada": ["Carte bancaire", "Interac"],
  "États-Unis": ["Carte bancaire", "PayPal"],
  "Royaume-Uni": ["Carte bancaire", "Bank Transfer"],
  "Suisse": ["Carte bancaire", "PostFinance"]
};

export const UserBalanceRechargeButton = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const userCountry = profile?.country || "Cameroun";
  const availablePaymentMethods = paymentMethodsByCountry[userCountry] || ["Orange Money", "MTN Mobile Money"];

  const handleRecharge = async () => {
    if (!user?.id || !amount || parseFloat(amount) <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }

    if (!paymentMethod) {
      toast.error("Veuillez sélectionner un moyen de paiement");
      return;
    }

    if (!phone && paymentMethod !== "Carte bancaire" && paymentMethod !== "Virement") {
      toast.error("Veuillez entrer votre numéro de téléphone");
      return;
    }

    setIsLoading(true);
    try {
      const rechargeAmount = parseFloat(amount);
      
      // Créer une demande de recharge
      const { error } = await supabase.from('recharges').insert({
        user_id: user.id,
        amount: rechargeAmount,
        payment_method: 'mobile_money',
        payment_provider: paymentMethod.toLowerCase().replace(' ', '_'),
        payment_phone: phone || profile?.phone || 'user',
        country: userCountry,
        transaction_reference: `USER_RECHARGE_${Date.now()}`,
        status: 'pending',
        provider_transaction_id: `USER_${user.id}_${Date.now()}`
      });

      if (error) throw error;

      toast.success(`Demande de recharge de ${rechargeAmount.toLocaleString()} XAF créée avec succès`);
      setAmount("");
      setPaymentMethod("");
      setPhone("");
      setIsOpen(false);
      await refreshProfile();
    } catch (error) {
      console.error('Erreur lors de la demande de recharge:', error);
      toast.error("Erreur lors de la demande de recharge");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <span className="font-medium text-gray-800">Recharger</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recharger le solde</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Montant (XAF)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Ex: 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="1"
            />
          </div>
          
          <div>
            <Label htmlFor="paymentMethod">Moyen de paiement</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un moyen de paiement" />
              </SelectTrigger>
              <SelectContent>
                {availablePaymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {paymentMethod && paymentMethod !== "Carte bancaire" && paymentMethod !== "Virement" && (
            <div>
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Ex: +237 6XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleRecharge}
              disabled={isLoading || !amount || !paymentMethod}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Demander Recharge
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
