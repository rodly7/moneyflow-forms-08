import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface SimpleHtmlWithdrawalConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (code: string) => Promise<void>;
  amount: number;
  phone: string;
  isProcessing: boolean;
}

const SimpleHtmlWithdrawalConfirmation = ({
  isOpen,
  onClose,
  onConfirm,
  amount,
  phone,
  isProcessing
}: SimpleHtmlWithdrawalConfirmationProps) => {
  const { toast } = useToast();
  const [verificationCode, setVerificationCode] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: "Code requis",
        description: "Veuillez entrer le code de vérification",
        variant: "destructive"
      });
      return;
    }

    setIsConfirming(true);
    try {
      await onConfirm(verificationCode);
      setVerificationCode("");
      onClose();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Code de vérification invalide",
        variant: "destructive"
      });
    } finally {
      setIsConfirming(false);
    }
  };

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
          <span style={{ fontSize: '20px' }}>💰</span>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            margin: 0,
            color: '#dc2626'
          }}>
            Confirmer le retrait
          </h2>
        </div>

        {/* Détails du retrait */}
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
            Détails du retrait
          </h3>
          
          <div style={{ marginBottom: '8px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span>Montant:</span>
              <span style={{ fontWeight: 'bold', color: '#dc2626' }}>
                {amount.toLocaleString('fr-FR')} XAF
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span>Téléphone:</span>
              <span style={{ fontWeight: 'bold' }}>{phone}</span>
            </div>
          </div>
        </div>

        {/* Section de vérification */}
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
              Entrez le code de vérification pour confirmer le retrait
            </p>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Code de vérification"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              style={{
                width: '100%',
                height: '48px',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                textAlign: 'center',
                letterSpacing: '2px',
                boxSizing: 'border-box'
              }}
              disabled={isConfirming || isProcessing}
              onKeyPress={(e) => e.key === 'Enter' && !isConfirming && handleConfirm()}
            />
            
            <button
              onClick={handleConfirm}
              disabled={isConfirming || isProcessing || !verificationCode.trim()}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: isConfirming || isProcessing || !verificationCode.trim() ? '#9ca3af' : '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: isConfirming || isProcessing || !verificationCode.trim() ? 'not-allowed' : 'pointer',
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
                  <span>✅</span>
                  <span>Confirmer le retrait</span>
                </>
              )}
            </button>
          </div>

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
              cursor: isConfirming || isProcessing ? 'not-allowed' : 'pointer'
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleHtmlWithdrawalConfirmation;