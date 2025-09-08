import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMainAdmin } from '@/hooks/useMainAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart3, 
  Shield, 
  Users, 
  UserCog, 
  DollarSign, 
  MessageCircle, 
  Settings,
  Menu,
  Home,
  LogOut
} from 'lucide-react';
import { SimpleAdminDashboard } from '@/components/admin/SimpleAdminDashboard';
import { AdminUsersManagement } from '@/components/admin/AdminUsersManagement';
import { AgentManagementPanel } from '@/components/admin/AgentManagementPanel';
import { RevenueAnalytics } from '@/components/admin/RevenueAnalytics';
import PaymentSettingsTab from '@/components/admin/PaymentSettingsTab';
import { SimpleMessagesTab } from '@/components/admin/SimpleMessagesTab';
import { FraudDetectionInterface } from '@/components/admin/FraudDetectionInterface';
import { MerchantTrackingTab } from '@/components/admin/MerchantTrackingTab';
import { UserFraudMonitoring } from '@/components/admin/UserFraudMonitoring';
import LogoutButton from '@/components/auth/LogoutButton';

const PWAMainAdminDashboard = () => {
  const { user, profile } = useAuth();
  const { isMainAdmin } = useMainAdmin();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold mb-2">Chargement...</h2>
            <p className="text-muted-foreground">Authentification en cours...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Accès refusé</h2>
            <p className="text-muted-foreground">Vous n'avez pas les autorisations nécessaires.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isMainAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Accès refusé</h2>
            <p className="text-muted-foreground">Réservé à l'administrateur principal.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Tableau de bord', 
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      id: 'fraud', 
      label: 'Détection Fraude', 
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    { 
      id: 'user-monitoring', 
      label: 'Suivi Utilisateurs', 
      icon: Shield,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    { 
      id: 'users', 
      label: 'Utilisateurs', 
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    { 
      id: 'agents', 
      label: 'Agents', 
      icon: UserCog,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    { 
      id: 'merchants', 
      label: 'Marchands', 
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    { 
      id: 'revenue', 
      label: 'Revenus', 
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    { 
      id: 'messages', 
      label: 'Messages', 
      icon: MessageCircle,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50'
    },
    { 
      id: 'settings', 
      label: 'Paramètres', 
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <SimpleAdminDashboard />;
      case 'fraud':
        return <FraudDetectionInterface />;
      case 'user-monitoring':
        return <UserFraudMonitoring />;
      case 'users':
        return <AdminUsersManagement />;
      case 'agents':
        return <AgentManagementPanel />;
      case 'merchants':
        return <MerchantTrackingTab />;
      case 'revenue':
        return <RevenueAnalytics />;
      case 'messages':
        return <SimpleMessagesTab />;
      case 'settings':
        return <PaymentSettingsTab />;
      default:
        return <SimpleAdminDashboard />;
    }
  };

  const TabNavigation = ({ className = "" }) => (
    <div className={`space-y-2 ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <Button
            key={tab.id}
            variant={isActive ? "default" : "ghost"}
            className={`w-full justify-start gap-3 h-12 ${
              isActive 
                ? `${tab.bgColor} ${tab.color} hover:${tab.bgColor}` 
                : 'hover:bg-muted'
            }`}
            onClick={() => {
              setActiveTab(tab.id);
              setIsMobileMenuOpen(false);
            }}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{tab.label}</span>
          </Button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header Mobile */}
      <header className="sticky top-0 z-50 bg-background border-b lg:hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Home className="w-6 h-6 text-primary" />
                    <h2 className="text-lg font-semibold">Admin Sendflow</h2>
                  </div>
                  
                  <div className="mb-6 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">{profile.full_name}</p>
                    <p className="text-xs text-muted-foreground">{profile.phone}</p>
                    <Badge variant="secondary" className="mt-2">Administrateur Principal</Badge>
                  </div>
                  
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <TabNavigation />
                  </ScrollArea>
                  
                  <div className="pt-4 border-t">
                    <LogoutButton />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-semibold">Administration</h1>
          </div>
          
          <Badge variant="secondary">
            {tabs.find(tab => tab.id === activeTab)?.label}
          </Badge>
        </div>
      </header>

      {/* Header Desktop */}
      <header className="hidden lg:block sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <Home className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Administration Sendflow</h1>
              <p className="text-sm text-muted-foreground">
                Connecté en tant que: {profile.full_name} ({profile.phone})
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-80px)]">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:block w-64 border-r bg-background">
          <div className="p-6">
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <p className="font-medium">{profile.full_name}</p>
              <p className="text-sm text-muted-foreground">{profile.phone}</p>
              <Badge variant="secondary" className="mt-2">Admin Principal</Badge>
            </div>
            
            <ScrollArea className="h-[calc(100vh-250px)]">
              <TabNavigation />
            </ScrollArea>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6">
            {/* Mobile Tab Indicator */}
            <div className="lg:hidden mb-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {React.createElement(tabs.find(tab => tab.id === activeTab)?.icon || BarChart3, {
                      className: `w-5 h-5 ${tabs.find(tab => tab.id === activeTab)?.color}`
                    })}
                    {tabs.find(tab => tab.id === activeTab)?.label}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in-0 duration-200">
              {renderTabContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PWAMainAdminDashboard;