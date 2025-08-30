import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AppLockModalProps {
  isOpen: boolean;
  onUnlock: () => void;
}

export const AppLockModal = ({ isOpen, onUnlock }: AppLockModalProps) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { signOut } = useAuth();

  const handleVerifyPin = async () => {
    if (pin.length !== 4) {
      toast.error('Veuillez saisir un PIN à 4 chiffres');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Session expirée');
        await signOut();
        return;
      }

      const { data, error } = await supabase.rpc('verify_user_pin', {
        pin_param: pin,
        user_id_param: user.id
      });

      if (error) {
        console.error('Erreur lors de la vérification du PIN:', error);
        toast.error('Erreur lors de la vérification du PIN');
        return;
      }

      if (data) {
        toast.success('PIN vérifié avec succès');
        setPin('');
        onUnlock();
      } else {
        toast.error('PIN incorrect');
        setPin('');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du PIN:', error);
      toast.error('Erreur lors de la vérification du PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-semibold">Application Verrouillée</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Saisissez votre PIN pour déverrouiller l'application
          </p>
        </DialogHeader>
        
        <div className="space-y-6 mt-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={4}
              value={pin}
              onChange={setPin}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleVerifyPin}
              disabled={pin.length !== 4 || loading}
              className="w-full"
            >
              {loading ? 'Vérification...' : 'Déverrouiller'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="w-full"
            >
              Se déconnecter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};