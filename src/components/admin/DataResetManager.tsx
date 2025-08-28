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
    // Design moderne avec dégradé professionnel
    const gradient = doc.internal.pageSize.width;
    
    // En-tête principal avec design premium
    doc.setFillColor(16, 24, 40); // Slate-900
    doc.rect(5, startY - 12, 200, 30, 'F');
    
    // Bordure dorée pour l'élégance
    doc.setDrawColor(255, 193, 7); // Couleur or
    doc.setLineWidth(2);
    doc.rect(5, startY - 12, 200, 30, 'S');
    
    // Logo et titre avec style premium
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('💰 SENDFLOW - RAPPORT EXÉCUTIF REVENUS', 105, startY - 2, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Analyse Complète des Performances Financières', 105, startY + 8, { align: 'center' });
    
    let y = startY + 30;
    
    try {
      // Récupérer TOUTES les données avec requêtes détaillées
      const { data: agentPerformance } = await supabase
        .from('agent_monthly_performance')
        .select(`
          *,
          profiles!agent_monthly_performance_agent_id_fkey(full_name, phone, country, role)
        `)
        .order('total_earnings', { ascending: false });
      
      const { data: commissions } = await supabase
        .from('agents')
        .select('*')
        .order('commission_balance', { ascending: false });
      
      const { data: adminDeposits } = await supabase
        .from('admin_deposits')
        .select('*')
        .order('amount', { ascending: false });

      const { data: agentReports } = await supabase
        .from('agent_reports')
        .select('*')
        .order('created_at', { ascending: false });

      // SECTION 1: TABLEAU DE BORD EXÉCUTIF AVANCÉ
      doc.setFillColor(248, 250, 252);
      doc.rect(10, y - 8, 190, 85, 'F');
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(2);
      doc.rect(10, y - 8, 190, 85, 'S');
      
      // En-tête section avec icône
      doc.setFillColor(37, 99, 235);
      doc.rect(10, y - 8, 190, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('📊 TABLEAU DE BORD EXÉCUTIF - INDICATEURS CLÉS', 105, y + 2, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      y += 25;
      
      // Calculs détaillés
      const totalEarnings = agentPerformance?.reduce((sum, perf) => sum + Number(perf.total_earnings || 0), 0) || 0;
      const totalCommissions = commissions?.reduce((sum, c) => sum + Number(c.commission_balance), 0) || 0;
      const totalDeposits = adminDeposits?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0;
      const totalVolume = agentPerformance?.reduce((sum, perf) => sum + Number(perf.total_volume || 0), 0) || 0;
      const totalWithdrawals = agentPerformance?.reduce((sum, perf) => sum + Number(perf.withdrawals_volume || 0), 0) || 0;
      const totalTransactions = agentPerformance?.reduce((sum, perf) => sum + Number(perf.total_transactions || 0), 0) || 0;
      const avgCommissionRate = agentPerformance?.reduce((sum, perf) => sum + Number(perf.commission_rate || 0), 0) / (agentPerformance?.length || 1) || 0;
      
      // Design en cartes avec métriques visuelles
      doc.setFontSize(10);
      
      // Carte 1: Finances
      doc.setFillColor(220, 252, 231); // Vert clair
      doc.rect(20, y - 3, 80, 35, 'F');
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(1);
      doc.rect(20, y - 3, 80, 35, 'S');
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 101, 52);
      doc.text('💰 PERFORMANCE FINANCIÈRE', 25, y + 3);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      y += 8;
      
      doc.text(`● Revenus totaux générés:`, 25, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 101, 52);
      doc.text(`${totalEarnings.toLocaleString('fr-FR')} XAF`, 25, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      y += 8;
      
      doc.text(`● Commissions en attente:`, 25, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(251, 146, 60);
      doc.text(`${totalCommissions.toLocaleString('fr-FR')} XAF`, 25, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      y += 8;
      
      doc.text(`● Volume total traité:`, 25, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text(`${totalVolume.toLocaleString('fr-FR')} XAF`, 25, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Carte 2: Opérations
      y -= 35;
      doc.setFillColor(254, 240, 138); // Jaune clair
      doc.rect(110, y - 3, 80, 35, 'F');
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(1);
      doc.rect(110, y - 3, 80, 35, 'S');
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(146, 64, 14);
      doc.text('📊 ACTIVITÉ OPÉRATIONNELLE', 115, y + 3);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      y += 8;
      
      doc.text(`● Total transactions:`, 115, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(147, 51, 234);
      doc.text(`${totalTransactions.toLocaleString('fr-FR')}`, 115, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      y += 8;
      
      doc.text(`● Agents actifs:`, 115, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 197, 94);
      doc.text(`${commissions?.length || 0} agents`, 115, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      y += 8;
      
      doc.text(`● Taux commission moyen:`, 115, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text(`${(avgCommissionRate * 100).toFixed(2)}%`, 115, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      y += 20;
      
      // SECTION 2: PERFORMANCES AGENTS DÉTAILLÉES
      if (agentPerformance?.length) {
        doc.setFillColor(254, 249, 195);
        doc.rect(15, y - 5, 180, 15, 'F');
        doc.setDrawColor(251, 191, 36);
        doc.setLineWidth(1);
        doc.rect(15, y - 5, 180, 15, 'S');
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(180, 83, 9);
        doc.text(`🎯 ANALYSE DÉTAILLÉE - PERFORMANCES AGENTS (${agentPerformance.length} records)`, 20, y + 5);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        y += 20;
        
        // En-tête tableau avec style professionnel
        doc.setFillColor(229, 231, 235);
        doc.rect(15, y - 3, 180, 10, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('#', 20, y + 3);
        doc.text('AGENT / NOM', 30, y + 3);
        doc.text('PÉRIODE', 75, y + 3);
        doc.text('VOLUME TOTAL', 105, y + 3);
        doc.text('RETRAITS', 135, y + 3);
        doc.text('TRANS.', 160, y + 3);
        doc.text('GAINS', 175, y + 3);
        doc.setFont('helvetica', 'normal');
        y += 12;
        
        // Ligne de séparation épaisse
        doc.setLineWidth(0.5);
        doc.setDrawColor(156, 163, 175);
        doc.line(15, y - 2, 195, y - 2);
        
        // Affichage des données avec alternance de couleurs
        agentPerformance.slice(0, 30).forEach((perf, index) => {
          if (y > 275) {
            doc.addPage();
            y = 20;
            // Répéter l'en-tête stylé
            doc.setFillColor(229, 231, 235);
            doc.rect(15, y - 3, 180, 10, 'F');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('#', 20, y + 3);
            doc.text('AGENT / NOM', 30, y + 3);
            doc.text('PÉRIODE', 75, y + 3);
            doc.text('VOLUME TOTAL', 105, y + 3);
            doc.text('RETRAITS', 135, y + 3);
            doc.text('TRANS.', 160, y + 3);
            doc.text('GAINS', 175, y + 3);
            doc.setFont('helvetica', 'normal');
            y += 12;
          }
          
          // Alternance de couleurs de fond
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(15, y - 2, 180, 6, 'F');
          }
          
          const agentName = perf.profiles?.full_name || 'Agent inconnu';
          const agentId = String(perf.agent_id).substring(0, 6) + '...';
          const monthYear = `${perf.month}/${perf.year}`;
          const volume = Number(perf.total_volume || 0);
          const withdrawals = Number(perf.withdrawals_volume || 0);
          const transactions = perf.total_transactions || 0;
          const earnings = Number(perf.total_earnings || 0);
          
          doc.setFontSize(7);
          doc.text(`${index + 1}`, 20, y + 2);
          doc.text(`${agentName.substring(0, 15)}`, 30, y + 2);
          doc.text(`${agentId}`, 30, y + 5);
          doc.text(monthYear, 75, y + 2);
          doc.text(`${volume.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}`, 105, y + 2);
          doc.text(`${withdrawals.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}`, 135, y + 2);
          doc.text(`${transactions}`, 160, y + 2);
          
          // Colorer les gains selon leur importance
          if (earnings > 100000) {
            doc.setTextColor(34, 139, 34); // Vert pour gros gains
          } else if (earnings > 50000) {
            doc.setTextColor(255, 140, 0); // Orange pour gains moyens
          } else {
            doc.setTextColor(0, 0, 0); // Noir pour petits gains
          }
          doc.setFont('helvetica', 'bold');
          doc.text(`${earnings.toLocaleString('fr-FR')}`, 175, y + 2);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          
          y += 7;
        });
        
        if (agentPerformance.length > 30) {
          y += 8;
          doc.setFillColor(254, 243, 199);
          doc.rect(15, y - 3, 180, 8, 'F');
          doc.setFontSize(8);
          doc.setTextColor(146, 64, 14);
          doc.setFont('helvetica', 'italic');
          doc.text(`📋 Affichage limité: ${agentPerformance.length - 30} autres enregistrements disponibles dans la base`, 20, y + 2);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        y += 20;
      }
      
      // SECTION 3: COMMISSIONS AGENTS AVEC DÉTAILS COMPLETS
      if (commissions?.length) {
        if (y > 180) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFillColor(236, 254, 255);
        doc.rect(15, y - 5, 180, 15, 'F');
        doc.setDrawColor(14, 165, 233);
        doc.setLineWidth(1);
        doc.rect(15, y - 5, 180, 15, 'S');
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(3, 105, 161);
        doc.text(`💎 TABLEAU DE BORD COMMISSIONS - ${commissions.length} AGENTS ENREGISTRÉS`, 20, y + 5);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        y += 20;
        
        // En-tête détaillé du tableau
        doc.setFillColor(219, 234, 254);
        doc.rect(15, y - 3, 180, 12, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('#', 20, y + 2);
        doc.text('AGENT INFO', 30, y + 2);
        doc.text('CONTACT', 75, y + 2);
        doc.text('COMMISSION', 105, y + 2);
        doc.text('ACTIVITÉ', 140, y + 2);
        doc.text('STATUT', 165, y + 2);
        doc.text('PERFORMANCE', 180, y + 2);
        doc.setFont('helvetica', 'normal');
        y += 15;
        
        // Tri par commission décroissante
        const sortedCommissions = [...commissions].sort((a, b) => 
          Number(b.commission_balance) - Number(a.commission_balance)
        );
        
        sortedCommissions.slice(0, 25).forEach((comm, index) => {
          if (y > 275) {
            doc.addPage();
            y = 20;
            // Répéter l'en-tête
            doc.setFillColor(219, 234, 254);
            doc.rect(15, y - 3, 180, 12, 'F');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('#', 20, y + 2);
            doc.text('AGENT INFO', 30, y + 2);
            doc.text('CONTACT', 75, y + 2);
            doc.text('COMMISSION', 105, y + 2);
            doc.text('ACTIVITÉ', 140, y + 2);
            doc.text('STATUT', 165, y + 2);
            doc.text('PERFORMANCE', 180, y + 2);
            doc.setFont('helvetica', 'normal');
            y += 15;
          }
          
          // Alternance de couleurs
          if (index % 2 === 0) {
            doc.setFillColor(249, 250, 251);
            doc.rect(15, y - 2, 180, 8, 'F');
          }
          
          const name = (comm.full_name || 'Agent inconnu').substring(0, 18);
          const phone = comm.phone ? comm.phone.substring(0, 12) : 'N/A';
          const commission = Number(comm.commission_balance);
          const transactions = comm.transactions_count || 0;
          const dateCreated = new Date(comm.created_at).toLocaleDateString('fr-FR');
          const country = comm.country || 'N/A';
          const userBalance = 0; // Balance info not available in agents table
          
          doc.setFontSize(7);
          doc.text(`${index + 1}`, 20, y + 2);
          doc.text(name, 30, y + 2);
          doc.text(`ID: ${String(comm.user_id).substring(0, 8)}...`, 30, y + 5);
          doc.text(phone, 75, y + 2);
          doc.text(country, 75, y + 5);
          
          // Commission avec couleur selon montant
          if (commission > 50000) {
            doc.setTextColor(34, 139, 34);
            doc.setFont('helvetica', 'bold');
          } else if (commission > 10000) {
            doc.setTextColor(255, 140, 0);
          } else {
            doc.setTextColor(220, 38, 38);
          }
          doc.text(`${commission.toLocaleString('fr-FR')} XAF`, 105, y + 2);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
          
          doc.text(`${transactions} trans.`, 140, y + 2);
          doc.text(dateCreated, 140, y + 5);
          
          // Statut selon l'activité
          if (transactions > 100) {
            doc.setTextColor(34, 139, 34);
            doc.text('★★★', 165, y + 2);
          } else if (transactions > 20) {
            doc.setTextColor(255, 140, 0);
            doc.text('★★', 165, y + 2);
          } else {
            doc.setTextColor(220, 38, 38);
            doc.text('★', 165, y + 2);
          }
          doc.setTextColor(0, 0, 0);
          
          // Performance ratio
          const ratio = transactions > 0 ? commission / transactions : 0;
          doc.setFontSize(6);
          doc.text(`${ratio.toFixed(0)}`, 180, y + 2);
          doc.text('XAF/t', 180, y + 5);
          
          y += 9;
        });
        
        if (commissions.length > 25) {
          y += 5;
          doc.setFillColor(254, 240, 138);
          doc.rect(15, y - 2, 180, 6, 'F');
          doc.setFontSize(7);
          doc.setTextColor(146, 64, 14);
          doc.text(`⚠️ Liste tronquée: ${commissions.length - 25} autres agents non affichés`, 20, y + 2);
          doc.setTextColor(0, 0, 0);
        }
        y += 15;
      }

      // SECTION 4: DÉPÔTS ADMINISTRATEUR AVEC ANALYSE DÉTAILLÉE
      if (adminDeposits?.length) {
        if (y > 150) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFillColor(240, 253, 244);
        doc.rect(15, y - 5, 180, 15, 'F');
        doc.setDrawColor(34, 197, 94);
        doc.setLineWidth(1);
        doc.rect(15, y - 5, 180, 15, 'S');
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(21, 128, 61);
        doc.text(`🏛️ REGISTRE COMPLET - DÉPÔTS ADMINISTRATEUR (${adminDeposits.length} opérations)`, 20, y + 5);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        y += 25;
        
        // Statistiques des dépôts
        const totalAmount = adminDeposits.reduce((sum, d) => sum + Number(d.amount || 0), 0);
        const avgAmount = totalAmount / adminDeposits.length;
        const maxDeposit = Math.max(...adminDeposits.map(d => Number(d.amount || 0)));
        const minDeposit = Math.min(...adminDeposits.map(d => Number(d.amount || 0)));
        
        doc.setFillColor(249, 250, 251);
        doc.rect(15, y - 3, 180, 20, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(75, 85, 99);
        doc.text('📊 STATISTIQUES DES DÉPÔTS:', 20, y + 3);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        y += 8;
        
        doc.setFontSize(8);
        doc.text(`Total: ${totalAmount.toLocaleString('fr-FR')} XAF`, 25, y);
        doc.text(`Moyenne: ${avgAmount.toLocaleString('fr-FR')} XAF`, 85, y);
        doc.text(`Max: ${maxDeposit.toLocaleString('fr-FR')} XAF`, 145, y);
        y += 4;
        doc.text(`Min: ${minDeposit.toLocaleString('fr-FR')} XAF`, 25, y);
        doc.text(`Opérations: ${adminDeposits.length}`, 85, y);
        y += 15;
        
        // En-tête tableau détaillé
        doc.setFillColor(229, 231, 235);
        doc.rect(15, y - 3, 180, 10, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('#', 20, y + 2);
        doc.text('MONTANT', 30, y + 2);
        doc.text('DEVISE', 60, y + 2);
        doc.text('ADMIN', 75, y + 2);
        doc.text('BÉNÉFICIAIRE', 105, y + 2);
        doc.text('TYPE', 140, y + 2);
        doc.text('DATE', 160, y + 2);
        doc.text('REF', 180, y + 2);
        doc.setFont('helvetica', 'normal');
        y += 12;
        
        // Tri par montant décroissant
        const sortedDeposits = [...adminDeposits].sort((a, b) => 
          Number(b.amount || 0) - Number(a.amount || 0)
        );
        
        sortedDeposits.slice(0, 20).forEach((deposit, index) => {
          if (y > 275) {
            doc.addPage();
            y = 20;
            // Répéter l'en-tête
            doc.setFillColor(229, 231, 235);
            doc.rect(15, y - 3, 180, 10, 'F');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('#', 20, y + 2);
            doc.text('MONTANT', 30, y + 2);
            doc.text('DEVISE', 60, y + 2);
            doc.text('ADMIN', 75, y + 2);
            doc.text('BÉNÉFICIAIRE', 105, y + 2);
            doc.text('TYPE', 140, y + 2);
            doc.text('DATE', 160, y + 2);
            doc.text('REF', 180, y + 2);
            doc.setFont('helvetica', 'normal');
            y += 12;
          }
          
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(15, y - 2, 180, 6, 'F');
          }
          
          const amount = Number(deposit.amount || 0);
          const currency = deposit.currency || 'XAF';
          const date = new Date(deposit.created_at).toLocaleDateString('fr-FR');
          const reference = (deposit.reference_number || 'N/A').substring(0, 6);
          const type = deposit.deposit_type || 'standard';
          const targetUser = String(deposit.target_user_id).substring(0, 8) + '...';
          
          doc.setFontSize(7);
          doc.text(`${index + 1}`, 20, y + 2);
          
          // Montant avec couleur selon l'importance
          if (amount > 500000) {
            doc.setTextColor(34, 139, 34);
            doc.setFont('helvetica', 'bold');
          } else if (amount > 100000) {
            doc.setTextColor(255, 140, 0);
          } else {
            doc.setTextColor(0, 0, 0);
          }
          doc.text(`${amount.toLocaleString('fr-FR')}`, 30, y + 2);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
          
          doc.text(currency, 60, y + 2);
          doc.text(String(deposit.admin_id).substring(0, 6), 75, y + 2);
          doc.text(targetUser.substring(0, 12), 105, y + 2);
          doc.text(type.substring(0, 8), 140, y + 2);
          doc.text(date, 160, y + 2);
          doc.text(reference, 180, y + 2);
          
          y += 6;
        });
        
        if (adminDeposits.length > 20) {
          y += 5;
          doc.setFillColor(254, 249, 195);
          doc.rect(15, y - 2, 180, 6, 'F');
          doc.setFontSize(7);
          doc.setTextColor(146, 64, 14);
          doc.text(`📋 ${adminDeposits.length - 20} autres dépôts dans la base de données`, 20, y + 2);
          doc.setTextColor(0, 0, 0);
        }
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