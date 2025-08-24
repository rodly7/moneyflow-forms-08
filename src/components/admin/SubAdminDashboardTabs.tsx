
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

  const tabConfig = [
    {
      value: 'user-requests',
      label: 'Demandes',
      icon: UserCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-200',
      hoverColor: 'hover:bg-orange-100'
    },
    {
      value: 'users',
      label: 'Utilisateurs',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      hoverColor: 'hover:bg-blue-100'
    },
    {
      value: 'stats',
      label: 'Statistiques',
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      hoverColor: 'hover:bg-green-100'
    },
    {
      value: 'inventory',
      label: 'Inventaire',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
      hoverColor: 'hover:bg-purple-100'
    },
    {
      value: 'messages',
      label: 'Messages',
      icon: MessageCircle,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 border-cyan-200',
      hoverColor: 'hover:bg-cyan-100'
    },
    {
      value: 'logs',
      label: 'Journaux',
      icon: History,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 border-gray-200',
      hoverColor: 'hover:bg-gray-100'
    },
    {
      value: 'settings',
      label: 'Paramètres',
      icon: Settings,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 border-indigo-200',
      hoverColor: 'hover:bg-indigo-100'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <div className="mb-8">
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <h1 className="text-3xl font-bold mb-2">Tableau de Bord Sous-Administrateur</h1>
          <p className="text-violet-100">Gérez efficacement vos utilisateurs et surveillez les activités</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 bg-gray-50 p-2 gap-1 h-auto">
            {tabConfig.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`
                    flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200 min-h-[80px]
                    data-[state=active]:bg-white data-[state=active]:shadow-md
                    ${isActive ? `${tab.bgColor} ${tab.color} border` : 'hover:bg-gray-100 text-gray-600'}
                    ${tab.hoverColor}
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? tab.color : 'text-gray-500'}`} />
                  <span className="text-xs font-medium text-center leading-tight">
                    {tab.label}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="mt-6">
          <TabsContent value="user-requests" className="space-y-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <UserRequestsManagement />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <SubAdminUsersTab />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <SubAdminStatsTab />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <SubAdminInventoryTab />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <SubAdminMessagesTab />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <SubAdminLogsTab />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <SubAdminSettingsTab />
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default SubAdminDashboardTabs;
