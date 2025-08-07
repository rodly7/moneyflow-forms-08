import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

interface EditSavingsAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: SavingsAccount;
  onSuccess: () => void;
}

const EditSavingsAccountModal = ({ 
  isOpen, 
  onClose, 
  account, 
  onSuccess 
}: EditSavingsAccountModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    target_date: "",
    auto_deposit_amount: "",
    auto_deposit_frequency: "monthly"
  });

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        target_amount: account.target_amount?.toString() || "",
        target_date: account.target_date || "",
        auto_deposit_amount: account.auto_deposit_amount?.toString() || "",
        auto_deposit_frequency: account.auto_deposit_frequency || "monthly"
      });
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      const updateData = {
        name: formData.name,
        target_amount: formData.target_amount ? parseFloat(formData.target_amount) : null,
        target_date: formData.target_date || null,
        auto_deposit_amount: formData.auto_deposit_amount ? parseFloat(formData.auto_deposit_amount) : null,
        auto_deposit_frequency: formData.auto_deposit_frequency || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('savings_accounts')
        .update(updateData)
        .eq('id', account.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Compte modifié",
        description: "Votre compte épargne a été mis à jour avec succès",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le compte épargne",
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Modifier le compte épargne</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nom du compte *
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: Vacances, Maison..."
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="target_amount" className="block text-sm font-medium mb-1">
              Objectif (FCFA)
            </label>
            <input
              id="target_amount"
              type="number"
              value={formData.target_amount}
              onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
              placeholder="Montant à épargner"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="target_date" className="block text-sm font-medium mb-1">
              Date objectif
            </label>
            <input
              id="target_date"
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData({...formData, target_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="auto_deposit_amount" className="block text-sm font-medium mb-1">
              Dépôt automatique (FCFA)
            </label>
            <input
              id="auto_deposit_amount"
              type="number"
              value={formData.auto_deposit_amount}
              onChange={(e) => setFormData({...formData, auto_deposit_amount: e.target.value})}
              placeholder="Montant du dépôt automatique"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="auto_deposit_frequency" className="block text-sm font-medium mb-1">
              Fréquence du dépôt automatique
            </label>
            <select
              id="auto_deposit_frequency"
              value={formData.auto_deposit_frequency}
              onChange={(e) => setFormData({...formData, auto_deposit_frequency: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Quotidien</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuel</option>
            </select>
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
              disabled={isLoading || !formData.name}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Modification..." : "Modifier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSavingsAccountModal;