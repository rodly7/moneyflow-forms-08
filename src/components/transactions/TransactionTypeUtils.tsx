
import { Download, ArrowUpRight, ArrowDownLeft, CreditCard, Receipt, Plus, Clock, Settings } from "lucide-react";

export const getTransactionIcon = (type: string, impact: string) => {
  switch (type) {
    case 'withdrawal':
      return <Download className="w-5 h-5 text-red-600" />;
    case 'transfer_sent':
      return <ArrowUpRight className="w-5 h-5 text-orange-600" />;
    case 'transfer_received':
      return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
    case 'transfer_pending':
      return <Clock className="w-5 h-5 text-yellow-600" />;
    case 'deposit':
      return <Plus className="w-5 h-5 text-blue-600" />;
    case 'bill_payment':
      return <Receipt className="w-5 h-5 text-purple-600" />;
    case 'agent_deposit':
      return <Plus className="w-5 h-5 text-cyan-600" />;
    case 'agent_withdrawal':
      return <Download className="w-5 h-5 text-pink-600" />;
    default:
      return <Settings className="w-5 h-5 text-gray-600" />;
  }
};

export const getTransactionTypeLabel = (type: string) => {
  switch (type) {
    case 'withdrawal':
      return 'Retrait';
    case 'transfer_sent':
      return 'Transfert envoyé';
    case 'transfer_received':
      return 'Transfert reçu';
    case 'transfer_pending':
      return 'Transfert en attente';
    case 'deposit':
      return 'Dépôt';
    case 'bill_payment':
      return 'Paiement facture';
    case 'agent_deposit':
      return 'Dépôt agent';
    case 'agent_withdrawal':
      return 'Retrait agent';
    case 'recharge':
      return 'Recharge';
    default:
      return type;
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Complété';
    case 'pending':
      return 'En attente';
    case 'failed':
      return 'Échoué';
    case 'cancelled':
      return 'Annulé';
    default:
      return status;
  }
};
