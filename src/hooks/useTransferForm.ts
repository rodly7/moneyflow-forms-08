import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { calculateFee } from "@/lib/utils/currency";

export const useTransferForm = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState(profile?.country || "Cameroun");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCountry(e.target.value);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive",
      });
      return;
    }

    if (!phoneNumber || phoneNumber.length < 6) {
      toast({
        title: "Numéro de téléphone invalide",
        description: "Veuillez entrer un numéro de téléphone valide",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      if (!user?.id) throw new Error("Utilisateur non authentifié");

      const transferAmount = Number(amount);

      // Calculate fees
      const { fee, agentCommission, moneyFlowCommission } = calculateFee(
        transferAmount,
        profile?.country || "Cameroun",
        country,
        profile?.role as 'user' | 'agent' | 'admin' | 'sub_admin'
      );

      // Start transaction
      const { data, error } = await supabase.rpc("transfer_funds", {
        sender_id: user.id,
        recipient_phone: phoneNumber,
        amount: transferAmount,
        transfer_fee: fee,
        sender_country: profile?.country,
        recipient_country: country,
        agent_commission: agentCommission,
        money_flow_commission: moneyFlowCommission,
      });

      if (error) {
        console.error("Erreur lors du transfert:", error);
        toast({
          title: "Erreur de transfert",
          description:
            error.message || "Une erreur est survenue lors du transfert.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Transfert réussi!",
        description: `Transfert de ${amount} XAF vers ${phoneNumber} effectué avec succès.`,
      });

      // Reset form
      setAmount("");
      setPhoneNumber("");
      navigate("/transactions");
    } catch (err: any) {
      console.error("Erreur inattendue lors du transfert:", err);
      toast({
        title: "Erreur inattendue",
        description: err.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [amount, phoneNumber, country, user?.id, profile, toast, navigate]);

  return {
    amount,
    phoneNumber,
    country,
    isProcessing,
    handleAmountChange,
    handlePhoneNumberChange,
    handleCountryChange,
    handleSubmit,
  };
};
