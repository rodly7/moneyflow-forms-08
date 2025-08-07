
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, TrendingUp, Users, RefreshCw, Calendar, DollarSign, Activity, BarChart3, Download } from "lucide-react";
import { useAgentReports } from "@/hooks/useAgentReports";
import { formatCurrency } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminAgentReports = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { reports, isLoading, error, generateAllReports, getReportsByPeriod } = useAgentReports();

  const dailyReports = getReportsByPeriod('daily');
  const weeklyReports = getReportsByPeriod('weekly');
  const monthlyReports = getReportsByPeriod('monthly');
  const yearlyReports = getReportsByPeriod('yearly');

  const handleRefresh = () => {
    generateAllReports();
    toast({
      title: "Actualisation",
      description: "Les rapports sont en cours de génération...",
    });
  };

  const handleExportReports = (period: string) => {
    const reportsToExport = getReportsByPeriod(period as any);
    const csvContent = [
      ['Agent', 'Période', 'Transferts', 'Retraits', 'Dépôts', 'Solde Actuel', 'Montant à Ajouter', 'Commissions'].join(','),
      ...reportsToExport.map(report => [
        report.agent_name,
        period,
        report.totalTransfers,
        report.totalWithdrawals,
        report.totalDeposits,
        report.currentBalance,
        report.amountToAdd,
        report.totalCommissions
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapports-agents-${period}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export réussi",
      description: `Les rapports ${period} ont été exportés en CSV`,
    });
  };

  if (profile?.role !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  const ReportCard = ({ report }: { report: any }) => (
    <Card className="bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold text-gray-800">{report.agent_name}</span>
              <p className="text-sm text-gray-500">Agent ID: {report.agent_id.slice(0, 8)}...</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50">
            {report.period === 'daily' ? 'Journalier' : 
             report.period === 'weekly' ? 'Hebdomadaire' : 
             report.period === 'monthly' ? 'Mensuel' : 'Annuel'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <div className="flex items-center justify-center mb-2">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-700">{report.totalTransfers}</p>
            <p className="text-xs text-blue-600 font-medium">Transferts</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-700">{report.totalWithdrawals}</p>
            <p className="text-xs text-green-600 font-medium">Retraits</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm font-bold text-purple-700">
              {formatCurrency(report.currentBalance, 'XAF')}
            </p>
            <p className="text-xs text-purple-600 font-medium">Solde actuel</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-sm font-bold text-orange-700">
              {formatCurrency(report.amountToAdd, 'XAF')}
            </p>
            <p className="text-xs text-orange-600 font-medium">À ajouter</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Commissions:</span>
              <span className="font-bold text-gray-800">
                {formatCurrency(report.totalCommissions, 'XAF')}
              </span>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Dépôts effectués:</span>
              <span className="font-bold text-gray-800">{report.totalDeposits}</span>
            </div>
          </div>
        </div>

        {/* Indicateur de performance */}
        <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-700">
              {report.currentBalance >= 100000 ? '✅ Objectif atteint' : '⚠️ Besoin de recharge'}
            </span>
            <div className="text-right">
              <div className="text-xs text-indigo-600">
                Période: {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/main-admin')}
              className="hover:bg-white/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Rapports des Agents
            </h1>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Status */}
        {isLoading && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-blue-800 font-medium">Génération des rapports en cours...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border-red-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <span className="text-red-800 font-medium">❌ Erreur: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Rapports Journaliers</p>
                  <p className="text-3xl font-bold">{dailyReports.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Rapports Hebdomadaires</p>
                  <p className="text-3xl font-bold">{weeklyReports.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Rapports Mensuels</p>
                  <p className="text-3xl font-bold">{monthlyReports.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-600 to-red-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Rapports Annuels</p>
                  <p className="text-3xl font-bold">{yearlyReports.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Tabs */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6">
            <Tabs defaultValue="daily" className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList className="grid grid-cols-4 bg-gray-100 rounded-xl h-12">
                  <TabsTrigger value="daily" className="h-10">Journalier</TabsTrigger>
                  <TabsTrigger value="weekly" className="h-10">Hebdomadaire</TabsTrigger>
                  <TabsTrigger value="monthly" className="h-10">Mensuel</TabsTrigger>
                  <TabsTrigger value="yearly" className="h-10">Annuel</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="daily" className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Rapports Journaliers</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleExportReports('daily')}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exporter CSV
                  </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {dailyReports.map((report, index) => (
                    <ReportCard key={`daily-${index}`} report={report} />
                  ))}
                </div>
                {dailyReports.length === 0 && !isLoading && (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Aucun rapport journalier disponible</p>
                    <p className="text-sm">Les rapports seront générés automatiquement</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="weekly" className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Rapports Hebdomadaires</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleExportReports('weekly')}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exporter CSV
                  </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {weeklyReports.map((report, index) => (
                    <ReportCard key={`weekly-${index}`} report={report} />
                  ))}
                </div>
                {weeklyReports.length === 0 && !isLoading && (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Aucun rapport hebdomadaire disponible</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="monthly" className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Rapports Mensuels</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleExportReports('monthly')}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exporter CSV
                  </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {monthlyReports.map((report, index) => (
                    <ReportCard key={`monthly-${index}`} report={report} />
                  ))}
                </div>
                {monthlyReports.length === 0 && !isLoading && (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Aucun rapport mensuel disponible</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="yearly" className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Rapports Annuels</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleExportReports('yearly')}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exporter CSV
                  </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {yearlyReports.map((report, index) => (
                    <ReportCard key={`yearly-${index}`} report={report} />
                  ))}
                </div>
                {yearlyReports.length === 0 && !isLoading && (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Aucun rapport annuel disponible</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-3 text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p>Les rapports sont générés automatiquement toutes les heures</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p>Le montant cible pour les agents est fixé à 100 000 FCFA</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p>Les commissions sont calculées sur la base des frais de transfert</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p>Le système calcule automatiquement le montant à ajouter pour atteindre l'objectif</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p>Exportez les rapports en CSV pour une analyse approfondie</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAgentReports;
