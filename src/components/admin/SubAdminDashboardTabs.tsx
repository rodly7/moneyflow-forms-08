
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, UserCheck, BarChart3, MessageSquare, 
  Settings, CreditCard, Activity
} from 'lucide-react';
import { useSubAdmin } from '@/hooks/useSubAdmin';
import SubAdminUsersTab from './SubAdminUsersTab';
import SubAdminAgentsTab from './SubAdminAgentsTab';
import SubAdminStatsTab from './SubAdminStatsTab';
import SubAdminMessagesTab from './SubAdminMessagesTab';
import SubAdminSettingsTab from './SubAdminSettingsTab';
import SubAdminRechargeTab from './SubAdminRechargeTab';
import SubAdminTransactionMonitor from './SubAdminTransactionMonitor';

const SubAdminDashboardTabs = () => {
  const {
    canViewUsers,
    canManageAgents,
    canViewTerritorialStats,
    canManageMessages,
    canRechargeNational,
    canMonitorTransactions,
    userCountry
  } = useSubAdmin();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord Sous-Administrateur</h1>
          <p className="text-muted-foreground">
            Gestion de votre territoire{userCountry && ` - ${userCountry}`}
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50">
          Accès Territorial
        </Badge>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          {canViewUsers && (
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Utilisateurs
            </TabsTrigger>
          )}
          
          {canManageAgents && (
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Agents
            </TabsTrigger>
          )}

          {canRechargeNational && (
            <TabsTrigger value="recharge" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Recharge
            </TabsTrigger>
          )}

          {canMonitorTransactions && (
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Transactions
            </TabsTrigger>
          )}
          
          {canViewTerritorialStats && (
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Statistiques
            </TabsTrigger>
          )}
          
          {canManageMessages && (
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Messages
            </TabsTrigger>
          )}
          
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        {canViewUsers && (
          <TabsContent value="users" className="mt-6">
            <SubAdminUsersTab />
          </TabsContent>
        )}

        {canManageAgents && (
          <TabsContent value="agents" className="mt-6">
            <SubAdminAgentsTab />
          </TabsContent>
        )}

        {canRechargeNational && (
          <TabsContent value="recharge" className="mt-6">
            <SubAdminRechargeTab />
          </TabsContent>
        )}

        {canMonitorTransactions && (
          <TabsContent value="transactions" className="mt-6">
            <SubAdminTransactionMonitor />
          </TabsContent>
        )}

        {canViewTerritorialStats && (
          <TabsContent value="stats" className="mt-6">
            <SubAdminStatsTab />
          </TabsContent>
        )}

        {canManageMessages && (
          <TabsContent value="messages" className="mt-6">
            <SubAdminMessagesTab />
          </TabsContent>
        )}

        <TabsContent value="settings" className="mt-6">
          <SubAdminSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubAdminDashboardTabs;
