import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Fingerprint, Eye, EyeOff, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BiometricConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  operationType: string;
  recipient?: string;
}

export const BiometricConfirmation = ({
  isOpen,
  onClose,
  onConfirm,
  amount,
  operationType,
  recipient
}: BiometricConfirmationProps) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [useBiometric, setUseBiometric] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Vérifier si WebAuthn est disponible
    if (window.PublicKeyCredential && navigator.credentials) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => {
          setIsBiometricAvailable(available);
        })
        .catch(() => {
          setIsBiometricAvailable(false);
        });
    }
  }, []);

  const handleBiometricAuth = async () => {
    // Vérification améliorée de la disponibilité biométrique
    const isInIframe = window.self !== window.top;
    const hasPublicKeyCredential = 'PublicKeyCredential' in window;
    const hasCredentials = navigator.credentials;
    
    if (!hasPublicKeyCredential || !hasCredentials || isInIframe) {
      toast({
        title: "Utiliser le mot de passe",
        description: isInIframe 
          ? "L'authentification biométrique n'est pas disponible dans cette interface"
          : "Face ID/Touch ID n'est pas disponible sur cet appareil",
        variant: "default"
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Vérifier d'abord si l'authentification biométrique est disponible
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      
      if (!available) {
        toast({
          title: "Utiliser le mot de passe", 
          description: "L'authentification biométrique n'est pas configurée sur cet appareil",
          variant: "default"
        });
        setIsProcessing(false);
        return;
      }

      // Configuration WebAuthn simplifiée et plus robuste
      const publicKeyCredentialRequestOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [],
        timeout: 20000,
        userVerification: "preferred" as UserVerificationRequirement
      };

      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      if (credential) {
        toast({
          title: "✅ Authentification réussie",
          description: "Transaction confirmée avec Face ID/Touch ID"
        });
        onConfirm();
      }
    } catch (error: any) {
      console.error('Erreur biométrique:', error);
      
      let message = "Veuillez utiliser votre mot de passe";
      
      if (error.name === 'NotAllowedError') {
        message = "Authentification annulée. Utilisez votre mot de passe.";
      } else if (error.name === 'NotSupportedError') {
        message = "Authentification biométrique non supportée.";
      } else if (error.name === 'SecurityError') {
        message = "Erreur de sécurité. Utilisez votre mot de passe.";
      }
      
      toast({
        title: "Fallback requis",
        description: message,
        variant: "default"
      });
    }
    setIsProcessing(false);
  };

  const handlePasswordAuth = async () => {
    if (!password) {
      toast({
        title: "Mot de passe requis",
        description: "Veuillez saisir votre mot de passe",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: password
      });

      if (error) {
        toast({
          title: "Mot de passe incorrect",
          description: "Veuillez vérifier votre mot de passe",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "✅ Authentification réussie",
        description: "Transaction confirmée avec mot de passe"
      });
      onConfirm();
    } catch (error) {
      console.error('Erreur mot de passe:', error);
      toast({
        title: "Erreur d'authentification",
        description: "Impossible de vérifier le mot de passe",
        variant: "destructive"
      });
    }
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Confirmation de Transaction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <h3 className="font-semibold">{operationType}</h3>
            <p className="text-2xl font-bold text-primary">
              {amount.toLocaleString()} XAF
            </p>
            {recipient && (
              <p className="text-sm text-muted-foreground">
                Vers: {recipient}
              </p>
            )}
          </div>

          {isBiometricAvailable && (
            <Button
              onClick={handleBiometricAuth}
              disabled={isProcessing}
              className="w-full h-12"
              size="lg"
            >
              <Fingerprint className="w-5 h-5 mr-2" />
              {isProcessing ? "Authentification..." : "Confirmer avec Face ID/Touch ID"}
            </Button>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                ou
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Saisissez votre mot de passe"
                disabled={isProcessing}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isProcessing}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handlePasswordAuth}
              disabled={isProcessing || !password}
              className="flex-1"
            >
              {isProcessing ? "Vérification..." : "Confirmer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};