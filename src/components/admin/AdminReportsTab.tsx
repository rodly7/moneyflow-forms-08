
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Download, Calendar, TrendingUp, 
  BarChart3, Users, DollarSign, Activity,
  RefreshCw, Clock, CheckCircle
} from 'lucide-react';
import { AdminReportService, WeeklyReport, MonthlyReport, AgentPerformanceReport, SubAdminReport } from '@/services/adminReportService';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/integrations/supabase/client';

const AdminReportsTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [agentPerformances, setAgentPerformances] = useState<AgentPerformanceReport[]>([]);
  const [subAdminsData, setSubAdminsData] = useState<SubAdminReport[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const generateWeeklyReport = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      
      const [report, agents] = await Promise.all([
        AdminReportService.generateWeeklyReport(startOfWeek, endOfWeek),
        AdminReportService.getAgentsPerformance(startOfWeek, endOfWeek)
      ]);
      
      setWeeklyReport(report);
      setAgentPerformances(agents);
      
      toast({
        title: "✅ Rapport hebdomadaire généré",
        description: "Toutes les données ont été calculées avec précision"
      });
    } catch (error: any) {
      console.error('Erreur génération rapport hebdomadaire:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport hebdomadaire",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyReport = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
      const endOfMonth = new Date(selectedYear, selectedMonth, 0);
      
      const [report, agents, subAdmins] = await Promise.all([
        AdminReportService.generateMonthlyReport(selectedMonth, selectedYear),
        AdminReportService.getAgentsPerformance(startOfMonth, endOfMonth),
        AdminReportService.getSubAdminsData()
      ]);
      
      setMonthlyReport(report);
      setAgentPerformances(agents);
      setSubAdminsData(subAdmins);
      
      toast({
        title: "✅ Rapport mensuel généré",
        description: `Rapport de ${selectedMonth}/${selectedYear} généré avec succès`
      });
    } catch (error: any) {
      console.error('Erreur génération rapport mensuel:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport mensuel",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (data: any, filename: string) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export réussi",
      description: `Le rapport ${filename} a été exporté`
    });
  };

  useEffect(() => {
    generateWeeklyReport();
    generateMonthlyReport();
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
          <Icon className={`w-8 h-8 text-${color}-500`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Rapports Administrateur</h2>
        <div className="flex items-center gap-4">
          <Select value={reportPeriod} onValueChange={(value: 'weekly' | 'monthly') => setReportPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Hebdomadaire</SelectItem>
              <SelectItem value="monthly">Mensuel</SelectItem>
            </SelectContent>
          </Select>
          
          {reportPeriod === 'monthly' && (
            <>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(0, i).toLocaleDateString('fr-FR', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          
          <Button
            onClick={reportPeriod === 'weekly' ? generateWeeklyReport : generateMonthlyReport}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <BarChart3 className="w-4 h-4 mr-2" />
            )}
            Générer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="subadmins">Sous-Admins</TabsTrigger>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {(weeklyReport || monthlyReport) && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ReportCard
                  title="Total Transactions"
                  value={(reportPeriod === 'weekly' ? weeklyReport?.total_transactions : monthlyReport?.total_transactions) || 0}
                  icon={Activity}
                  color="blue"
                />
                <ReportCard
                  title="Volume Total"
                  value={formatCurrency((reportPeriod === 'weekly' ? weeklyReport?.total_volume : monthlyReport?.total_volume) || 0)}
                  icon={DollarSign}
                  color="green"
                />
                <ReportCard
                  title="Revenus Plateforme"
                  value={formatCurrency((reportPeriod === 'weekly' ? weeklyReport?.platform_revenue : monthlyReport?.platform_revenue) || 0)}
                  icon={TrendingUp}
                  color="purple"
                />
                <ReportCard
                  title="Agents Actifs"
                  value={(reportPeriod === 'weekly' ? weeklyReport?.active_agents : monthlyReport?.active_agents) || 0}
                  icon={Users}
                  color="orange"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ReportCard
                  title="Transferts Internationaux"
                  value={(reportPeriod === 'weekly' ? weeklyReport?.international_transfers : monthlyReport?.international_transfers) || 0}
                  subtitle="Transferts vers l'étranger"
                  icon={BarChart3}
                  color="indigo"
                />
                <ReportCard
                  title="Transferts Domestiques"
                  value={(reportPeriod === 'weekly' ? weeklyReport?.domestic_transfers : monthlyReport?.domestic_transfers) || 0}
                  subtitle="Transferts locaux"
                  icon={BarChart3}
                  color="teal"
                />
                <ReportCard
                  title="Commissions Agents"
                  value={formatCurrency((reportPeriod === 'weekly' ? weeklyReport?.agent_commissions : monthlyReport?.agent_commissions) || 0)}
                  subtitle="Payées aux agents"
                  icon={DollarSign}
                  color="pink"
                />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Performance des Agents</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportReport(agentPerformances, 'agents-performance')}
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
          
          <div className="grid gap-4">
            {agentPerformances.map((agent, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-lg">{agent.agent_name}</h4>
                      <p className="text-sm text-gray-600">ID: {agent.agent_id.slice(0, 8)}...</p>
                    </div>
                    <Badge variant={agent.complaints_count > 0 ? "destructive" : "default"}>
                      {agent.complaints_count} plaintes
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Volume</p>
                      <p className="font-bold">{formatCurrency(agent.total_volume)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Transactions</p>
                      <p className="font-bold">{agent.transactions_count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Dépôts</p>
                      <p className="font-bold">{agent.deposits_count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Retraits</p>
                      <p className="font-bold">{agent.withdrawals_count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Commissions</p>
                      <p className="font-bold text-green-600">{formatCurrency(agent.commission_earned)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subadmins" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Données des Sous-Administrateurs</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportReport(subAdminsData, 'subadmins-data')}
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
          
          <div className="grid gap-4">
            {subAdminsData.map((subAdmin, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-lg">{subAdmin.sub_admin_name}</h4>
                      <p className="text-sm text-gray-600">Territoire: {subAdmin.territory}</p>
                    </div>
                    <Badge variant="outline">
                      {subAdmin.commission_percentage * 100}% commission
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Agents Gérés</p>
                      <p className="font-bold text-blue-600">{subAdmin.agents_managed}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Volume Total</p>
                      <p className="font-bold">{formatCurrency(subAdmin.total_volume)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Commission Potentielle</p>
                      <p className="font-bold text-green-600">
                        {formatCurrency(subAdmin.total_volume * subAdmin.commission_percentage)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Revenus Exactes SendFlow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Calculs en cours...</p>
                <Button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const now = new Date();
                      const startDate = reportPeriod === 'weekly' 
                        ? new Date(now.setDate(now.getDate() - 7))
                        : new Date(selectedYear, selectedMonth - 1, 1);
                      const endDate = reportPeriod === 'weekly'
                        ? new Date()
                        : new Date(selectedYear, selectedMonth, 0);
                      
                      const revenue = await AdminReportService.getTreasuryRevenue(startDate, endDate);
                      
                      toast({
                        title: "Revenus calculés",
                        description: `Revenus nets: ${formatCurrency(revenue.netRevenue)}`
                      });
                    } catch (error) {
                      toast({
                        title: "Erreur",
                        description: "Impossible de calculer les revenus",
                        variant: "destructive"
                      });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Calculator className="w-4 h-4 mr-2" />
                  )}
                  Calculer Revenus Exacts
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
