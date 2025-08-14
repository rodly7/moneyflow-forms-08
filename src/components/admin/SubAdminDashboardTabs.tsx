
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, CreditCard, MessageSquare, Settings, Activity, UserCheck } from 'lucide-react';
import SubAdminStatsTab from './SubAdminStatsTab';
import SubAdminUsersTab from './SubAdminUsersTab';
import SubAdminRechargeTab from './SubAdminRechargeTab';
import SubAdminAgentRecharge from './SubAdminAgentRecharge';
import SubAdminMessagesTab from './SubAdminMessagesTab';
import SubAdminSettingsTab from './SubAdminSettingsTab';
import SubAdminTransactionMonitor from './SubAdminTransactionMonitor';

const SubAdminDashboardTabs = () => {
  return (
    <div className="w-full">
      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Statistiques</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Utilisateurs</span>
          </TabsTrigger>
          <TabsTrigger value="recharge" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Recharge</span>
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Agents</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Messages</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Paramètres</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="stats">
            <SubAdminStatsTab />
          </TabsContent>

          <TabsContent value="users">
            <SubAdminUsersTab />
          </TabsContent>

          <TabsContent value="recharge">
            <SubAdminRechargeTab />
          </TabsContent>

          <TabsContent value="agents">
            <SubAdminAgentRecharge />
          </TabsContent>

          <TabsContent value="transactions">
            <SubAdminTransactionMonitor />
          </TabsContent>

          <TabsContent value="messages">
            <SubAdminMessagesTab />
          </TabsContent>

          <TabsContent value="settings">
            <SubAdminSettingsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default SubAdminDashboardTabs;
