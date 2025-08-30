import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Menu,
  X,
  Bell,
  LogOut,
  Wallet,
  TrendingUp,
  UserCheck,
  DollarSign
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import SubAdminStatsDisplay from './SubAdminStatsDisplay';
import SubAdminUsersTable from './SubAdminUsersTable';
import SubAdminBalanceRecharge from './SubAdminBalanceRecharge';
import SubAdminAgentRecharge from './SubAdminAgentRecharge';
import SubAdminMessagesTab from './SubAdminMessagesTab';
import SubAdminSettingsTab from './SubAdminSettingsTab';
import { UnifiedNotificationBell } from '@/components/notifications/UnifiedNotificationBell';

const MobileSubAdminDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'recharge', label: 'Recharge', icon: CreditCard },
    { id: 'agents', label: 'Agents', icon: UserCheck },
    { id: 'messages', label: 'Messages', icon: Bell },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <SubAdminStatsDisplay />;
      case 'users':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Gestion des utilisateurs</h2>
            <p className="text-muted-foreground">
              Interface de gestion des utilisateurs en cours de développement.
            </p>
          </div>
        );
      case 'recharge':
        return <SubAdminBalanceRecharge />;
      case 'agents':
        return <SubAdminAgentRecharge />;
      case 'messages':
        return <SubAdminMessagesTab />;
      case 'settings':
        return <SubAdminSettingsTab />;
      default:
        return <SubAdminStatsDisplay />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header Mobile */}
      <header className="bg-white/90 backdrop-blur-sm border-b shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-primary">SubAdmin Panel</h1>
              <p className="text-xs text-muted-foreground">{profile?.full_name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <UnifiedNotificationBell />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden">
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-primary">Navigation</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    className="w-full justify-start mb-1"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsSidebarOpen(false);
                    }}
                  >
                    <tab.icon className="h-4 w-4 mr-3" />
                    {tab.label}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 bg-white/90 backdrop-blur-sm border-r shadow-sm">
          <div className="p-4">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-primary">SubAdmin Panel</h2>
              <p className="text-sm text-muted-foreground">{profile?.full_name}</p>
            </div>
            
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className="h-4 w-4 mr-3" />
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-6">
          {/* Mobile Tab Bar */}
          <div className="md:hidden mb-4">
            <ScrollArea>
              <div className="flex gap-2 pb-2">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "outline"}
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <tab.icon className="h-3 w-3 mr-2" />
                    {tab.label}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              {tabs.find(tab => tab.id === activeTab)?.icon && (
                React.createElement(tabs.find(tab => tab.id === activeTab)!.icon, {
                  className: "h-5 w-5 text-primary"
                })
              )}
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                {tabs.find(tab => tab.id === activeTab)?.label}
              </h1>
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MobileSubAdminDashboard;