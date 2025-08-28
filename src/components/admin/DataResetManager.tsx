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
      // Récupérer les données de revenus
      const { data: agentPerformance } = await supabase
        .from('agent_monthly_performance')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      const { data: commissions } = await supabase
        .from('agents')
        .select('commission_balance, user_id')
        .gt('commission_balance', 0);
      
      let y = startY + 20;
      doc.setFontSize(10);
      
      if (agentPerformance?.length) {
        doc.text('Performances Agents (50 dernières):', 20, y);
        y += 10;
        agentPerformance.slice(0, 20).forEach((perf, index) => {
          doc.text(`${index + 1}. Agent: ${perf.agent_id} - Total: ${perf.total_earnings} XAF`, 25, y);
          y += 5;
        });
      }
      
      if (commissions?.length) {
        y += 10;
        doc.text('Soldes Commissions:', 20, y);
        y += 10;
        const totalCommissions = commissions.reduce((sum, c) => sum + Number(c.commission_balance), 0);
        doc.text(`Total commissions: ${totalCommissions} XAF`, 25, y);
      }
      
    } catch (error) {
      doc.text('Erreur lors de la récupération des données de revenus', 20, startY + 20);
    }
  };

  const addTransactionData = async (doc: jsPDF, startY: number) => {
    doc.setFontSize(14);
    doc.text('Données des Transactions', 20, startY);
    
    try {
      // Statistiques générales des transactions
      const { data: transfers } = await supabase
        .from('transfers')
        .select('count')
        .eq('status', 'completed');
      
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('count');
      
      const { data: deposits } = await supabase
        .from('recharges')
        .select('count');
      
      let y = startY + 20;
      doc.setFontSize(10);
      doc.text(`Nombre de transferts: ${transfers?.length || 0}`, 20, y);
      y += 10;
      doc.text(`Nombre de retraits: ${withdrawals?.length || 0}`, 20, y);
      y += 10;
      doc.text(`Nombre de dépôts: ${deposits?.length || 0}`, 20, y);
      
    } catch (error) {
      doc.text('Erreur lors de la récupération des données de transactions', 20, startY + 20);
    }
  };

  const addSubAdminData = async (doc: jsPDF, startY: number) => {
    doc.setFontSize(14);
    doc.text('Données Trafic Sous-admins', 20, startY);
    
    try {
      const { data: subAdmins } = await supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .eq('role', 'sub_admin');
      
      let y = startY + 20;
      doc.setFontSize(10);
      doc.text(`Nombre de sous-admins: ${subAdmins?.length || 0}`, 20, y);
      
      if (subAdmins?.length) {
        y += 15;
        doc.text('Liste des sous-admins:', 20, y);
        y += 5;
        subAdmins.forEach((admin, index) => {
          doc.text(`${index + 1}. ${admin.full_name} (Créé: ${new Date(admin.created_at).toLocaleDateString('fr-FR')})`, 25, y);
          y += 5;
        });
      }
      
    } catch (error) {
      doc.text('Erreur lors de la récupération des données sous-admins', 20, startY + 20);
    }
  };

  const addUserData = async (doc: jsPDF, startY: number) => {
    doc.setFontSize(14);
    doc.text('Données Utilisateurs', 20, startY);
    
    try {
      const { data: users } = await supabase
        .from('profiles')
        .select('count')
        .eq('role', 'user');
      
      const { data: agents } = await supabase
        .from('profiles')
        .select('count')
        .eq('role', 'agent');
      
      let y = startY + 20;
      doc.setFontSize(10);
      doc.text(`Nombre d'utilisateurs: ${users?.length || 0}`, 20, y);
      y += 10;
      doc.text(`Nombre d'agents: ${agents?.length || 0}`, 20, y);
      
    } catch (error) {
      doc.text('Erreur lors de la récupération des données utilisateurs', 20, startY + 20);
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
      
      // Simulation de la réinitialisation (à adapter selon les besoins)
      switch (categoryId) {
        case 'revenue-analytics':
          // Réinitialiser les performances agents (garder la structure)
          await supabase
            .from('agent_monthly_performance')
            .update({ 
              total_earnings: 0, 
              base_commission: 0, 
              volume_bonus: 0,
              transaction_bonus: 0,
              no_complaint_bonus: 0
            })
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Condition pour tous
          break;
          
        case 'transactions':
          // Marquer les transactions comme archivées plutôt que les supprimer
          await supabase
            .from('transfers')
            .update({ status: 'archived' })
            .eq('status', 'completed');
          break;
          
        case 'traffic-subadmins':
          // Réinitialiser les sessions utilisateurs
          await supabase
            .from('user_sessions')
            .update({ is_active: false })
            .eq('is_active', true);
          break;
          
        case 'user-data':
          // Supprimer uniquement les données non essentielles
          await supabase
            .from('kyc_verifications')
            .delete()
            .eq('status', 'rejected');
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