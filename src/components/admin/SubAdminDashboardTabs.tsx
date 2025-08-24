
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SubAdminStatsTab from './SubAdminStatsTab';
import SubAdminUsersTab from './SubAdminUsersTab';
import SubAdminAgentsTab from './SubAdminAgentsTab';
import SubAdminRequestsTab from './SubAdminRequestsTab';
import SubAdminMessagesTab from './SubAdminMessagesTab';
import SubAdminSettingsTab from './SubAdminSettingsTab';
import { 
  BarChart3, 
  Users, 
  UserCheck, 
  CreditCard,
  MessageSquare, 
  Settings 
} from 'lucide-react';

const SubAdminDashboardTabs = () => {
  return (
    <div className="w-full">
      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-8">
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Statistiques
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Demandes
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

        <TabsContent value="stats" className="space-y-6">
          <SubAdminStatsTab />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <SubAdminUsersTab />
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <SubAdminAgentsTab />
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <SubAdminRequestsTab />
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <SubAdminMessagesTab />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SubAdminSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubAdminDashboardTabs;
