
import jsPDF from 'jspdf';
import { formatCurrency } from "@/integrations/supabase/client";

interface TransactionData {
  id: string;
  type: 'transfer' | 'withdrawal' | 'deposit' | 'savings';
  amount: number;
  recipient_name?: string;
  recipient_phone?: string;
  created_at: string;
  status: string;
  fees?: number;
}

interface UserData {
  full_name: string;
  phone: string;
  country: string;
}

export const generateReceipt = (transaction: TransactionData, user: UserData) => {
  const doc = new jsPDF();
  
  // En-tête
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('SENDFLOW', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('Reçu de transaction', 105, 30, { align: 'center' });
  
  // Ligne de séparation
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 35, 190, 35);
  
  // Informations de transaction
  let yPos = 50;
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('RÉFÉRENCE TRANSACTION', 20, yPos);
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  doc.text(transaction.id.substring(0, 8).toUpperCase(), 20, yPos + 5);
  
  yPos += 20;
  
  // Type de transaction
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('TYPE', 20, yPos);
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  const typeMap = {
    transfer: 'Transfert',
    withdrawal: 'Retrait',
    deposit: 'Dépôt',
    savings: 'Épargne'
  };
  doc.text(typeMap[transaction.type] || transaction.type, 20, yPos + 5);
  
  yPos += 20;
  
  // Montant
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('MONTANT', 20, yPos);
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(formatCurrency(transaction.amount, "XAF"), 20, yPos + 8);
  
  yPos += 25;
  
  // Frais (si applicable)
  if (transaction.fees && transaction.fees > 0) {
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('FRAIS', 20, yPos);
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.text(formatCurrency(transaction.fees, "XAF"), 20, yPos + 5);
    yPos += 20;
  }
  
  // Bénéficiaire (pour les transferts)
  if (transaction.recipient_name) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('BÉNÉFICIAIRE', 20, yPos);
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.text(transaction.recipient_name, 20, yPos + 5);
    if (transaction.recipient_phone) {
      doc.text(transaction.recipient_phone, 20, yPos + 12);
    }
    yPos += 25;
  }
  
  // Expéditeur
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('EXPÉDITEUR', 20, yPos);
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  doc.text(user.full_name || 'Non défini', 20, yPos + 5);
  doc.text(user.phone, 20, yPos + 12);
  doc.text(user.country || 'Non défini', 20, yPos + 19);
  
  yPos += 35;
  
  // Date et statut
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('DATE', 20, yPos);
  doc.text('STATUT', 120, yPos);
  
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  const date = new Date(transaction.created_at).toLocaleString('fr-FR');
  doc.text(date, 20, yPos + 5);
  
  // Couleur du statut
  if (transaction.status === 'completed') {
    doc.setTextColor(34, 197, 94); // vert
  } else if (transaction.status === 'pending') {
    doc.setTextColor(234, 179, 8); // jaune
  } else {
    doc.setTextColor(239, 68, 68); // rouge
  }
  doc.text(transaction.status.toUpperCase(), 120, yPos + 5);
  
  // Pied de page
  yPos += 30;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, 190, yPos);
  
  yPos += 10;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Reçu généré le ' + new Date().toLocaleString('fr-FR'), 105, yPos, { align: 'center' });
  doc.text('SendFlow - Service de transfert d\'argent', 105, yPos + 8, { align: 'center' });
  
  return doc;
};

export const downloadReceipt = (doc: jsPDF, transactionId: string) => {
  doc.save(`recu-${transactionId.substring(0, 8)}.pdf`);
};
