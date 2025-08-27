
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileBarChart, Download, RefreshCw, Calendar,
  TrendingUp, Users, DollarSign, BarChart3
} from 'lucide-react';
import { AdminReportService, WeeklyReport, MonthlyReport, AgentPerformanceReport, SubAdminReport } from '@/services/adminReportService';
import { formatCurrency } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AdminReportsTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [agentReports, setAgentReports] = useState<AgentPerformanceReport[]>([]);
  const [subAdminReports, setSubAdminReports] = useState<SubAdminReport[]>([]);

  const generateReports = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const [weekly, monthly, agents, subAdmins] = await Promise.all([
        AdminReportService.generateWeeklyReport(startOfWeek, endOfWeek),
        AdminReportService.generateMonthlyReport(currentMonth, currentYear),
        AdminReportService.getAgentsPerformance(startOfWeek, endOfWeek),
        AdminReportService.getSubAdminsData()
      ]);

      setWeeklyReport(weekly);
      setMonthlyReport(monthly);
      setAgentReports(agents);
      setSubAdminReports(subAdmins);

      toast({
        title: "✅ Rapports générés",
        description: "Tous les rapports ont été générés avec succès"
      });
    } catch (error: any) {
      console.error('Erreur génération rapports:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les rapports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (data: any, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export réussi",
      description: `Rapport ${filename} exporté avec succès`
    });
  };

  useEffect(() => {
    generateReports();
  }, []);

  const ReportCard = ({ title, value, subtitle, icon: Icon, color = "blue" }: any) => (
    <Card className="bg-gradient-to-br from-white to-gray-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">{title}</p>
            <p className={`text-2xl font-bold text-${color}-700`}>{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 bg-${color}-100 rounded-full flex items-center justify-center`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Rapports Administrateur</h2>
          <p className="text-gray-600 mt-1">Données exactes et performances détaillées</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={reportType} onValueChange={(value) => setReportType(value as 'weekly' | 'monthly')}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Hebdomadaire</SelectItem>
              <SelectItem value="monthly">Mensuel</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={generateReports}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="subadmins">Sous-Admins</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {reportType === 'weekly' && weeklyReport && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ReportCard
                  title="Transactions Totales"
                  value={weeklyReport.total_transactions}
                  subtitle="Cette semaine"
                  icon={BarChart3}
                  color="blue"
                />
                
                <ReportCard
                  title="Volume Total"
                  value={formatCurrency(weeklyReport.total_volume)}
                  subtitle="Toutes opérations"
                  icon={DollarSign}
                  color="green"
                />
                
                <ReportCard
                  title="Revenus Plateforme"
                  value={formatCurrency(weeklyReport.platform_revenue)}
                  subtitle="Part SendFlow"
                  icon={TrendingUp}
                  color="purple"
                />
                
                <ReportCard
                  title="Agents Actifs"
                  value={weeklyReport.active_agents}
                  subtitle="Agents en activité"
                  icon={Users}
                  color="orange"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ReportCard
                  title="Transferts Internationaux"
                  value={weeklyReport.international_transfers}
                  subtitle="Opérations cross-border"
                  icon={BarChart3}
                  color="indigo"
                />
                
                <ReportCard
                  title="Transferts Domestiques"
                  value={weeklyReport.domestic_transfers}
                  subtitle="Opérations locales"
                  icon={BarChart3}
                  color="teal"
                />
                
                <ReportCard
                  title="Frais Collectés"
                  value={formatCurrency(weeklyReport.total_fees)}
                  subtitle="Total des commissions"
                  icon={DollarSign}
                  color="pink"
                />
              </div>
            </>
          )}

          {reportType === 'monthly' && monthlyReport && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ReportCard
                  title="Transactions Mensuelles"
                  value={monthlyReport.total_transactions}
                  subtitle={`Mois ${monthlyReport.month}/${monthlyReport.year}`}
                  icon={BarChart3}
                  color="blue"
                />
                
                <ReportCard
                  title="Volume Mensuel"
                  value={formatCurrency(monthlyReport.total_volume)}
                  subtitle="Toutes opérations"
                  icon={DollarSign}
                  color="green"
                />
                
                <ReportCard
                  title="Revenus Mensuels"
                  value={formatCurrency(monthlyReport.platform_revenue)}
                  subtitle="Part SendFlow"
                  icon={TrendingUp}
                  color="purple"
                />
                
                <ReportCard
                  title="Utilisateurs Actifs"
                  value={monthlyReport.active_users}
                  subtitle="Utilisateurs du mois"
                  icon={Users}
                  color="orange"
                />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance des Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Agent</th>
                      <th className="text-right p-2">Volume</th>
                      <th className="text-right p-2">Transactions</th>
                      <th className="text-right p-2">Commission</th>
                      <th className="text-right p-2">Dépôts</th>
                      <th className="text-right p-2">Retraits</th>
                      <th className="text-right p-2">Plaintes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentReports.map((agent, index) => (
                      <tr key={agent.agent_id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{agent.agent_name}</div>
                            <div className="text-xs text-gray-500">ID: {agent.agent_id.slice(0, 8)}...</div>
                          </div>
                        </td>
                        <td className="text-right p-2 font-medium">
                          {formatCurrency(agent.total_volume)}
                        </td>
                        <td className="text-right p-2">{agent.transactions_count}</td>
                        <td className="text-right p-2 text-green-600">
                          {formatCurrency(agent.commission_earned)}
                        </td>
                        <td className="text-right p-2">{agent.deposits_count}</td>
                        <td className="text-right p-2">{agent.withdrawals_count}</td>
                        <td className="text-right p-2">
                          <Badge variant={agent.complaints_count > 0 ? "destructive" : "default"}>
                            {agent.complaints_count}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subadmins" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance des Sous-Administrateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Sous-Admin</th>
                      <th className="text-left p-2">Territoire</th>
                      <th className="text-right p-2">Agents Gérés</th>
                      <th className="text-right p-2">Volume Total</th>
                      <th className="text-right p-2">Commission %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subAdminReports.map((subAdmin, index) => (
                      <tr key={subAdmin.sub_admin_id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="font-medium">{subAdmin.sub_admin_name}</div>
                        </td>
                        <td className="p-2">{subAdmin.territory}</td>
                        <td className="text-right p-2">{subAdmin.agents_managed}</td>
                        <td className="text-right p-2 font-medium">
                          {formatCurrency(subAdmin.total_volume)}
                        </td>
                        <td className="text-right p-2">
                          {(subAdmin.commission_percentage * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export des Rapports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => weeklyReport && exportReport(weeklyReport, 'rapport-hebdomadaire')}
                  disabled={!weeklyReport}
                  variant="outline"
                  className="justify-start"
                >
                  <FileBarChart className="w-4 h-4 mr-2" />
                  Rapport Hebdomadaire
                </Button>
                
                <Button
                  onClick={() => monthlyReport && exportReport(monthlyReport, 'rapport-mensuel')}
                  disabled={!monthlyReport}
                  variant="outline"
                  className="justify-start"
                >
                  <FileBarChart className="w-4 h-4 mr-2" />
                  Rapport Mensuel
                </Button>
                
                <Button
                  onClick={() => exportReport(agentReports, 'performance-agents')}
                  disabled={agentReports.length === 0}
                  variant="outline"
                  className="justify-start"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Performance Agents
                </Button>
                
                <Button
                  onClick={() => exportReport(subAdminReports, 'performance-sous-admins')}
                  disabled={subAdminReports.length === 0}
                  variant="outline"
                  className="justify-start"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Performance Sous-Admins
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReportsTab;
