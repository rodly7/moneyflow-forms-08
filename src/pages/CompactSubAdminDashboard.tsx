
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  Settings,
  MessageSquare,
  BarChart3,
  UserCheck,
  Bell,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SubAdminUsersTab from '@/components/admin/SubAdminUsersTab';
import SubAdminAgentsTab from '@/components/admin/SubAdminAgentsTab';
import SubAdminStatsTab from '@/components/admin/SubAdminStatsTab';
import SubAdminRechargeTab from '@/components/admin/SubAdminRechargeTab';
import SubAdminMessagesTab from '@/components/admin/SubAdminMessagesTab';
import SubAdminSettingsTab from '@/components/admin/SubAdminSettingsTab';
import LogoutButton from '@/components/auth/LogoutButton';

const CompactSubAdminDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-[30px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Chargement...</h2>
          <p className="text-gray-600">Veuillez patienter...</p>
        </div>
      </div>
    );
  }

  if (profile.role !== 'sub_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-[30px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Accès refusé</h2>
          <p className="text-gray-600">Vous n'avez pas les autorisations nécessaires.</p>
        </div>
      </div>
    );
  }

  const userInfo = {
    name: profile?.full_name || 'Sous-Admin',
    avatar: profile?.avatar_url,
    initials: profile?.full_name?.[0]?.toUpperCase() || 'SA',
    phone: profile?.phone || ''
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-[30px]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-[30px] z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={userInfo.avatar} />
                <AvatarFallback className="bg-purple-100 text-purple-600">
                  {userInfo.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {userInfo.name}
                </h1>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  Sous-Administrateur
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/notifications')}
              >
                <Bell className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleRefresh}
                variant="ghost"
                size="sm"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="px-4 py-6 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-none lg:inline-flex">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Utilisateurs</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Agents</span>
            </TabsTrigger>
            <TabsTrigger value="recharge" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Recharges</span>
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

          <TabsContent value="dashboard" className="space-y-6">
            <SubAdminStatsTab />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <SubAdminUsersTab />
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            <SubAdminAgentsTab />
          </TabsContent>

          <TabsContent value="recharge" className="space-y-6">
            <SubAdminRechargeTab />
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <SubAdminMessagesTab />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SubAdminSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CompactSubAdminDashboard;
