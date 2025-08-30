import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { pinEncryptionService } from '@/services/pinEncryptionService';
import { useAuth } from '@/contexts/AuthContext';
import { Fingerprint } from 'lucide-react';

interface AppLockModalProps {
  isOpen: boolean;
  onUnlock: () => void;
}

export const AppLockModal = ({ isOpen, onUnlock }: AppLockModalProps) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const { signOut } = useAuth();

  useEffect(() => {
    // Vérifier si l'authentification biométrique est disponible
    const checkBiometricAvailability = async () => {
      if (window.PublicKeyCredential && 
          await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()) {
        setIsBiometricAvailable(true);
      }
    };
    
    checkBiometricAvailability();
  }, []);

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

      // Récupérer le PIN chiffré stocké
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('pin_code')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.pin_code) {
        toast.error('PIN non configuré');
        return;
      }

      // Vérifier le PIN avec le service de chiffrement
      const isValid = pinEncryptionService.verifyPin(pin, profile.pin_code, user.id);

      if (isValid) {
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

  const handleBiometricAuth = async () => {
    if (!isBiometricAvailable) {
      toast.error('Authentification biométrique non disponible');
      return;
    }

    setBiometricLoading(true);
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: {
            name: "MoneyFlow",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode("user-id"),
            name: "user@example.com",
            displayName: "User",
          },
          pubKeyCredParams: [{alg: -7, type: "public-key"}],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
        }
      });

      if (credential) {
        toast.success('Authentification biométrique réussie');
        onUnlock();
      }
    } catch (error) {
      console.error('Erreur authentification biométrique:', error);
      toast.error('Échec de l\'authentification biométrique');
    } finally {
      setBiometricLoading(false);
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
                <InputOTPSlot index={0} masked />
                <InputOTPSlot index={1} masked />
                <InputOTPSlot index={2} masked />
                <InputOTPSlot index={3} masked />
              </InputOTPGroup>
            </InputOTP>
          </div>
          
          <div className="flex flex-col gap-3">
            {isBiometricAvailable && (
              <Button 
                onClick={handleBiometricAuth}
                disabled={biometricLoading}
                className="w-full"
                variant="secondary"
              >
                <Fingerprint className="w-4 h-4 mr-2" />
                {biometricLoading ? 'Authentification...' : 'Déverrouiller avec Face ID/Touch ID'}
              </Button>
            )}
            
            <Button 
              onClick={handleVerifyPin}
              disabled={pin.length !== 4 || loading}
              className="w-full"
            >
              {loading ? 'Vérification...' : 'Déverrouiller avec PIN'}
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