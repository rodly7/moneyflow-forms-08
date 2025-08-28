import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Trash2, 
  AlertTriangle, 
  FileText,
  Database,
  DollarSign,
  Activity,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

interface DataCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  downloadedAt?: Date | null;
  canReset: boolean;
}

export const DataResetManager = () => {
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<string | null>(null);
  const [dataCategories, setDataCategories] = useState<DataCategory[]>([
    {
      id: 'revenue-analytics',
      name: 'Revenus & Analytics',
      description: 'Toutes les données de revenus, commissions et statistiques',
      icon: <DollarSign className="w-5 h-5" />,
      downloadedAt: null,
      canReset: false
    },
    {
      id: 'transactions',
      name: 'Transactions',
      description: 'Historique complet des transferts, dépôts et retraits',
      icon: <Database className="w-5 h-5" />,
      downloadedAt: null,
      canReset: false
    },
    {
      id: 'traffic-subadmins',
      name: 'Trafic Sous-admins',
      description: 'Données d\'activité et de performance des sous-administrateurs',
      icon: <Activity className="w-5 h-5" />,
      downloadedAt: null,
      canReset: false
    },
    {
      id: 'user-data',
      name: 'Données Utilisateurs',
      description: 'Profils utilisateurs et données associées (sauf comptes actifs)',
      icon: <Users className="w-5 h-5" />,
      downloadedAt: null,
      canReset: false
    }
  ]);

  const generatePDFReport = async (categoryId: string) => {
    setIsGeneratingPDF(categoryId);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // En-tête
      doc.setFontSize(20);
      doc.text('Rapport de Données - SendFlow', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, 35);
      doc.text(`Catégorie: ${dataCategories.find(c => c.id === categoryId)?.name}`, 20, 45);
      
      let yPosition = 60;
      
      // Contenu selon la catégorie
      switch (categoryId) {
        case 'revenue-analytics':
          await addRevenueData(doc, yPosition);
          break;
        case 'transactions':
          await addTransactionData(doc, yPosition);
          break;
        case 'traffic-subadmins':
          await addSubAdminData(doc, yPosition);
          break;
        case 'user-data':
          await addUserData(doc, yPosition);
          break;
      }
      
      // Pied de page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Page ${i} sur ${pageCount}`, pageWidth - 20, doc.internal.pageSize.height - 10, { align: 'right' });
      }
      
      // Téléchargement
      const fileName = `sendflow-${categoryId}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      // Marquer comme téléchargé
      setDataCategories(prev => prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, downloadedAt: new Date(), canReset: true }
          : cat
      ));
      
      toast({
        title: "PDF généré avec succès",
        description: `Le rapport ${categoryId} a été téléchargé.`,
      });
      
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(null);
    }
  };

  const addRevenueData = async (doc: jsPDF, startY: number) => {
    // En-tête avec style
    doc.setFillColor(0, 102, 204);
    doc.rect(15, startY - 5, 180, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 REVENUS & ANALYTICS', 20, startY + 5);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    try {
      // Récupérer TOUTES les données de revenus avec jointures
      const { data: agentPerformance } = await supabase
        .from('agent_monthly_performance')
        .select(`
          *,
          profiles!agent_monthly_performance_agent_id_fkey(full_name, phone)
        `)
        .order('created_at', { ascending: false });
      
      const { data: commissions } = await supabase
        .from('agents')
        .select(`
          commission_balance, 
          user_id, 
          full_name, 
          transactions_count, 
          created_at,
          profiles!agents_user_id_fkey(full_name, phone)
        `)
        .gte('commission_balance', 0);
      
      const { data: adminDeposits } = await supabase
        .from('admin_deposits')
        .select('*')
        .order('created_at', { ascending: false });

      // Récupérer les rapports d'agents à la place
      const { data: agentReports } = await supabase
        .from('agent_reports')
        .select('*')
        .order('created_at', { ascending: false });

      let y = startY + 25;
      
      // RÉSUMÉ EXÉCUTIF avec encadré coloré
      doc.setFillColor(245, 245, 245);
      doc.rect(15, y - 5, 180, 50, 'F');
      doc.setDrawColor(0, 102, 204);
      doc.setLineWidth(1);
      doc.rect(15, y - 5, 180, 50, 'S');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.text('RÉSUMÉ EXÉCUTIF', 20, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      y += 15;
      
      const totalEarnings = agentPerformance?.reduce((sum, perf) => sum + Number(perf.total_earnings || 0), 0) || 0;
      const totalCommissions = commissions?.reduce((sum, c) => sum + Number(c.commission_balance), 0) || 0;
      const totalDeposits = adminDeposits?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0;
      const totalVolume = agentPerformance?.reduce((sum, perf) => sum + Number(perf.total_volume || 0), 0) || 0;
      
      doc.setFontSize(10);
      doc.text(`💰 Revenus totaux générés:`, 25, y);
      doc.setFont('helvetica', 'bold');
      doc.text(`${totalEarnings.toLocaleString('fr-FR')} XAF`, 130, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
      
      doc.text(`🎯 Commissions en attente:`, 25, y);
      doc.setFont('helvetica', 'bold');
      doc.text(`${totalCommissions.toLocaleString('fr-FR')} XAF`, 130, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
      
      doc.text(`🏦 Volume total traité:`, 25, y);
      doc.setFont('helvetica', 'bold');
      doc.text(`${totalVolume.toLocaleString('fr-FR')} XAF`, 130, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
      
      doc.text(`👥 Agents actifs:`, 25, y);
      doc.setFont('helvetica', 'bold');
      doc.text(`${commissions?.length || 0} agents`, 130, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
      
      doc.text(`📊 Dépôts administrateur:`, 25, y);
      doc.setFont('helvetica', 'bold');
      doc.text(`${totalDeposits.toLocaleString('fr-FR')} XAF`, 130, y);
      doc.setFont('helvetica', 'normal');
      y += 25;
      
      // PERFORMANCES AGENTS DÉTAILLÉES
      if (agentPerformance?.length) {
        doc.setFontSize(12);
        doc.setTextColor(0, 102, 204);
        doc.text(`📈 PERFORMANCES AGENTS (${agentPerformance.length} enregistrements)`, 20, y);
        doc.setTextColor(0, 0, 0);
        y += 15;
        
        // Tableau d'en-tête
        doc.setFontSize(9);
        doc.text('N°', 25, y);
        doc.text('Agent ID', 40, y);
        doc.text('Mois/Année', 85, y);
        doc.text('Vol. Total', 125, y);
        doc.text('Transactions', 155, y);
        doc.text('Gains (XAF)', 185, y);
        y += 5;
        
        // Ligne de séparation
        doc.line(20, y, 200, y);
        y += 8;
        
        agentPerformance.slice(0, 25).forEach((perf, index) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
            // Répéter l'en-tête
            doc.setFontSize(9);
            doc.text('N°', 25, y);
            doc.text('Agent ID', 40, y);
            doc.text('Mois/Année', 85, y);
            doc.text('Vol. Total', 125, y);
            doc.text('Transactions', 155, y);
            doc.text('Gains (XAF)', 185, y);
            y += 8;
          }
          
          const agentId = String(perf.agent_id).substring(0, 8) + '...';
          const monthYear = `${perf.month}/${perf.year}`;
          const volume = Number(perf.total_volume || 0).toLocaleString('fr-FR');
          const transactions = perf.total_transactions || 0;
          const earnings = Number(perf.total_earnings || 0).toLocaleString('fr-FR');
          
          doc.text(`${index + 1}`, 25, y);
          doc.text(agentId, 40, y);
          doc.text(monthYear, 85, y);
          doc.text(volume, 125, y);
          doc.text(`${transactions}`, 155, y);
          doc.text(earnings, 185, y);
          y += 5;
        });
        
        if (agentPerformance.length > 25) {
          y += 5;
          doc.setFontSize(8);
          doc.setTextColor(128, 128, 128);
          doc.text(`... et ${agentPerformance.length - 25} autres enregistrements`, 25, y);
          doc.setTextColor(0, 0, 0);
        }
      }
      
      // COMMISSIONS AGENTS
      if (commissions?.length) {
        if (y > 200) {
          doc.addPage();
          y = 20;
        }
        y += 20;
        
        doc.setFontSize(12);
        doc.setTextColor(0, 102, 204);
        doc.text(`💰 COMMISSIONS AGENTS (${commissions.length} agents)`, 20, y);
        doc.setTextColor(0, 0, 0);
        y += 15;
        
        // Tableau d'en-tête
        doc.setFontSize(9);
        doc.text('N°', 25, y);
        doc.text('Nom Agent', 40, y);
        doc.text('Commission (XAF)', 110, y);
        doc.text('Transactions', 155, y);
        doc.text('Date création', 185, y);
        y += 5;
        
        doc.line(20, y, 200, y);
        y += 8;
        
        commissions.slice(0, 20).forEach((comm, index) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          
          const name = (comm.full_name || 'Agent inconnu').substring(0, 20);
          const commission = Number(comm.commission_balance).toLocaleString('fr-FR');
          const transactions = comm.transactions_count || 0;
          const dateCreated = new Date(comm.created_at).toLocaleDateString('fr-FR');
          
          doc.text(`${index + 1}`, 25, y);
          doc.text(name, 40, y);
          doc.text(commission, 110, y);
          doc.text(`${transactions}`, 155, y);
          doc.text(dateCreated, 185, y);
          y += 5;
        });
      }

      // DÉPÔTS ADMINISTRATEUR
      if (adminDeposits?.length) {
        if (y > 180) {
          doc.addPage();
          y = 20;
        }
        y += 20;
        
        doc.setFontSize(12);
        doc.setTextColor(0, 102, 204);
        doc.text(`🏦 DÉPÔTS ADMINISTRATEUR (${adminDeposits.length} dépôts)`, 20, y);
        doc.setTextColor(0, 0, 0);
        y += 15;
        
        adminDeposits.slice(0, 15).forEach((deposit, index) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          
          const amount = Number(deposit.amount).toLocaleString('fr-FR');
          const currency = deposit.currency || 'XAF';
          const date = new Date(deposit.created_at).toLocaleDateString('fr-FR');
          const reference = deposit.reference_number || 'N/A';
          
          doc.setFontSize(9);
          doc.text(`${index + 1}. ${amount} ${currency} - ${date} (Ref: ${reference})`, 25, y);
          y += 5;
        });
      }
      
    } catch (error) {
      console.error('Erreur récupération données revenus:', error);
      doc.setTextColor(255, 0, 0);
      doc.text('❌ Erreur lors de la récupération des données de revenus', 20, startY + 20);
      doc.setTextColor(0, 0, 0);
    }
  };

  const addTransactionData = async (doc: jsPDF, startY: number) => {
    // En-tête avec style
    doc.setFillColor(220, 38, 127);
    doc.rect(15, startY - 5, 180, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('💳 DONNÉES DES TRANSACTIONS', 20, startY + 5);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    try {
      // Récupérer TOUTES les données de transactions
      const { data: transfers } = await supabase
        .from('transfers')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data: deposits } = await supabase
        .from('recharges')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: pendingTransfers } = await supabase
        .from('pending_transfers')
        .select('*')
        .order('created_at', { ascending: false });
      
      let y = startY + 20;
      
      // RÉSUMÉ STATISTIQUES
      doc.setFontSize(12);
      doc.setTextColor(51, 51, 51);
      doc.text('═══ STATISTIQUES GÉNÉRALES ═══', 20, y);
      y += 15;
      
      const transfersCompleted = transfers?.filter(t => t.status === 'completed').length || 0;
      const transfersPending = transfers?.filter(t => t.status === 'pending').length || 0;
      const withdrawalsCompleted = withdrawals?.filter(w => w.status === 'completed').length || 0;
      const withdrawalsPending = withdrawals?.filter(w => w.status === 'pending').length || 0;
      const depositsSuccess = deposits?.filter(d => d.status === 'completed').length || 0;
      
      const totalTransferAmount = transfers?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;
      const totalWithdrawAmount = withdrawals?.reduce((sum, w) => sum + Number(w.amount || 0), 0) || 0;
      const totalDepositAmount = deposits?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0;
      
      doc.setFontSize(10);
      doc.text(`📊 TRANSFERTS:`, 25, y);
      y += 6;
      doc.text(`  • Complétés: ${transfersCompleted} (${totalTransferAmount.toLocaleString('fr-FR')} XAF)`, 30, y);
      y += 5;
      doc.text(`  • En attente: ${transfersPending}`, 30, y);
      y += 5;
      doc.text(`  • En suspens: ${pendingTransfers?.length || 0}`, 30, y);
      y += 10;
      
      doc.text(`💸 RETRAITS:`, 25, y);
      y += 6;
      doc.text(`  • Complétés: ${withdrawalsCompleted} (${totalWithdrawAmount.toLocaleString('fr-FR')} XAF)`, 30, y);
      y += 5;
      doc.text(`  • En attente: ${withdrawalsPending}`, 30, y);
      y += 10;
      
      doc.text(`💰 DÉPÔTS:`, 25, y);
      y += 6;
      doc.text(`  • Réussis: ${depositsSuccess} (${totalDepositAmount.toLocaleString('fr-FR')} XAF)`, 30, y);
      y += 15;

      // DÉTAIL DES TRANSFERTS
      if (transfers?.length) {
        doc.setFontSize(12);
        doc.setTextColor(220, 38, 127);
        doc.text(`🔄 HISTORIQUE TRANSFERTS (${transfers.length} au total)`, 20, y);
        doc.setTextColor(0, 0, 0);
        y += 15;
        
        // En-tête tableau
        doc.setFontSize(8);
        doc.text('N°', 25, y);
        doc.text('Montant', 40, y);
        doc.text('Statut', 70, y);
        doc.text('Expéditeur', 95, y);
        doc.text('Destinataire', 135, y);
        doc.text('Date', 175, y);
        y += 5;
        
        doc.line(20, y, 200, y);
        y += 8;
        
        transfers.slice(0, 20).forEach((transfer, index) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
            // Répéter l'en-tête
            doc.text('N°', 25, y);
            doc.text('Montant', 40, y);
            doc.text('Statut', 70, y);
            doc.text('Expéditeur', 95, y);
            doc.text('Destinataire', 135, y);
            doc.text('Date', 175, y);
            y += 8;
          }
          
          const amount = Number(transfer.amount || 0).toLocaleString('fr-FR');
          const status = transfer.status || 'N/A';
          const senderId = String(transfer.sender_id).substring(0, 8) + '...';
          const recipientPhone = transfer.recipient_phone || 'N/A';
          const date = new Date(transfer.created_at).toLocaleDateString('fr-FR');
          
          doc.text(`${index + 1}`, 25, y);
          doc.text(`${amount}`, 40, y);
          doc.text(status, 70, y);
          doc.text(senderId, 95, y);
          doc.text(recipientPhone.substring(0, 12), 135, y);
          doc.text(date, 175, y);
          y += 5;
        });
      }

      // DÉTAIL DES RETRAITS
      if (withdrawals?.length) {
        if (y > 150) {
          doc.addPage();
          y = 20;
        }
        y += 20;
        
        doc.setFontSize(12);
        doc.setTextColor(220, 38, 127);
        doc.text(`💸 HISTORIQUE RETRAITS (${withdrawals.length} au total)`, 20, y);
        doc.setTextColor(0, 0, 0);
        y += 15;
        
        // En-tête tableau
        doc.setFontSize(8);
        doc.text('N°', 25, y);
        doc.text('Montant', 40, y);
        doc.text('Statut', 70, y);
        doc.text('Utilisateur', 95, y);
        doc.text('Téléphone', 135, y);
        doc.text('Date', 175, y);
        y += 5;
        
        doc.line(20, y, 200, y);
        y += 8;
        
        withdrawals.slice(0, 15).forEach((withdrawal, index) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          
          const amount = Number(withdrawal.amount || 0).toLocaleString('fr-FR');
          const status = withdrawal.status || 'N/A';
          const userId = String(withdrawal.user_id).substring(0, 8) + '...';
          const phone = withdrawal.withdrawal_phone || 'N/A';
          const date = new Date(withdrawal.created_at).toLocaleDateString('fr-FR');
          
          doc.text(`${index + 1}`, 25, y);
          doc.text(`${amount}`, 40, y);
          doc.text(status, 70, y);
          doc.text(userId, 95, y);
          doc.text(phone.substring(0, 12), 135, y);
          doc.text(date, 175, y);
          y += 5;
        });
      }

      // ANALYSE PAR PÉRIODE
      if (transfers?.length || withdrawals?.length) {
        if (y > 200) {
          doc.addPage();
          y = 20;
        }
        y += 20;
        
        doc.setFontSize(12);
        doc.setTextColor(220, 38, 127);
        doc.text('📈 ANALYSE PAR PÉRIODE', 20, y);
        doc.setTextColor(0, 0, 0);
        y += 15;
        
        // Transactions des 7 derniers jours
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        
        const recentTransfers = transfers?.filter(t => new Date(t.created_at) > last7Days).length || 0;
        const recentWithdrawals = withdrawals?.filter(w => new Date(w.created_at) > last7Days).length || 0;
        
        doc.setFontSize(10);
        doc.text('📅 Activité des 7 derniers jours:', 25, y);
        y += 8;
        doc.text(`  • Transferts: ${recentTransfers}`, 30, y);
        y += 6;
        doc.text(`  • Retraits: ${recentWithdrawals}`, 30, y);
      }
      
    } catch (error) {
      console.error('Erreur récupération transactions:', error);
      doc.setTextColor(255, 0, 0);
      doc.text('❌ Erreur lors de la récupération des données de transactions', 20, startY + 20);
      doc.setTextColor(0, 0, 0);
    }
  };

  const addSubAdminData = async (doc: jsPDF, startY: number) => {
    // En-tête avec style
    doc.setFillColor(16, 185, 129);
    doc.rect(15, startY - 5, 180, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('🚀 TRAFIC SOUS-ADMINISTRATEURS', 20, startY + 5);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    try {
      // Récupérer TOUTES les données des sous-admins
      const { data: subAdmins } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'sub_admin');
      
      const { data: userSessions } = await supabase
        .from('user_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: subAdminQuotas } = await supabase
        .from('sub_admin_quota_settings')
        .select('*');

      const { data: supportMessages } = await supabase
        .from('customer_support_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      let y = startY + 20;
      
      // RÉSUMÉ GÉNÉRAL
      doc.setFontSize(12);
      doc.setTextColor(51, 51, 51);
      doc.text('═══ RÉSUMÉ ACTIVITÉ SOUS-ADMINS ═══', 20, y);
      y += 15;
      
      const activeSessions = userSessions?.filter(s => s.is_active).length || 0;
      const totalSessions = userSessions?.length || 0;
      const supportTotal = supportMessages?.length || 0;
      const supportUnread = supportMessages?.filter(m => m.status === 'unread').length || 0;
      
      doc.setFontSize(10);
      doc.text(`👥 Sous-administrateurs actifs: ${subAdmins?.length || 0}`, 25, y);
      y += 8;
      doc.text(`📊 Sessions totales: ${totalSessions}`, 25, y);
      y += 6;
      doc.text(`🔴 Sessions actives: ${activeSessions}`, 25, y);
      y += 6;
      doc.text(`💬 Messages support: ${supportTotal} (${supportUnread} non lus)`, 25, y);
      y += 6;
      doc.text(`⚙️  Quotas configurés: ${subAdminQuotas?.length || 0}`, 25, y);
      y += 20;
      
      // DÉTAIL DES SOUS-ADMINS
      if (subAdmins?.length) {
        doc.setFontSize(12);
        doc.setTextColor(16, 185, 129);
        doc.text(`👤 PROFILS SOUS-ADMINISTRATEURS`, 20, y);
        doc.setTextColor(0, 0, 0);
        y += 15;
        
        // En-tête tableau
        doc.setFontSize(9);
        doc.text('N°', 25, y);
        doc.text('Nom Complet', 40, y);
        doc.text('Téléphone', 100, y);
        doc.text('Pays', 135, y);
        doc.text('Date Création', 155, y);
        doc.text('Statut', 185, y);
        y += 5;
        
        doc.line(20, y, 200, y);
        y += 8;
        
        subAdmins.forEach((admin, index) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
            // Répéter l'en-tête
            doc.setFontSize(9);
            doc.text('N°', 25, y);
            doc.text('Nom Complet', 40, y);
            doc.text('Téléphone', 100, y);
            doc.text('Pays', 135, y);
            doc.text('Date Création', 155, y);
            doc.text('Statut', 185, y);
            y += 8;
          }
          
          const fullName = (admin.full_name || 'Non défini').substring(0, 15);
          const phone = admin.phone || 'N/A';
          const country = (admin.country || 'N/A').substring(0, 8);
          const createdDate = new Date(admin.created_at).toLocaleDateString('fr-FR');
          const status = admin.is_banned ? '🔴 Banni' : '🟢 Actif';
          
          doc.text(`${index + 1}`, 25, y);
          doc.text(fullName, 40, y);
          doc.text(phone, 100, y);
          doc.text(country, 135, y);
          doc.text(createdDate, 155, y);
          doc.text(status, 185, y);
          y += 5;
        });
      }

      // ANALYSE DES SESSIONS
      if (userSessions?.length) {
        if (y > 150) {
          doc.addPage();
          y = 20;
        }
        y += 20;
        
        doc.setFontSize(12);
        doc.setTextColor(16, 185, 129);
        doc.text(`📱 HISTORIQUE SESSIONS (${userSessions.length} au total)`, 20, y);
        doc.setTextColor(0, 0, 0);
        y += 15;
        
        // Analyse par statut
        const last24h = new Date();
        last24h.setHours(last24h.getHours() - 24);
        const recentSessions = userSessions.filter(s => new Date(s.created_at) > last24h).length;
        
        doc.setFontSize(10);
        doc.text(`📈 Activité dernières 24h: ${recentSessions} nouvelles sessions`, 25, y);
        y += 10;
        
        // Détail des sessions récentes
        doc.setFontSize(9);
        doc.text('N°', 25, y);
        doc.text('Utilisateur', 40, y);
        doc.text('Date Début', 90, y);
        doc.text('Dernière Activité', 130, y);
        doc.text('Statut', 180, y);
        y += 5;
        
        doc.line(20, y, 200, y);
        y += 8;
        
        userSessions.slice(0, 15).forEach((session, index) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          
          const userId = String(session.user_id).substring(0, 8) + '...';
          const startDate = new Date(session.created_at).toLocaleDateString('fr-FR');
          const lastActivity = session.last_activity ? 
            new Date(session.last_activity).toLocaleDateString('fr-FR') : 'N/A';
          const status = session.is_active ? '🟢 Active' : '🔴 Inactive';
          
          doc.text(`${index + 1}`, 25, y);
          doc.text(userId, 40, y);
          doc.text(startDate, 90, y);
          doc.text(lastActivity, 130, y);
          doc.text(status, 180, y);
          y += 5;
        });
      }

      // QUOTAS ET LIMITES
      if (subAdminQuotas?.length) {
        if (y > 200) {
          doc.addPage();
          y = 20;
        }
        y += 20;
        
        doc.setFontSize(12);
        doc.setTextColor(16, 185, 129);
        doc.text(`⚙️  CONFIGURATION QUOTAS`, 20, y);
        doc.setTextColor(0, 0, 0);
        y += 15;
        
        subAdminQuotas.forEach((quota, index) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          
          const subAdminId = String(quota.sub_admin_id).substring(0, 8) + '...';
          const dailyLimit = quota.daily_limit || 'Non défini';
          const usedToday = 0; // Quota usage tracking not implemented in current schema
          
          doc.setFontSize(10);
          doc.text(`${index + 1}. Sous-admin: ${subAdminId}`, 25, y);
          y += 5;
          doc.text(`   Limite journalière: ${dailyLimit}`, 30, y);
          y += 5;
          doc.text(`   Utilisé aujourd'hui: ${usedToday}`, 30, y);
          y += 8;
        });
      }
      
    } catch (error) {
      console.error('Erreur récupération sous-admins:', error);
      doc.setTextColor(255, 0, 0);
      doc.text('❌ Erreur lors de la récupération des données sous-admins', 20, startY + 20);
      doc.setTextColor(0, 0, 0);
    }
  };

  const addUserData = async (doc: jsPDF, startY: number) => {
    // En-tête avec style
    doc.setFillColor(147, 51, 234);
    doc.rect(15, startY - 5, 180, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('👥 DONNÉES UTILISATEURS', 20, startY + 5);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    try {
      // Récupérer TOUTES les données utilisateurs
      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user');
      
      const { data: agents } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'agent');

      const { data: kycVerifications } = await supabase
        .from('kyc_verifications')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: supportMessages } = await supabase
        .from('customer_support_messages')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: identityVerifications } = await supabase
        .from('identity_verifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      let y = startY + 20;
      
      // RÉSUMÉ GÉNÉRAL
      doc.setFontSize(12);
      doc.setTextColor(51, 51, 51);
      doc.text('═══ RÉSUMÉ BASE UTILISATEURS ═══', 20, y);
      y += 15;
      
      const totalBalance = [...(users || []), ...(agents || [])].reduce((sum, u) => sum + Number(u.balance || 0), 0);
      const verifiedUsers = users?.filter(u => u.is_verified).length || 0;
      const bannedUsers = [...(users || []), ...(agents || [])].filter(u => u.is_banned).length;
      
      doc.setFontSize(10);
      doc.text(`👤 Utilisateurs réguliers: ${users?.length || 0}`, 25, y);
      y += 6;
      doc.text(`🏢 Agents: ${agents?.length || 0}`, 25, y);
      y += 6;
      doc.text(`✅ Utilisateurs vérifiés: ${verifiedUsers}`, 25, y);
      y += 6;
      doc.text(`🚫 Utilisateurs bannis: ${bannedUsers}`, 25, y);
      y += 6;
      doc.text(`💰 Solde total utilisateurs: ${totalBalance.toLocaleString('fr-FR')} XAF`, 25, y);
      y += 15;

      // VÉRIFICATIONS KYC DÉTAILLÉES
      if (kycVerifications?.length) {
        const approvedKyc = kycVerifications.filter(k => k.status === 'approved').length;
        const pendingKyc = kycVerifications.filter(k => k.status === 'pending').length;
        const rejectedKyc = kycVerifications.filter(k => k.status === 'rejected').length;
        
        doc.setFontSize(12);
        doc.setTextColor(147, 51, 234);
        doc.text(`🆔 VÉRIFICATIONS KYC (${kycVerifications.length} au total)`, 20, y);
        doc.setTextColor(0, 0, 0);
        y += 15;
        
        doc.setFontSize(10);
        doc.text(`📊 Répartition des statuts:`, 25, y);
        y += 8;
        doc.text(`  • ✅ Approuvées: ${approvedKyc} (${((approvedKyc/kycVerifications.length)*100).toFixed(1)}%)`, 30, y);
        y += 6;
        doc.text(`  • ⏳ En attente: ${pendingKyc} (${((pendingKyc/kycVerifications.length)*100).toFixed(1)}%)`, 30, y);
        y += 6;
        doc.text(`  • ❌ Rejetées: ${rejectedKyc} (${((rejectedKyc/kycVerifications.length)*100).toFixed(1)}%)`, 30, y);
        y += 15;
        
        // Détails des KYC récentes
        doc.setFontSize(9);
        doc.text('N°', 25, y);
        doc.text('Utilisateur', 40, y);
        doc.text('Statut', 85, y);
        doc.text('Type Document', 115, y);
        doc.text('Score Vérif.', 155, y);
        doc.text('Date', 180, y);
        y += 5;
        
        doc.line(20, y, 200, y);
        y += 8;
        
        kycVerifications.slice(0, 15).forEach((kyc, index) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          
          const userId = String(kyc.user_id).substring(0, 8) + '...';
          const status = kyc.status === 'approved' ? '✅' : kyc.status === 'pending' ? '⏳' : '❌';
          const docType = (kyc.id_document_type || 'N/A').substring(0, 10);
          const score = kyc.verification_score ? `${Number(kyc.verification_score).toFixed(1)}%` : 'N/A';
          const date = new Date(kyc.created_at).toLocaleDateString('fr-FR');
          
          doc.text(`${index + 1}`, 25, y);
          doc.text(userId, 40, y);
          doc.text(status, 85, y);
          doc.text(docType, 115, y);
          doc.text(score, 155, y);
          doc.text(date, 180, y);
          y += 5;
        });
      }

      // SUPPORT CLIENT ANALYSE
      if (supportMessages?.length) {
        if (y > 120) {
          doc.addPage();
          y = 20;
        }
        y += 20;
        
        const unreadMessages = supportMessages.filter(m => m.status === 'unread').length;
        const respondedMessages = supportMessages.filter(m => m.status === 'responded').length;
        const resolvedMessages = supportMessages.filter(m => m.status === 'resolved').length;
        
        doc.setFontSize(12);
        doc.setTextColor(147, 51, 234);
        doc.text(`💬 SUPPORT CLIENT (${supportMessages.length} messages)`, 20, y);
        doc.setTextColor(0, 0, 0);
        y += 15;
        
        doc.setFontSize(10);
        doc.text(`📈 Répartition des statuts:`, 25, y);
        y += 8;
        doc.text(`  • 🔴 Non lus: ${unreadMessages}`, 30, y);
        y += 6;
        doc.text(`  • 💬 Répondus: ${respondedMessages}`, 30, y);
        y += 6;
        doc.text(`  • ✅ Résolus: ${resolvedMessages}`, 30, y);
        y += 15;
        
        // Messages récents par catégorie
        const categories = [...new Set(supportMessages.map(m => m.category || 'general'))];
        doc.text(`📂 Messages par catégorie:`, 25, y);
        y += 8;
        categories.forEach(category => {
          const count = supportMessages.filter(m => (m.category || 'general') === category).length;
          doc.text(`  • ${category}: ${count}`, 30, y);
          y += 5;
        });
      }

      // VÉRIFICATIONS D'IDENTITÉ
      if (identityVerifications?.length) {
        if (y > 180) {
          doc.addPage();
          y = 20;
        }
        y += 20;
        
        const approvedIds = identityVerifications.filter(i => i.status === 'approved').length;
        const pendingIds = identityVerifications.filter(i => i.status === 'pending').length;
        const rejectedIds = identityVerifications.filter(i => i.status === 'rejected').length;
        
        doc.setFontSize(12);
        doc.setTextColor(147, 51, 234);
        doc.text(`🆔 VÉRIFICATIONS IDENTITÉ (${identityVerifications.length})`, 20, y);
        doc.setTextColor(0, 0, 0);
        y += 15;
        
        doc.setFontSize(10);
        doc.text(`  • Approuvées: ${approvedIds}`, 30, y);
        y += 6;
        doc.text(`  • En attente: ${pendingIds}`, 30, y);
        y += 6;
        doc.text(`  • Rejetées: ${rejectedIds}`, 30, y);
      }

      // ANALYSE TEMPORELLE
      if (users?.length) {
        if (y > 220) {
          doc.addPage();
          y = 20;
        }
        y += 20;
        
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        const recentUsers = users.filter(u => new Date(u.created_at) > last30Days).length;
        
        doc.setFontSize(12);
        doc.setTextColor(147, 51, 234);
        doc.text('📅 ANALYSE TEMPORELLE', 20, y);
        doc.setTextColor(0, 0, 0);
        y += 15;
        
        doc.setFontSize(10);
        doc.text(`📈 Nouveaux utilisateurs (30 derniers jours): ${recentUsers}`, 25, y);
        y += 6;
        doc.text(`📊 Taux de croissance: ${((recentUsers/users.length)*100).toFixed(1)}%`, 25, y);
      }
      
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      doc.setTextColor(255, 0, 0);
      doc.text('❌ Erreur lors de la récupération des données utilisateurs', 20, startY + 20);
      doc.setTextColor(0, 0, 0);
    }
  };

  const resetData = async (categoryId: string) => {
    setIsResetting(categoryId);
    
    try {
      const category = dataCategories.find(c => c.id === categoryId);
      if (!category?.canReset) {
        toast({
          title: "Erreur",
          description: "Vous devez d'abord télécharger le PDF avant de réinitialiser.",
          variant: "destructive"
        });
        return;
      }
      
      // Réinitialisation réelle des données
      switch (categoryId) {
        case 'revenue-analytics':
          // Supprimer toutes les performances mensuelles des agents
          await supabase
            .from('agent_monthly_performance')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
          
          // Réinitialiser les soldes de commission des agents
          await supabase
            .from('agents')
            .update({ commission_balance: 0, transactions_count: 0 })
            .neq('id', '00000000-0000-0000-0000-000000000000');
          
          // Supprimer les rapports d'agents
          await supabase
            .from('agent_reports')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
          break;
          
        case 'transactions':
          // Supprimer toutes les transactions complétées
          await supabase
            .from('transfers')
            .delete()
            .eq('status', 'completed');
          
          // Supprimer tous les retraits complétés  
          await supabase
            .from('withdrawals')
            .delete()
            .eq('status', 'completed');
          
          // Supprimer toutes les recharges complétées
          await supabase
            .from('recharges')
            .delete()
            .eq('status', 'completed');
          
          // Supprimer les transferts en attente expirés
          await supabase
            .from('pending_transfers')
            .delete()
            .lt('expires_at', new Date().toISOString());
          break;
          
        case 'traffic-subadmins':
          // Supprimer toutes les sessions utilisateurs inactives
          await supabase
            .from('user_sessions')
            .delete()
            .eq('is_active', false);
          
          // Désactiver toutes les sessions actives
          await supabase
            .from('user_sessions')
            .update({ is_active: false })
            .eq('is_active', true);
          
          // Supprimer les quotas de sous-admins
          await supabase
            .from('sub_admin_quota_settings')
            .update({ daily_limit: 300, current_usage: 0 })
            .neq('id', '00000000-0000-0000-0000-000000000000');
          break;
          
        case 'user-data':
          // Supprimer les vérifications KYC rejetées et en attente
          await supabase
            .from('kyc_verifications')
            .delete()
            .in('status', ['rejected', 'pending']);
          
          // Supprimer les vérifications d'identité obsolètes
          await supabase
            .from('identity_verifications')
            .delete()
            .in('status', ['rejected', 'pending']);
          
          // Supprimer les demandes de support anciennes résolues
          await supabase
            .from('customer_support_messages')
            .delete()
            .eq('status', 'resolved')
            .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
          
          // Réinitialiser les limites de taux pour tous les utilisateurs
          await supabase
            .from('rate_limits')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
          break;
      }
      
      // Marquer comme réinitialisé
      setDataCategories(prev => prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, downloadedAt: null, canReset: false }
          : cat
      ));
      
      toast({
        title: "Réinitialisation réussie",
        description: `Les données ${category.name} ont été réinitialisées.`,
      });
      
    } catch (error) {
      console.error('Erreur réinitialisation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de réinitialiser les données. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsResetting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Database className="w-6 h-6 text-destructive" />
        <div>
          <h2 className="text-xl font-semibold">Réinitialisation des Données</h2>
          <p className="text-sm text-muted-foreground">
            Téléchargez un rapport PDF avant de pouvoir réinitialiser les données
          </p>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Attention :</strong> La réinitialisation des données est irréversible. 
          Vous devez obligatoirement télécharger le rapport PDF avant de pouvoir procéder.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {dataCategories.map((category) => (
          <Card key={category.id} className="border-l-4 border-l-destructive">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {category.icon}
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground font-normal">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {category.downloadedAt && (
                    <Badge variant="outline" className="text-green-700 border-green-200">
                      PDF téléchargé
                    </Badge>
                  )}
                  {category.canReset && (
                    <Badge variant="destructive">
                      Prêt à réinitialiser
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {category.downloadedAt ? (
                  <span>PDF téléchargé le {category.downloadedAt.toLocaleDateString('fr-FR')}</span>
                ) : (
                  <span>Aucun PDF téléchargé</span>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generatePDFReport(category.id)}
                  disabled={isGeneratingPDF === category.id}
                  className="flex items-center gap-2"
                >
                  {isGeneratingPDF === category.id ? (
                    <>
                      <FileText className="w-4 h-4 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Télécharger PDF
                    </>
                  )}
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => resetData(category.id)}
                  disabled={!category.canReset || isResetting === category.id}
                  className="flex items-center gap-2"
                >
                  {isResetting === category.id ? (
                    <>
                      <Trash2 className="w-4 h-4 animate-spin" />
                      Réinitialisation...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Réinitialiser
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};