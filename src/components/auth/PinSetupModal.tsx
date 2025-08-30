import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Lock } from 'lucide-react';
import { pinEncryptionService } from '@/services/pinEncryptionService';

interface PinSetupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PinSetupModal({ open, onClose, onSuccess }: PinSetupModalProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [loading, setLoading] = useState(false);

  const handleCreatePin = () => {
    if (pin.length !== 4) {
      toast({
        title: "PIN invalide",
        description: "Le PIN doit contenir exactement 4 chiffres",
        variant: "destructive",
      });
      return;
    }
    setStep('confirm');
  };

  const handleConfirmPin = async () => {
    if (pin !== confirmPin) {
      toast({
        title: "Erreur",
        description: "Les codes PIN ne correspondent pas",
        variant: "destructive",
      });
      setConfirmPin('');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Chiffrer le PIN avant de le stocker
      const encryptedPin = pinEncryptionService.encryptPin(pin, user.id);

      const { error } = await supabase.rpc('set_user_pin', {
        user_id_param: user.id,
        pin_param: encryptedPin
      });

      if (error) throw error;

      toast({
        title: "PIN créé avec succès",
        description: "Votre code PIN a été configuré",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de la création du PIN:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le PIN",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPin('');
    setConfirmPin('');
    setStep('create');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            {step === 'create' ? 'Créer un code PIN' : 'Confirmer le code PIN'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {step === 'create' 
              ? 'Créez un code PIN à 4 chiffres pour sécuriser votre compte'
              : 'Saisissez à nouveau votre code PIN pour le confirmer'
            }
          </p>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={4}
              value={step === 'create' ? pin : confirmPin}
              onChange={step === 'create' ? setPin : setConfirmPin}
              pattern="^[0-9]*$"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} masked />
                <InputOTPSlot index={1} masked />
                <InputOTPSlot index={2} masked />
                <InputOTPSlot index={3} masked />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="flex gap-3">
            {step === 'confirm' && (
              <Button
                variant="outline"
                onClick={() => {
                  setStep('create');
                  setConfirmPin('');
                }}
                className="flex-1"
              >
                Retour
              </Button>
            )}
            
            <Button
              onClick={step === 'create' ? handleCreatePin : handleConfirmPin}
              disabled={
                loading || 
                (step === 'create' ? pin.length !== 4 : confirmPin.length !== 4)
              }
              className="flex-1"
            >
              {loading ? 'Chargement...' : step === 'create' ? 'Continuer' : 'Confirmer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}