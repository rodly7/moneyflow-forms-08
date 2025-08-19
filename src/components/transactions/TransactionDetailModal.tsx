
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { X, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
  withdrawal_phone?: string;
  recipient_full_name?: string;
  recipient_phone?: string;
  sender_name?: string;
  fees?: number;
  userType?: 'agent' | 'user';
  impact: 'credit' | 'debit';
}

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isVisible: boolean;
  onClose: () => void;
}

const TransactionDetailModal = ({ transaction, isVisible, onClose }: TransactionDetailModalProps) => {
  const { toast } = useToast();

  if (!transaction || !isVisible) return null;

  const getTypeText = (type: string) => {
    switch (type) {
      case 'withdrawal':
        return 'Retrait';
      case 'transfer_sent':
        return 'Transfert envoyé';
      case 'transfer_received':
        return 'Transfert reçu';
      case 'deposit':
        return 'Dépôt';
      case 'bill_payment':
        return 'Paiement de facture';
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
    toast({
      title: "Copié",
      description: "Information copiée dans le presse-papiers"
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Détails de la transaction</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount */}
          <div className="text-center">
            <h3 className={`text-3xl font-bold ${
              transaction.impact === 'credit' ? 'text-green-600' : 'text-red-600'
            }`}>
              {transaction.impact === 'credit' ? '+' : '-'}
              {transaction.amount.toLocaleString()} {transaction.currency}
            </h3>
            {transaction.fees && transaction.fees > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Frais: {transaction.fees.toLocaleString()} XAF
              </p>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="font-medium">Type:</span>
              <span className="col-span-2">{getTypeText(transaction.type)}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="font-medium">Statut:</span>
              <div className="col-span-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 
                  transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {getStatusText(transaction.status)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 items-start">
              <span className="font-medium">ID:</span>
              <div className="col-span-2 flex items-center gap-2">
                <span className="font-mono text-xs break-all">{transaction.id}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(transaction.id)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="font-medium">Date:</span>
              <span className="col-span-2 text-sm">
                {format(transaction.date, 'PPP à HH:mm', { locale: fr })}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 items-start">
              <span className="font-medium">Description:</span>
              <span className="col-span-2 text-sm">{transaction.description}</span>
            </div>

            {/* Type-specific details */}
            {transaction.type === 'transfer_sent' && transaction.recipient_full_name && (
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="font-medium">Destinataire:</span>
                <span className="col-span-2 text-sm">{transaction.recipient_full_name}</span>
              </div>
            )}

            {transaction.type === 'transfer_sent' && transaction.recipient_phone && (
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="font-medium">Téléphone:</span>
                <span className="col-span-2 text-sm">{transaction.recipient_phone}</span>
              </div>
            )}

            {transaction.type === 'transfer_received' && transaction.sender_name && (
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="font-medium">Expéditeur:</span>
                <span className="col-span-2 text-sm">{transaction.sender_name}</span>
              </div>
            )}

            {transaction.type === 'withdrawal' && transaction.withdrawal_phone && (
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="font-medium">Numéro retrait:</span>
                <span className="col-span-2 text-sm">{transaction.withdrawal_phone}</span>
              </div>
            )}

            {transaction.verification_code && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900 mb-1">Code de vérification</p>
                    <p className="font-mono text-lg font-bold text-blue-900 tracking-wider">
                      {transaction.verification_code}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(transaction.verification_code!)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copier
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t">
          <Button onClick={onClose} className="w-full">
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;
