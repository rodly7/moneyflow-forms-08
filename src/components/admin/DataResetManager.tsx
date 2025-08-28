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
    doc.setFontSize(14);
    doc.text('Données de Revenus et Analytics', 20, startY);
    
    try {
      // Récupérer TOUTES les données de revenus
      const { data: agentPerformance, error: perfError } = await supabase
        .from('agent_monthly_performance')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data: commissions, error: commError } = await supabase
        .from('agents')
        .select('commission_balance, user_id, full_name, transactions_count')
        .gte('commission_balance', 0);
      
      const { data: adminDeposits, error: depositsError } = await supabase
        .from('admin_deposits')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Performance data:', agentPerformance?.length || 0);
      console.log('Commissions data:', commissions?.length || 0);
      console.log('Admin deposits:', adminDeposits?.length || 0);
      
      let y = startY + 20;
      doc.setFontSize(10);
      
      if (agentPerformance?.length) {
        doc.text(`Performances Agents (${agentPerformance.length} enregistrements):`, 20, y);
        y += 10;
        
        const totalEarnings = agentPerformance.reduce((sum, perf) => sum + Number(perf.total_earnings || 0), 0);
        doc.text(`Total gains: ${totalEarnings.toLocaleString()} XAF`, 25, y);
        y += 5;
        
        agentPerformance.slice(0, 30).forEach((perf, index) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(`${index + 1}. Agent: ${perf.agent_id} - Gains: ${perf.total_earnings} XAF - Mois: ${perf.month}/${perf.year}`, 25, y);
          y += 5;
        });
      } else {
        doc.text('Aucune donnée de performance trouvée', 20, y);
        y += 10;
      }
      
      if (commissions?.length) {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        y += 10;
        doc.text(`Soldes Commissions (${commissions.length} agents):`, 20, y);
        y += 10;
        const totalCommissions = commissions.reduce((sum, c) => sum + Number(c.commission_balance), 0);
        doc.text(`Total commissions: ${totalCommissions.toLocaleString()} XAF`, 25, y);
        y += 5;
        
        commissions.slice(0, 20).forEach((comm, index) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(`${index + 1}. ${comm.full_name || 'Agent'}: ${Number(comm.commission_balance).toLocaleString()} XAF (${comm.transactions_count} transactions)`, 25, y);
          y += 5;
        });
      } else {
        doc.text('Aucune commission trouvée', 20, y);
        y += 10;
      }

      if (adminDeposits?.length) {
        if (y > 230) {
          doc.addPage();
          y = 20;
        }
        y += 15;
        doc.text(`Dépôts Admin (${adminDeposits.length} dépôts):`, 20, y);
        y += 10;
        const totalDeposits = adminDeposits.reduce((sum, d) => sum + Number(d.amount || 0), 0);
        doc.text(`Total dépôts: ${totalDeposits.toLocaleString()} XAF`, 25, y);
      }
      
    } catch (error) {
      console.error('Erreur récupération données revenus:', error);
      doc.text('Erreur lors de la récupération des données de revenus: ' + error, 20, startY + 20);
    }
  };

  const addTransactionData = async (doc: jsPDF, startY: number) => {
    doc.setFontSize(14);
    doc.text('Données des Transactions', 20, startY);
    
    try {
      // Récupérer TOUTES les données de transactions
      const { data: transfers, error: transfersError } = await supabase
        .from('transfers')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data: deposits, error: depositsError } = await supabase
        .from('recharges')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: pendingTransfers, error: pendingError } = await supabase
        .from('pending_transfers')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Transfers data:', transfers?.length || 0);
      console.log('Withdrawals data:', withdrawals?.length || 0);
      console.log('Deposits data:', deposits?.length || 0);
      console.log('Pending transfers:', pendingTransfers?.length || 0);
      
      let y = startY + 20;
      doc.setFontSize(10);
      
      // Statistiques générales
      doc.text(`=== STATISTIQUES TRANSACTIONS ===`, 20, y);
      y += 10;
      doc.text(`Transferts complétés: ${transfers?.filter(t => t.status === 'completed').length || 0}`, 20, y);
      y += 5;
      doc.text(`Retraits totaux: ${withdrawals?.length || 0}`, 20, y);
      y += 5;
      doc.text(`Dépôts totaux: ${deposits?.length || 0}`, 20, y);
      y += 5;
      doc.text(`Transferts en attente: ${pendingTransfers?.length || 0}`, 20, y);
      y += 15;

      // Détails des transferts récents
      if (transfers?.length) {
        const totalTransferAmount = transfers.reduce((sum, t) => sum + Number(t.amount || 0), 0);
        doc.text(`Volume total transferts: ${totalTransferAmount.toLocaleString()} XAF`, 20, y);
        y += 10;
        
        doc.text(`Derniers transferts:`, 20, y);
        y += 5;
        transfers.slice(0, 15).forEach((transfer, index) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(`${index + 1}. ${transfer.amount} XAF - ${transfer.status} - ${new Date(transfer.created_at).toLocaleDateString()}`, 25, y);
          y += 4;
        });
      }

      // Détails des retraits récents
      if (withdrawals?.length) {
        if (y > 230) {
          doc.addPage();
          y = 20;
        }
        y += 10;
        const totalWithdrawAmount = withdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0);
        doc.text(`Volume total retraits: ${totalWithdrawAmount.toLocaleString()} XAF`, 20, y);
        y += 10;
        
        doc.text(`Derniers retraits:`, 20, y);
        y += 5;
        withdrawals.slice(0, 10).forEach((withdrawal, index) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(`${index + 1}. ${withdrawal.amount} XAF - ${withdrawal.status} - ${new Date(withdrawal.created_at).toLocaleDateString()}`, 25, y);
          y += 4;
        });
      }
      
    } catch (error) {
      console.error('Erreur récupération transactions:', error);
      doc.text('Erreur lors de la récupération des données de transactions: ' + error, 20, startY + 20);
    }
  };

  const addSubAdminData = async (doc: jsPDF, startY: number) => {
    doc.setFontSize(14);
    doc.text('Données Trafic Sous-admins', 20, startY);
    
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

      console.log('Sub-admins data:', subAdmins?.length || 0);
      console.log('User sessions:', userSessions?.length || 0);
      console.log('Sub-admin quotas:', subAdminQuotas?.length || 0);
      
      let y = startY + 20;
      doc.setFontSize(10);
      
      doc.text(`=== DONNÉES SOUS-ADMINISTRATEURS ===`, 20, y);
      y += 10;
      doc.text(`Nombre de sous-admins: ${subAdmins?.length || 0}`, 20, y);
      y += 5;
      doc.text(`Sessions utilisateurs: ${userSessions?.length || 0}`, 20, y);
      y += 5;
      doc.text(`Sessions actives: ${userSessions?.filter(s => s.is_active).length || 0}`, 20, y);
      y += 15;
      
      if (subAdmins?.length) {
        doc.text('Liste des sous-admins:', 20, y);
        y += 5;
        subAdmins.forEach((admin, index) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          const createdDate = new Date(admin.created_at).toLocaleDateString('fr-FR');
          doc.text(`${index + 1}. ${admin.full_name || 'Non défini'} - ${admin.phone} (Créé: ${createdDate})`, 25, y);
          y += 4;
        });
      }

      if (userSessions?.length) {
        if (y > 220) {
          doc.addPage();
          y = 20;
        }
        y += 15;
        doc.text('Historique des sessions (20 dernières):', 20, y);
        y += 5;
        userSessions.slice(0, 20).forEach((session, index) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          const sessionDate = new Date(session.created_at).toLocaleDateString('fr-FR');
          const status = session.is_active ? 'Active' : 'Inactive';
          doc.text(`${index + 1}. Session ${status} - ${sessionDate}`, 25, y);
          y += 4;
        });
      }
      
    } catch (error) {
      console.error('Erreur récupération sous-admins:', error);
      doc.text('Erreur lors de la récupération des données sous-admins: ' + error, 20, startY + 20);
    }
  };

  const addUserData = async (doc: jsPDF, startY: number) => {
    doc.setFontSize(14);
    doc.text('Données Utilisateurs', 20, startY);
    
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

      console.log('Users data:', users?.length || 0);
      console.log('Agents data:', agents?.length || 0);
      console.log('KYC verifications:', kycVerifications?.length || 0);
      console.log('Support messages:', supportMessages?.length || 0);
      
      let y = startY + 20;
      doc.setFontSize(10);
      
      doc.text(`=== STATISTIQUES UTILISATEURS ===`, 20, y);
      y += 10;
      doc.text(`Utilisateurs réguliers: ${users?.length || 0}`, 20, y);
      y += 5;
      doc.text(`Agents: ${agents?.length || 0}`, 20, y);
      y += 5;
      doc.text(`Vérifications KYC: ${kycVerifications?.length || 0}`, 20, y);
      y += 5;
      doc.text(`Messages support: ${supportMessages?.length || 0}`, 20, y);
      y += 15;

      // Répartition des statuts KYC
      if (kycVerifications?.length) {
        const approvedKyc = kycVerifications.filter(k => k.status === 'approved').length;
        const pendingKyc = kycVerifications.filter(k => k.status === 'pending').length;
        const rejectedKyc = kycVerifications.filter(k => k.status === 'rejected').length;
        
        doc.text('Répartition KYC:', 20, y);
        y += 5;
        doc.text(`- Approuvées: ${approvedKyc}`, 25, y);
        y += 4;
        doc.text(`- En attente: ${pendingKyc}`, 25, y);
        y += 4;
        doc.text(`- Rejetées: ${rejectedKyc}`, 25, y);
        y += 10;
      }

      // Messages de support par statut
      if (supportMessages?.length) {
        const unreadMessages = supportMessages.filter(m => m.status === 'unread').length;
        const respondedMessages = supportMessages.filter(m => m.status === 'responded').length;
        const resolvedMessages = supportMessages.filter(m => m.status === 'resolved').length;
        
        doc.text('Messages de support:', 20, y);
        y += 5;
        doc.text(`- Non lus: ${unreadMessages}`, 25, y);
        y += 4;
        doc.text(`- Répondus: ${respondedMessages}`, 25, y);
        y += 4;
        doc.text(`- Résolus: ${resolvedMessages}`, 25, y);
      }
      
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      doc.text('Erreur lors de la récupération des données utilisateurs: ' + error, 20, startY + 20);
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