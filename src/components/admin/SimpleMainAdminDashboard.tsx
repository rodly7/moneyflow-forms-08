import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  FileText,
  LucideIcon,
  Settings,
  TrendingUp,
  Users,
  ChevronsUpDown
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { useAdminDashboardData } from "@/hooks/useAdminDashboardData";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import AdminReportsTab from "@/components/admin/AdminReportsTab";
import EnhancedTreasuryTab from "@/components/admin/EnhancedTreasuryTab";
import UserRequestsManagement from "@/components/admin/UserRequestsManagement";
import SubAdminRechargeTab from "@/components/admin/SubAdminRechargeTab";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon: Icon, color = "text-blue-500" }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        {title}
      </CardTitle>
      <Settings className="w-4 h-4 text-gray-400" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const SimpleMainAdminDashboard = () => {
  const { data, isLoading, refetch } = useAdminDashboardData();
  const [activeTab, setActiveTab] = useState<'reports' | 'treasury' | 'users' | 'recharge'>('reports');

  const handleTabChange = (tab: 'reports' | 'treasury' | 'users' | 'recharge') => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tableau de Bord Admin</h1>
        <Button onClick={refetch} disabled={isLoading}>
          {isLoading ? "Chargement..." : "Rafraîchir les données"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DashboardCard
          title="Total Agents"
          value={data?.totalAgents || 0}
          icon={Users}
          color="text-green-500"
        />
        <DashboardCard
          title="Utilisateurs Actifs"
          value={data?.activeUsers || 0}
          icon={TrendingUp}
          color="text-yellow-500"
        />
        <DashboardCard
          title="Balance Totale"
          value={formatCurrency(data?.adminBalance || 0)}
          icon={DollarSign}
          color="text-blue-500"
        />
        <DashboardCard
          title="Total Volume"
          value={formatCurrency(data?.totalVolume || 0)}
          icon={FileText}
          color="text-red-500"
        />
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="reports">
          <AccordionTrigger onClick={() => handleTabChange('reports')}>
            <FileText className="w-4 h-4 mr-2" />
            Rapports et Statistiques
            <ChevronsUpDown className="ml-auto h-4 w-4" />
          </AccordionTrigger>
          <AccordionContent>
            {activeTab === 'reports' && <AdminReportsTab />}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="treasury">
          <AccordionTrigger onClick={() => handleTabChange('treasury')}>
            <DollarSign className="w-4 h-4 mr-2" />
            Trésorerie
            <ChevronsUpDown className="ml-auto h-4 w-4" />
          </AccordionTrigger>
          <AccordionContent>
            {activeTab === 'treasury' && <EnhancedTreasuryTab />}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="users">
          <AccordionTrigger onClick={() => handleTabChange('users')}>
            <Users className="w-4 h-4 mr-2" />
            Gestion des Utilisateurs
            <ChevronsUpDown className="ml-auto h-4 w-4" />
          </AccordionTrigger>
          <AccordionContent>
            {activeTab === 'users' && (
              <UserRequestsManagement type="verification" />
            )}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="recharge">
          <AccordionTrigger onClick={() => handleTabChange('recharge')}>
            <DollarSign className="w-4 h-4 mr-2" />
            Recharger un compte
            <ChevronsUpDown className="ml-auto h-4 w-4" />
          </AccordionTrigger>
          <AccordionContent>
            {activeTab === 'recharge' && (
              <SubAdminRechargeTab userId="main-admin" />
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default SimpleMainAdminDashboard;
