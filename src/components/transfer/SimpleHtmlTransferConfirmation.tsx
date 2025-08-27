import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { formatCurrency, calculateFee } from "@/lib/utils/currency";
import { useAuth } from "@/contexts/AuthContext";

interface SimpleHtmlTransferConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  recipientFullName: string;
  recipientPhone: string;
  isLoading: boolean;
}

const SimpleHtmlTransferConfirmation: React.FC<SimpleHtmlTransferConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  amount,
  recipientFullName,
  recipientPhone,
  isLoading
}) => {
  const { profile } = useAuth();

  if (!isOpen) {
    return null;
  }

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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px'
        }}>
          <span style={{ fontSize: '20px' }}>❓</span>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            margin: 0,
            color: '#374151'
          }}>
            Confirmer le transfert
          </h2>
        </div>

        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '24px',
          margin: 0
        }}>
          Voulez-vous vraiment transférer {formatCurrency(amount, 'XAF')} à {recipientFullName} ({recipientPhone}) ?
        </p>

        <div style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Votre solde:</span>
            <span style={{ fontWeight: 'bold' }}>{formatCurrency(profile?.balance || 0, 'XAF')}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Frais de transfert:</span>
            <span style={{ fontWeight: 'bold' }}>{formatCurrency(calculateFee(amount, profile?.country || 'Cameroun', 'Cameroun').fee, 'XAF')}</span>
          </div>
          <div style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: '8px',
            marginTop: '8px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Montant total:</span>
              <span style={{ fontWeight: 'bold' }}>{formatCurrency(amount + calculateFee(amount, profile?.country || 'Cameroun', 'Cameroun').fee, 'XAF')}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              height: '48px',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Annuler
          </button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              width: '100%',
              height: '48px',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" style={{ width: '16px', height: '16px' }} />
                <span>Confirmation...</span>
              </>
            ) : 'Confirmer'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleHtmlTransferConfirmation;
