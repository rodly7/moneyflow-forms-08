
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, UserCog, BarChart3, MessageSquare, Settings } from 'lucide-react';
import SubAdminUsersTab from './SubAdminUsersTab';
import SubAdminAgentsTab from './SubAdminAgentsTab';
import SubAdminStatsTab from './SubAdminStatsTab';
import SubAdminMessagesTab from './SubAdminMessagesTab';
import SubAdminSettingsTab from './SubAdminSettingsTab';

const SubAdminDashboardTabs = () => {
  return (
    <div className="w-full">
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <UserCog className="w-4 h-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Statistiques
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <SubAdminUsersTab />
        </TabsContent>

        <TabsContent value="agents" className="mt-6">
          <SubAdminAgentsTab />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <SubAdminStatsTab />
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <SubAdminMessagesTab />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SubAdminSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubAdminDashboardTabs;
