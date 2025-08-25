import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface SubAdminStats {
  totalUsersManaged: number;
  totalAgentsManaged: number;
  activeAgents: number;
  quotaUtilization: number;
  dailyRequests: number;
  dailyLimit: number;
  pendingWithdrawals: number;
  totalTransactions: number;
  totalRechargeAmount: number;
  totalWithdrawalAmount: number;
  totalAmount: number;
}

interface SubAdminData {
  id: string;
  full_name: string;
  country: string;
  email: string;
  total_requests_processed: number;
  total_amount_processed: number;
  total_recharges: number;
  total_withdrawals: number;
  total_transfers: number;
  last_activity: string;
  agent_count: number;
  user_count: number;
}

interface TotalsSummary {
  totalAmount: number;
  totalRequests: number;
  totalSubAdmins: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0
  }).format(amount);
};

export const generateAdminReportPDF = async (stats: SubAdminStats) => {
  const doc = new jsPDF();
  
  // Configuration de base
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  
  // En-tête
  doc.setFontSize(20);
  doc.setTextColor(40, 116, 240);
  doc.text('SENDFLOW - RAPPORT ADMINISTRATEUR', pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, 40, { align: 'center' });
  
  // Section Statistiques Principales
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('STATISTIQUES PRINCIPALES', margin, 60);
  
  const mainStats = [
    ['Utilisateurs Gérés', stats.totalUsersManaged.toLocaleString()],
    ['Agents Gérés', stats.totalAgentsManaged.toLocaleString()],
    ['Agents Actifs', stats.activeAgents.toLocaleString()],
    ['Total Transactions', stats.totalTransactions.toLocaleString()],
    ['Retraits en Attente', stats.pendingWithdrawals.toLocaleString()]
  ];
  
  doc.autoTable({
    startY: 70,
    head: [['Métrique', 'Valeur']],
    body: mainStats,
    theme: 'striped',
    headStyles: { fillColor: [40, 116, 240] },
    margin: { left: margin, right: margin }
  });
  
  // Section Financière
  let currentY = (doc as any).lastAutoTable.finalY + 20;
  
  doc.setFontSize(16);
  doc.text('RÉSUMÉ FINANCIER', margin, currentY);
  
  const financialStats = [
    ['Total Recharges', formatCurrency(stats.totalRechargeAmount)],
    ['Total Retraits', formatCurrency(stats.totalWithdrawalAmount)],
    ['MONTANT GLOBAL', formatCurrency(stats.totalAmount)]
  ];
  
  doc.autoTable({
    startY: currentY + 10,
    head: [['Type d\'Opération', 'Montant']],
    body: financialStats,
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] },
    margin: { left: margin, right: margin },
    didParseCell: function (data: any) {
      if (data.row.index === 2 && data.column.index === 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [220, 38, 38];
      }
    }
  });
  
  // Pied de page
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('SendFlow - Système de Gestion Financière', pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });
  
  // Télécharger le PDF
  doc.save(`SendFlow_Rapport_Admin_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateSubAdminTotalsPDF = async (
  subAdmins: SubAdminData[], 
  summary: TotalsSummary
) => {
  const doc = new jsPDF();
  
  // Configuration de base
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  
  // En-tête
  doc.setFontSize(18);
  doc.setTextColor(40, 116, 240);
  doc.text('SENDFLOW - RAPPORT SOUS-ADMINISTRATEURS', pageWidth / 2, 25, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, 35, { align: 'center' });
  
  // Résumé Global
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('RÉSUMÉ GLOBAL', margin, 50);
  
  const summaryData = [
    ['Nombre de Sous-Administrateurs', summary.totalSubAdmins.toString()],
    ['Total Demandes Traitées', summary.totalRequests.toLocaleString()],
    ['Montant Total Géré', formatCurrency(summary.totalAmount)],
    ['Moyenne par Sous-Admin', formatCurrency(summary.totalAmount / Math.max(summary.totalSubAdmins, 1))]
  ];
  
  doc.autoTable({
    startY: 55,
    head: [['Métrique', 'Valeur']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [40, 116, 240] },
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 }
  });
  
  // Détails par Sous-Admin
  let currentY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(14);
  doc.text('DÉTAILS PAR SOUS-ADMINISTRATEUR', margin, currentY);
  
  const tableData = subAdmins.map(subAdmin => {
    const totalFinancial = subAdmin.total_amount_processed + subAdmin.total_recharges + 
                          subAdmin.total_withdrawals + subAdmin.total_transfers;
    
    return [
      subAdmin.full_name,
      subAdmin.country,
      subAdmin.total_requests_processed.toString(),
      formatCurrency(subAdmin.total_recharges),
      formatCurrency(subAdmin.total_withdrawals),
      formatCurrency(subAdmin.total_transfers),
      formatCurrency(totalFinancial),
      subAdmin.agent_count.toString(),
      subAdmin.user_count.toString()
    ];
  });
  
  doc.autoTable({
    startY: currentY + 5,
    head: [['Nom', 'Pays', 'Demandes', 'Recharges', 'Retraits', 'Transferts', 'Total', 'Agents', 'Users']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] },
    margin: { left: margin, right: margin },
    styles: { 
      fontSize: 8,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 20 },
      2: { cellWidth: 15 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 25 },
      7: { cellWidth: 15 },
      8: { cellWidth: 15 }
    }
  });
  
  // Statistiques par Pays
  const countriesStats = subAdmins.reduce((acc, subAdmin) => {
    if (!acc[subAdmin.country]) {
      acc[subAdmin.country] = {
        count: 0,
        totalAmount: 0,
        totalRequests: 0
      };
    }
    
    acc[subAdmin.country].count++;
    acc[subAdmin.country].totalAmount += subAdmin.total_amount_processed + 
                                        subAdmin.total_recharges + 
                                        subAdmin.total_withdrawals + 
                                        subAdmin.total_transfers;
    acc[subAdmin.country].totalRequests += subAdmin.total_requests_processed;
    
    return acc;
  }, {} as Record<string, {count: number, totalAmount: number, totalRequests: number}>);
  
  if (Object.keys(countriesStats).length > 0) {
    // Nouvelle page si nécessaire
    if ((doc as any).lastAutoTable.finalY > 220) {
      doc.addPage();
      currentY = 30;
    } else {
      currentY = (doc as any).lastAutoTable.finalY + 20;
    }
    
    doc.setFontSize(14);
    doc.text('STATISTIQUES PAR PAYS', margin, currentY);
    
    const countryData = Object.entries(countriesStats).map(([country, stats]) => [
      country,
      stats.count.toString(),
      stats.totalRequests.toLocaleString(),
      formatCurrency(stats.totalAmount),
      formatCurrency(stats.totalAmount / stats.count)
    ]);
    
    doc.autoTable({
      startY: currentY + 5,
      head: [['Pays', 'Sous-Admins', 'Total Demandes', 'Montant Total', 'Moyenne/Sous-Admin']],
      body: countryData,
      theme: 'striped',
      headStyles: { fillColor: [168, 85, 247] },
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 }
    });
  }
  
  // Pied de page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `SendFlow - Rapport Sous-Administrateurs - Page ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Télécharger le PDF
  doc.save(`SendFlow_Rapport_SousAdmins_${new Date().toISOString().split('T')[0]}.pdf`);
};