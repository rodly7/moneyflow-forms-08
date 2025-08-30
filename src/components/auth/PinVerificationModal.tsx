import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield } from 'lucide-react';
import { pinEncryptionService } from '@/services/pinEncryptionService';

interface PinVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function PinVerificationModal({ 
  open, 
  onClose, 
  onSuccess,
  title = "Vérification PIN",
  description = "Saisissez votre code PIN pour continuer"
}: PinVerificationModalProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyPin = async () => {
    if (pin.length !== 4) {
      toast({
        title: "PIN invalide",
        description: "Le PIN doit contenir exactement 4 chiffres",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Récupérer le PIN chiffré stocké
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('pin_code')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.pin_code) {
        throw new Error('PIN non configuré');
      }

      // Vérifier le PIN avec le service de chiffrement
      const isValid = pinEncryptionService.verifyPin(pin, profile.pin_code, user.id);

      // Supprimer cette ligne car nous n'utilisons plus le RPC

      if (!isValid) {
        toast({
          title: "PIN incorrect",
          description: "Le code PIN saisi est incorrect",
          variant: "destructive",
        });
        setPin('');
        return;
      }

      onSuccess();
      onClose();
      setPin('');
    } catch (error: any) {
      console.error('Erreur lors de la vérification du PIN:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de vérifier le PIN",
        variant: "destructive",
      });
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPin('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            {title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={4}
              value={pin}
              onChange={setPin}
              pattern="^[0-9]*$"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Annuler
            </Button>
            
            <Button
              onClick={handleVerifyPin}
              disabled={loading || pin.length !== 4}
              className="flex-1"
            >
              {loading ? 'Vérification...' : 'Vérifier'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}