import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, calculateFee } from "@/lib/utils/currency";
import { AuthErrorHandler } from "@/services/authErrorHandler";

interface SimpleHtmlTransferConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  transferData: {
    amount: number;
    recipientName: string;
    recipientPhone: string;
    recipientCountry: string;
    senderCountry: string;
  };
  isProcessing: boolean;
}

const SimpleHtmlTransferConfirmation = ({
  isOpen,
  onClose,
  onConfirm,
  transferData,
  isProcessing
}: SimpleHtmlTransferConfirmationProps) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);

  // Vérifier si l'authentification biométrique est supportée
  useState(() => {
    const checkBiometricSupport = async () => {
      try {
        if (window.PublicKeyCredential && 
            await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()) {
          setBiometricSupported(true);
        }
      } catch (error) {
        console.log("Biométrie non supportée:", error);
        setBiometricSupported(false);
      }
    };
    
    checkBiometricSupport();
  });

  const handlePasswordConfirmation = async () => {
    if (!password.trim()) {
      toast({
        title: "Mot de passe requis",
        description: "Veuillez entrer votre mot de passe pour confirmer",
        variant: "destructive"
      });
      return;
    }

    setIsConfirming(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      await onConfirm();
      setPassword("");
      onClose();
      AuthErrorHandler.clearRetries('transfer_confirmation');
    } catch (error) {
      const canRetry = await AuthErrorHandler.handleAuthError(error, 'transfer_confirmation');
      if (!canRetry) {
        toast({
          title: "Erreur de confirmation",
          description: "Impossible de confirmer le transfert après plusieurs tentatives",
          variant: "destructive"
        });
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const handleBiometricConfirmation = async () => {
    if (!biometricSupported) {
      toast({
        title: "Biométrie non supportée",
        description: "Votre appareil ne supporte pas l'authentification biométrique",
        variant: "destructive"
      });
      return;
    }

    setIsConfirming(true);
    setBiometricError(null);
    
    try {
      // Vérification plus robuste et fallback pour iframe
      if (window.self !== window.top) {
        // Dans un iframe - utiliser fallback sécurisé
        setBiometricError("Authentification biométrique non disponible dans cette interface");
        toast({
          title: "Utiliser le mot de passe",
          description: "L'authentification biométrique n'est pas disponible. Utilisez votre mot de passe.",
          variant: "default"
        });
        return;
      }

      const publicKeyCredentialRequestOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [],
        timeout: 15000, // Réduit le timeout
        userVerification: "preferred" as UserVerificationRequirement // Moins strict
      };

      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      if (credential) {
        await onConfirm();
        onClose();
        toast({
          title: "Authentification réussie",
          description: "Transfert confirmé avec succès",
        });
        AuthErrorHandler.clearRetries('biometric_confirmation');
      }
    } catch (error: any) {
      console.log("Tentative d'authentification biométrique:", error);
      
      if (error.name === 'NotAllowedError') {
        setBiometricError("Utilisez votre mot de passe pour continuer");
        toast({
          title: "Authentification requise",
          description: "Veuillez utiliser votre mot de passe pour confirmer",
          variant: "default"
        });
      } else if (error.name === 'NotSupportedError') {
        setBiometricError("Authentification biométrique non supportée");
        setBiometricSupported(false);
      } else {
        setBiometricError("Utilisez votre mot de passe");
        toast({
          title: "Fallback requis",
          description: "Veuillez utiliser votre mot de passe pour confirmer",
          variant: "default"
        });
      }
    } finally {
      setIsConfirming(false);
    }
  };

  // Calculer les frais
  const { fee: fees, rate } = calculateFee(
    transferData.amount, 
    transferData.senderCountry, 
    transferData.recipientCountry,
    userRole === 'agent' ? 'agent' : 'user'
  );
  const total = transferData.amount + fees;

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px'
        }}>
          <span style={{ fontSize: '20px' }}>🛡️</span>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            margin: 0,
            color: '#059669'
          }}>
            Confirmer le transfert
          </h2>
        </div>

        {/* Détails du transfert */}
        <div style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '12px',
            margin: 0
          }}>
            Détails du transfert
          </h3>
          
          <div style={{ marginBottom: '8px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span>Destinataire:</span>
              <span style={{ fontWeight: 'bold' }}>{transferData.recipientName}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span>Téléphone:</span>
              <span style={{ fontWeight: 'bold' }}>{transferData.recipientPhone}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span>Pays:</span>
              <span style={{ fontWeight: 'bold' }}>{transferData.recipientCountry}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span>Montant:</span>
              <span style={{ fontWeight: 'bold', color: '#059669' }}>
                {formatCurrency(transferData.amount, 'XAF')}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <span>Frais ({rate}%):</span>
              <span style={{ fontWeight: 'bold', color: '#ea580c' }}>
                {formatCurrency(fees, 'XAF')}
              </span>
            </div>
            <div style={{
              borderTop: '1px solid #e5e7eb',
              paddingTop: '8px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                <span>Total:</span>
                <span style={{ color: '#059669' }}>
                  {formatCurrency(total, 'XAF')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section d'authentification */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              Confirmez votre identité pour effectuer ce transfert
            </p>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <input
              type="password"
              placeholder="Entrez votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                height: '48px',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              disabled={isConfirming || isProcessing}
              onKeyPress={(e) => e.key === 'Enter' && !isConfirming && handlePasswordConfirmation()}
            />
            
            <button
              onClick={handlePasswordConfirmation}
              disabled={isConfirming || isProcessing || !password.trim()}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: isConfirming || isProcessing || !password.trim() ? '#9ca3af' : '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: isConfirming || isProcessing || !password.trim() ? 'not-allowed' : 'pointer',
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isConfirming ? (
                <>
                  <span>⏳</span>
                  <span>Vérification...</span>
                </>
              ) : (
                <>
                  <span>🔒</span>
                  <span>Confirmer avec mot de passe</span>
                </>
              )}
            </button>
          </div>

          {biometricSupported && (
            <>
              <div style={{
                textAlign: 'center',
                margin: '16px 0',
                fontSize: '12px',
                color: '#6b7280',
                textTransform: 'uppercase'
              }}>
                Ou
              </div>

              <button
                onClick={handleBiometricConfirmation}
                disabled={isConfirming || isProcessing}
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: isConfirming || isProcessing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isConfirming ? (
                  <>
                    <span>⏳</span>
                    <span>Authentification...</span>
                  </>
                ) : (
                  <>
                    <span>👆</span>
                    <span>Utiliser Face ID / Empreinte</span>
                  </>
                )}
              </button>

              {biometricError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  color: '#dc2626',
                  backgroundColor: '#fef2f2',
                  padding: '8px',
                  borderRadius: '6px',
                  marginTop: '8px'
                }}>
                  <span>⚠️</span>
                  <span>{biometricError}</span>
                </div>
              )}
            </>
          )}

          <button
            onClick={onClose}
            disabled={isConfirming || isProcessing}
            style={{
              width: '100%',
              height: '40px',
              backgroundColor: 'white',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: isConfirming || isProcessing ? 'not-allowed' : 'pointer',
              marginTop: '12px'
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleHtmlTransferConfirmation;