
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Fingerprint, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface BiometricConfirmationProps {
  withdrawalData: {
    id: string;
    amount: number;
    agentName?: string;
  };
  onClose: () => void;
  onConfirm: () => void;
}

const BiometricConfirmation = ({ withdrawalData, onClose, onConfirm }: BiometricConfirmationProps) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useBiometric, setUseBiometric] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Vérifier si Face ID/Touch ID est disponible
  const isBiometricAvailable = typeof window !== 'undefined' && 
    'PublicKeyCredential' in window && 
    'navigator' in window && 
    'credentials' in navigator;

  const handleBiometricAuth = async () => {
    if (!isBiometricAvailable) {
      toast({
        title: "Biométrie non disponible",
        description: "Veuillez utiliser votre mot de passe",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Simuler une authentification biométrique
      // Dans un vrai projet, vous utiliseriez WebAuthn API
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { name: "SendFlow" },
          user: {
            id: new TextEncoder().encode(user?.id || ''),
            name: user?.email || '',
            displayName: user?.email || ''
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          }
        }
      });

      if (credential) {
        toast({
          title: "Authentification réussie",
          description: "Retrait confirmé par biométrie",
        });
        onConfirm();
      }
    } catch (error) {
      console.error("Erreur biométrique:", error);
      toast({
        title: "Échec de l'authentification",
        description: "Veuillez utiliser votre mot de passe",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasswordAuth = async () => {
    if (!password) {
      toast({
        title: "Mot de passe requis",
        description: "Veuillez entrer votre mot de passe",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Vérifier le mot de passe avec Supabase
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
        title: "Authentification réussie",
        description: "Retrait confirmé par mot de passe",
      });
      onConfirm();
      
    } catch (error) {
      console.error("Erreur authentification:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la vérification",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    toast({
      title: "Retrait refusé",
      description: "Vous avez refusé cette demande de retrait",
    });
    onClose();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Confirmer le retrait</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">
            Montant: {withdrawalData.amount} FCFA
          </p>
          {withdrawalData.agentName && (
            <p className="text-sm text-gray-600">
              Demandé par: {withdrawalData.agentName}
            </p>
          )}
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
          <p className="text-orange-800 text-sm text-center">
            🔐 Confirmez votre identité pour autoriser ce retrait
          </p>
        </div>

        {/* Options d'authentification */}
        <div className="space-y-3">
          {isBiometricAvailable && (
            <Button
              onClick={handleBiometricAuth}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Fingerprint className="w-5 h-5 mr-2" />
              )}
              Confirmer avec Face ID / Touch ID
            </Button>
          )}

          <div className="relative">
            <Label htmlFor="password" className="text-sm font-medium">
              Ou entrez votre mot de passe
            </Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordAuth()}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            onClick={handlePasswordAuth}
            disabled={isProcessing || !password}
            className="w-full bg-green-600 hover:bg-green-700 h-12"
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Confirmer avec mot de passe
          </Button>
        </div>

        <Button
          onClick={handleReject}
          disabled={isProcessing}
          variant="destructive"
          className="w-full h-12"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Refuser le retrait
        </Button>

        <Button
          onClick={onClose}
          variant="outline"
          className="w-full"
          disabled={isProcessing}
        >
          Annuler
        </Button>
      </CardContent>
    </Card>
  );
};

export default BiometricConfirmation;
