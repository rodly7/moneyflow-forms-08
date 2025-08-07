
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CreateSavingsAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateSavingsAccountModal = ({ isOpen, onClose, onSuccess }: CreateSavingsAccountModalProps) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !targetAmount || !user) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    
    try {
      const { error } = await supabase
        .from('savings_accounts')
        .insert({
          user_id: user.id,
          name,
          target_amount: parseFloat(targetAmount),
          interest_rate: 5.0
        });

      if (error) throw error;
      
      toast({
        title: "Compte créé",
        description: `Le compte d'épargne "${name}" a été créé avec succès`,
      });
      
      setName('');
      setTargetAmount('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le compte d'épargne",
        variant: "destructive"
      });
    }
    
    setIsCreating(false);
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Créer un compte d'épargne</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="account-name" className="block text-sm font-medium">
              Nom du compte
            </label>
            <input
              id="account-name"
              type="text"
              placeholder="Ex: Épargne vacances"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="target-amount" className="block text-sm font-medium">
              Objectif d'épargne (XAF)
            </label>
            <input
              id="target-amount"
              type="number"
              placeholder="100000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
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
              disabled={isCreating} 
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isCreating ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSavingsAccountModal;
