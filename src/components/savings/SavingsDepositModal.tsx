
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

interface SavingsDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: SavingsAccount;
  onSuccess: () => void;
}

const SavingsDepositModal = ({ 
  isOpen, 
  onClose, 
  account, 
  onSuccess 
}: SavingsDepositModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  const fetchUserBalance = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      const profileData = data as { balance: number };
      setUserBalance(profileData.balance || 0);
    } catch (error) {
      console.error("Erreur lors du chargement du solde:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger votre solde",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount) return;

    const depositAmount = parseFloat(amount);

    if (depositAmount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Le montant doit être supérieur à 0",
        variant: "destructive"
      });
      return;
    }

    if (depositAmount > userBalance) {
      toast({
        title: "Solde insuffisant",
        description: "Vous n'avez pas assez de fonds dans votre compte principal",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('savings_deposit', {
        p_user_id: user.id,
        p_account_id: account.id,
        p_amount: depositAmount
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors du dépôt');
      }

      toast({
        title: "Dépôt effectué",
        description: `${formatCurrency(depositAmount, "XAF")} transféré vers ${account.name}`,
      });

      onSuccess();
      onClose();
      setAmount("");
    } catch (error) {
      console.error('Erreur lors du dépôt:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer le dépôt",
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  React.useEffect(() => {
    if (isOpen) {
      fetchUserBalance();
    }
  }, [isOpen]);

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Dépôt vers {account.name}</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">
              Solde disponible : {formatCurrency(userBalance, "XAF")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium mb-1">
                Montant à déposer (FCFA)
              </label>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Montant"
                required
                min="1"
                max={userBalance}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                disabled={isLoading || !amount || parseFloat(amount) <= 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Dépôt..." : "Déposer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SavingsDepositModal;
