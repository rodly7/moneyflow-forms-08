
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Settings, MessageCircle, BarChart3, Package, History, UserCheck } from 'lucide-react';
import SubAdminUsersTab from './SubAdminUsersTab';
import SubAdminSettingsTab from './SubAdminSettingsTab';
import SubAdminMessagesTab from './SubAdminMessagesTab';
import SubAdminStatsTab from './SubAdminStatsTab';
import SubAdminInventoryTab from './SubAdminInventoryTab';
import SubAdminLogsTab from './SubAdminLogsTab';
import UserRequestsManagement from './UserRequestsManagement';

const SubAdminDashboardTabs = () => {
  const [activeTab, setActiveTab] = useState('user-requests');

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="user-requests" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Demandes</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Utilisateurs</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Inventaire</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Messages</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Logs</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Paramètres</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user-requests" className="mt-6">
          <UserRequestsManagement />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <SubAdminUsersTab />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <SubAdminStatsTab />
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <SubAdminInventoryTab />
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <SubAdminMessagesTab />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <SubAdminLogsTab />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SubAdminSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubAdminDashboardTabs;
