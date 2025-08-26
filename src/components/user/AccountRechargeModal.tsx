
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { processAutomaticRecharge } from '@/services/balanceService';
import { Smartphone } from 'lucide-react';

interface AccountRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AccountRechargeModal = ({ isOpen, onClose, onSuccess }: AccountRechargeModalProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRecharge = async () => {
    if (!user?.id || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      await processAutomaticRecharge(
        user.id,
        Number(amount),
        profile?.country || 'Congo Brazzaville'
      );

      toast({
        title: "Recharge effectuée",
        description: `Votre compte a été rechargé de ${Number(amount).toLocaleString()} FCFA`,
      });

      setAmount('');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erreur recharge:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la recharge",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recharger mon compte</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Montant (FCFA)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Entrez le montant"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
            />
          </div>

          {/* Informations de paiement Mobile Money */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">Numéro de paiement</span>
            </div>
            <div className="text-lg font-bold text-blue-900">066164686</div>
            <p className="text-sm text-blue-700 mt-1">
              Utilisez ce numéro pour votre Mobile Money
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleRecharge}
              disabled={isProcessing || !amount}
              className="flex-1"
            >
              {isProcessing ? "Traitement..." : "Continuer"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
