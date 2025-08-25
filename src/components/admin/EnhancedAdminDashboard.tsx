import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserCheck, 
  TrendingUp, 
  DollarSign,
  Settings,
  MessageSquare,
  FileText,
  Wallet,
  Eye,
  Download,
  Calculator,
  Target
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMainAdmin } from '@/hooks/useMainAdmin';
import { useSubAdminStats } from '@/hooks/useSubAdminStats';
import AdminGlobalStats from './AdminGlobalStats';
import SubAdminRechargeTab from './SubAdminRechargeTab';
import UserRequestsManagement from './UserRequestsManagement';
import AdminUserRequestsOverview from './AdminUserRequestsOverview';
import { SimpleUsersList } from './SimpleUsersList';
import SimpleAgentsTab from './SimpleAgentsTab';
import { SimpleMessagesTab } from './SimpleMessagesTab';
import { SimpleSettingsTab } from './SimpleSettingsTab';
import { SimpleTreasuryTab } from './SimpleTreasuryTab';
import SimpleAdvancedTab from './SimpleAdvancedTab';
import SubAdminTotalsOverview from './SubAdminTotalsOverview';
import { generateAdminReportPDF } from '@/utils/pdfGenerator';
import { toast } from 'sonner';

const EnhancedAdminDashboard = () => {
  const { profile } = useAuth();
  const { isMainAdmin } = useMainAdmin();
  const { stats, loading } = useSubAdminStats();
  const [generating, setGenerating] = useState(false);
  
  if (!isMainAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Accès refusé</h3>
          <p className="text-gray-600">Vous n'avez pas les permissions pour accéder à cette section.</p>
        </div>
      </div>
    );
  }

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      await generateAdminReportPDF(stats);
      toast.success('Rapport PDF généré avec succès');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* En-tête amélioré */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tableau de bord Administrateur Principal</h1>
            <p className="opacity-90 text-lg">
              Bienvenue {profile?.full_name}. Gérez l'ensemble de la plateforme depuis cette interface.
            </p>
          </div>
          <div className="text-right space-y-2">
            <Button 
              onClick={handleGeneratePDF}
              disabled={generating || loading}
              variant="secondary"
              size="lg"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Download className="w-5 h-5 mr-2" />
              {generating ? 'Génération...' : 'Télécharger PDF'}
            </Button>
            <div className="text-sm opacity-80">
              Rapport complet de la plateforme
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques financières en temps réel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Recharges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? '...' : formatCurrency(stats.totalRechargeAmount)}
            </div>
            <div className="text-xs text-green-600 mt-1">
              Montant total des recharges
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Total Retraits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {loading ? '...' : formatCurrency(stats.totalWithdrawalAmount)}
            </div>
            <div className="text-xs text-orange-600 mt-1">
              Montant total des retraits
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Montant Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {loading ? '...' : formatCurrency(stats.totalAmount)}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Somme totale des opérations
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {loading ? '...' : stats.totalTransactions.toLocaleString()}
            </div>
            <div className="text-xs text-purple-600 mt-1">
              Nombre total de transactions
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques globales */}
      <AdminGlobalStats />

      {/* Onglets principaux améliorés */}
      <Tabs defaultValue="totals-overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="totals-overview" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Totaux
          </TabsTrigger>
          <TabsTrigger value="requests-overview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="user-requests" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Demandes
          </TabsTrigger>
          <TabsTrigger value="recharges" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Recharges
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="treasury" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Trésorerie
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        {/* Nouvel onglet Totaux */}
        <TabsContent value="totals-overview">
          <SubAdminTotalsOverview />
        </TabsContent>

        {/* Onglet Historique */}
        <TabsContent value="requests-overview">
          <AdminUserRequestsOverview />
        </TabsContent>

        {/* Onglet Demandes utilisateurs */}
        <TabsContent value="user-requests">
          <UserRequestsManagement />
        </TabsContent>

        {/* Onglet Recharges et Retraits */}
        <TabsContent value="recharges">
          <SubAdminRechargeTab />
        </TabsContent>

        {/* Onglet Utilisateurs */}
        <TabsContent value="users">
          <SimpleUsersList />
        </TabsContent>

        {/* Onglet Agents */}
        <TabsContent value="agents">
          <SimpleAgentsTab />
        </TabsContent>

        {/* Onglet Trésorerie */}
        <TabsContent value="treasury">
          <SimpleTreasuryTab />
        </TabsContent>

        {/* Onglet Paramètres */}
        <TabsContent value="settings">
          <SimpleSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedAdminDashboard;