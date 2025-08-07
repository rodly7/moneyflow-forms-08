import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface SimpleHtmlSecureWithdrawalConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  amount: number;
  agentName: string;
  agentPhone: string;
  withdrawalPhone: string;
  isProcessing: boolean;
}

const SimpleHtmlSecureWithdrawalConfirmation = ({
  isOpen,
  onClose,
  onConfirm,
  amount,
  agentName,
  agentPhone,
  withdrawalPhone,
  isProcessing
}: SimpleHtmlSecureWithdrawalConfirmationProps) => {
  const { toast } = useToast();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
      toast({
        title: "Demande confirmée",
        description: "Votre demande de retrait a été envoyée à l'agent",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de confirmer la demande",
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
          <span style={{ fontSize: '20px' }}>🛡️</span>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            margin: 0,
            color: '#dc2626'
          }}>
            Demande de retrait sécurisé
          </h2>
        </div>

        {/* Détails de la demande */}
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
            Détails de la demande
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
              <span>Agent:</span>
              <span style={{ fontWeight: 'bold' }}>{agentName}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span>Téléphone agent:</span>
              <span style={{ fontWeight: 'bold' }}>{agentPhone}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span>Retrait sur:</span>
              <span style={{ fontWeight: 'bold' }}>{withdrawalPhone}</span>
            </div>
          </div>
        </div>

        {/* Information importante */}
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>ℹ️</span>
            <div style={{ fontSize: '14px', color: '#92400e' }}>
              <p style={{ margin: 0, marginBottom: '8px', fontWeight: 'bold' }}>
                Processus sécurisé
              </p>
              <p style={{ margin: 0 }}>
                Votre demande sera envoyée à l'agent. Vous recevrez une notification 
                lorsque l'agent aura traité votre demande.
              </p>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            disabled={isConfirming || isProcessing}
            style={{
              flex: 1,
              height: '48px',
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

          <button
            onClick={handleConfirm}
            disabled={isConfirming || isProcessing}
            style={{
              flex: 2,
              height: '48px',
              backgroundColor: isConfirming || isProcessing ? '#9ca3af' : '#dc2626',
              color: 'white',
              border: 'none',
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
                <span>Envoi...</span>
              </>
            ) : (
              <>
                <span>✅</span>
                <span>Confirmer la demande</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleHtmlSecureWithdrawalConfirmation;