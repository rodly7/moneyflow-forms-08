
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
    <div className="w-full space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Interface Complète - Sous-Admin
        </h1>
        <p className="text-gray-600">Accès complet à tous vos outils de gestion territoriale</p>
      </div>
      
      <Tabs defaultValue="stats" className="w-full">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-lg">
          <TabsList className="grid w-full grid-cols-7 bg-transparent">
            <TabsTrigger 
              value="stats" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Statistiques</span>
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Utilisateurs</span>
            </TabsTrigger>
            <TabsTrigger 
              value="recharge" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
            >
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Recharge</span>
            </TabsTrigger>
            <TabsTrigger 
              value="agents" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
            >
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Agents</span>
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Transactions</span>
            </TabsTrigger>
            <TabsTrigger 
              value="messages" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Paramètres</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-6">
          <TabsContent value="stats" className="space-y-6">
            <SubAdminStatsTab />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <SubAdminUsersTab />
          </TabsContent>

          <TabsContent value="recharge" className="space-y-6">
            <SubAdminRechargeTab />
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            <SubAdminAgentRecharge />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <SubAdminTransactionMonitor />
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <SubAdminMessagesTab />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SubAdminSettingsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default SubAdminDashboardTabs;
