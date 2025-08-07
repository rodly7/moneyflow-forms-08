import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: Date;
  description: string;
  currency: string;
  status: string;
  verification_code?: string;
  created_at?: string;
  showCode?: boolean;
  userType?: 'agent' | 'user';
  recipient_full_name?: string;
  recipient_phone?: string;
  withdrawal_phone?: string;
  fees?: number;
  sender_id?: string;
}

interface SimpleTransactionDetailProps {
  transaction: Transaction | null;
  isVisible: boolean;
  onClose: () => void;
}

const SimpleTransactionDetail = ({ transaction, isVisible, onClose }: SimpleTransactionDetailProps) => {
  if (!transaction || !isVisible) return null;

  const getTypeText = (type: string) => {
    switch (type) {
      case 'withdrawal':
        return 'Retrait';
      case 'transfer':
        return 'Transfert';
      case 'deposit':
        return 'Dépôt';
      default:
        return type;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Complété';
      case 'pending':
        return 'En attente';
      case 'failed':
        return 'Échoué';
      default:
        return status;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copié dans le presse-papiers");
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80%',
        overflow: 'auto',
        border: '1px solid #ccc'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            Détails de la transaction
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '30px',
              height: '30px'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: transaction.amount > 0 ? 'green' : 'red',
            textAlign: 'center',
            margin: '0 0 10px 0'
          }}>
            {transaction.amount > 0 ? '+' : ''}
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: transaction.currency || 'XAF',
              maximumFractionDigits: 0
            }).format(transaction.amount)}
          </h3>
          {transaction.fees && transaction.fees > 0 && (
            <p style={{ textAlign: 'center', color: '#666', margin: 0 }}>
              Frais: {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: transaction.currency || 'XAF',
                maximumFractionDigits: 0
              }).format(transaction.fees)}
            </p>
          )}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 0', fontWeight: 'bold', verticalAlign: 'top' }}>Type:</td>
              <td style={{ padding: '8px 0' }}>{getTypeText(transaction.type)}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontWeight: 'bold', verticalAlign: 'top' }}>Statut:</td>
              <td style={{ padding: '8px 0' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: transaction.status === 'completed' ? '#d4edda' : 
                                 transaction.status === 'pending' ? '#fff3cd' : '#f8d7da',
                  color: transaction.status === 'completed' ? '#155724' : 
                         transaction.status === 'pending' ? '#856404' : '#721c24'
                }}>
                  {getStatusText(transaction.status)}
                </span>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontWeight: 'bold', verticalAlign: 'top' }}>ID:</td>
              <td style={{ padding: '8px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>
                    {transaction.id}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(transaction.id)}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #ccc',
                      backgroundColor: '#f8f9fa',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    Copier
                  </button>
                </div>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontWeight: 'bold', verticalAlign: 'top' }}>Date:</td>
              <td style={{ padding: '8px 0' }}>
                {format(transaction.date, 'PPPP à HH:mm', { locale: fr })}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontWeight: 'bold', verticalAlign: 'top' }}>Description:</td>
              <td style={{ padding: '8px 0' }}>{transaction.description}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontWeight: 'bold', verticalAlign: 'top' }}>Devise:</td>
              <td style={{ padding: '8px 0' }}>{transaction.currency || 'XAF'}</td>
            </tr>
            {transaction.userType && (
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold', verticalAlign: 'top' }}>Utilisateur:</td>
                <td style={{ padding: '8px 0' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: transaction.userType === 'agent' ? '#e1d4f3' : '#d1ecf1',
                    color: transaction.userType === 'agent' ? '#6f42c1' : '#0c5460'
                  }}>
                    {transaction.userType === 'agent' ? 'Agent' : 'Utilisateur'}
                  </span>
                </td>
              </tr>
            )}
            {transaction.type === 'transfer' && transaction.recipient_full_name && (
              <>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold', verticalAlign: 'top' }}>Destinataire:</td>
                  <td style={{ padding: '8px 0' }}>{transaction.recipient_full_name}</td>
                </tr>
                {transaction.recipient_phone && (
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold', verticalAlign: 'top' }}>Téléphone:</td>
                    <td style={{ padding: '8px 0' }}>{transaction.recipient_phone}</td>
                  </tr>
                )}
              </>
            )}
            {transaction.type === 'withdrawal' && transaction.withdrawal_phone && (
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold', verticalAlign: 'top' }}>Numéro retrait:</td>
                <td style={{ padding: '8px 0' }}>{transaction.withdrawal_phone}</td>
              </tr>
            )}
          </tbody>
        </table>

        {transaction.verification_code && transaction.showCode && (
          <div style={{
            padding: '15px',
            backgroundColor: '#e3f2fd',
            border: '1px solid #90caf9',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>
              Code de vérification (valide 5 min)
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '24px',
                fontWeight: 'bold',
                letterSpacing: '4px',
                color: '#1976d2'
              }}>
                {transaction.verification_code}
              </span>
              <button 
                onClick={() => copyToClipboard(transaction.verification_code!)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #1976d2',
                  backgroundColor: 'white',
                  color: '#1976d2',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                Copier Code
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleTransactionDetail;