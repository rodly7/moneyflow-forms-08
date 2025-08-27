import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/integrations/supabase/client";

interface SavingsAccount {
  id: string;
  name: string;
  balance: number;
  target_amount: number;
  target_date: string | null;
  auto_deposit_amount: number | null;
  auto_deposit_frequency: string | null;
  interest_rate: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface SavingsWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: SavingsAccount;
  onSuccess: () => void;
}

const SavingsWithdrawalModal = ({ 
  isOpen, 
  onClose, 
  account, 
  onSuccess 
}: SavingsWithdrawalModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canWithdraw = !account.target_amount || account.balance >= account.target_amount;
  const maxWithdrawable = Math.min(account.balance, canWithdraw ? account.balance : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount) return;

    const withdrawalAmount = parseFloat(amount);

    if (withdrawalAmount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Le montant doit être supérieur à 0",
        variant: "destructive"
      });
      return;
    }

    if (!canWithdraw) {
      toast({
        title: "Retrait non autorisé",
        description: "Vous devez atteindre votre objectif avant de pouvoir retirer",
        variant: "destructive"
      });
      return;
    }

    if (withdrawalAmount > maxWithdrawable) {
      toast({
        title: "Montant trop élevé",
        description: "Le montant dépasse votre solde épargne disponible",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('savings_withdrawal', {
        p_user_id: user.id,
        p_account_id: account.id,
        p_amount: withdrawalAmount
      });

      if (error) throw error;
      
      const result = data as boolean | { success: boolean; error?: string; message?: string };
      
      if (typeof result === 'boolean') {
        if (!result) {
          throw new Error('Erreur lors du retrait');
        }
      } else {
      
        if (!result.success) {
          throw new Error(result.error || 'Erreur lors du retrait');
        }
      }

      toast({
        title: "Retrait effectué",
        description: `${formatCurrency(withdrawalAmount, "XAF")} transféré vers votre compte principal`,
      });

      onSuccess();
      onClose();
      setAmount("");
    } catch (error) {
      console.error('Erreur lors du retrait:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer le retrait",
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Retrait de {account.name}</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">
              Solde épargne : {formatCurrency(account.balance, "XAF")}
            </p>
            {account.target_amount && (
              <p className="text-sm text-blue-700">
                Objectif : {formatCurrency(account.target_amount, "XAF")}
              </p>
            )}
          </div>

          {!canWithdraw && (
            <div className="bg-orange-50 p-3 rounded-md">
              <p className="text-sm text-orange-700">
                ⚠️ Vous devez atteindre votre objectif de {formatCurrency(account.target_amount || 0, "XAF")} avant de pouvoir effectuer un retrait
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium mb-1">
                Montant à retirer (FCFA)
              </label>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Montant"
                required
                min="1"
                max={maxWithdrawable}
                disabled={!canWithdraw}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                disabled={isLoading || !amount || parseFloat(amount) <= 0 || !canWithdraw}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? "Retrait..." : "Retirer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SavingsWithdrawalModal;