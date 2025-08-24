
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Settings, MessageCircle, BarChart3, Package, History, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SubAdminUsersTab from './SubAdminUsersTab';
import SubAdminSettingsTab from './SubAdminSettingsTab';
import SubAdminMessagesTab from './SubAdminMessagesTab';
import SubAdminStatsTab from './SubAdminStatsTab';
import SubAdminInventoryTab from './SubAdminInventoryTab';
import SubAdminLogsTab from './SubAdminLogsTab';
import UserRequestsManagement from './UserRequestsManagement';
import SubAdminHeader from './SubAdminHeader';
import { useSubAdminTabNotifications } from '@/hooks/useSubAdminTabNotifications';

const SubAdminDashboardTabs = () => {
  const [activeTab, setActiveTab] = useState('user-requests');
  const { notifications, markTabAsSeen } = useSubAdminTabNotifications();
  const [blinkingTabs, setBlinkingTabs] = useState<Record<string, boolean>>({});

  // Gérer le clignotement des onglets
  useEffect(() => {
    const newBlinking: Record<string, boolean> = {};
    
    Object.values(notifications).forEach(notification => {
      if (notification.hasNew) {
        newBlinking[notification.tabId] = true;
      }
    });
    
    setBlinkingTabs(newBlinking);
  }, [notifications]);

  // Marquer un onglet comme vu quand on le sélectionne
  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
    markTabAsSeen(tabValue);
    setBlinkingTabs(prev => ({
      ...prev,
      [tabValue]: false
    }));
  };

  const tabConfig = [
    {
      value: 'user-requests',
      label: 'Demandes',
      icon: UserCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-200',
      hoverColor: 'hover:bg-orange-100',
      count: notifications['user-requests']?.count || 0,
      hasNew: notifications['user-requests']?.hasNew || false
    },
    {
      value: 'users',
      label: 'Utilisateurs',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      hoverColor: 'hover:bg-blue-100',
      count: notifications['users']?.count || 0,
      hasNew: notifications['users']?.hasNew || false
    },
    {
      value: 'stats',
      label: 'Statistiques',
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      hoverColor: 'hover:bg-green-100',
      count: notifications['stats']?.count || 0,
      hasNew: notifications['stats']?.hasNew || false
    },
    {
      value: 'inventory',
      label: 'Inventaire',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
      hoverColor: 'hover:bg-purple-100',
      count: 0,
      hasNew: false
    },
    {
      value: 'messages',
      label: 'Messages',
      icon: MessageCircle,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 border-cyan-200',
      hoverColor: 'hover:bg-cyan-100',
      count: notifications['messages']?.count || 0,
      hasNew: notifications['messages']?.hasNew || false
    },
    {
      value: 'logs',
      label: 'Journaux',
      icon: History,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 border-gray-200',
      hoverColor: 'hover:bg-gray-100',
      count: 0,
      hasNew: false
    },
    {
      value: 'settings',
      label: 'Paramètres',
      icon: Settings,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 border-indigo-200',
      hoverColor: 'hover:bg-indigo-100',
      count: 0,
      hasNew: false
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <SubAdminHeader />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 bg-gray-50 p-2 gap-1 h-auto">
            {tabConfig.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              const isBlinking = blinkingTabs[tab.value] && tab.hasNew;
              
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`
                    relative flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200 min-h-[80px]
                    data-[state=active]:bg-white data-[state=active]:shadow-md
                    ${isActive ? `${tab.bgColor} ${tab.color} border` : 'hover:bg-gray-100 text-gray-600'}
                    ${tab.hoverColor}
                    ${isBlinking ? 'animate-pulse bg-red-100 border-red-300' : ''}
                  `}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? tab.color : 'text-gray-500'}`} />
                    {tab.hasNew && tab.count > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs animate-bounce"
                      >
                        {tab.count > 99 ? '99+' : tab.count}
                      </Badge>
                    )}
                  </div>
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
