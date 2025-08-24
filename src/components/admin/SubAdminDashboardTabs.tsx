
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CircleDollarSign, Users, UserPlus, Package, ScrollText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import SubAdminRechargeTab from './SubAdminRechargeTab';
import SubAdminUsersManagement from './SubAdminUsersManagement';
import SubAdminReferralsTab from './SubAdminReferralsTab';
import SubAdminInventoryTab from './SubAdminInventoryTab';
import SubAdminLogsTab from './SubAdminLogsTab';

const SubAdminDashboardTabs = () => {
  const { user } = useAuth();

  // Récupérer les statistiques réelles depuis la base de données
  const { data: stats, isLoading } = useQuery({
    queryKey: ['sub-admin-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Récupérer les utilisateurs totaux
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, created_at, role')
        .neq('role', 'admin');

      // Récupérer les nouveaux utilisateurs de ce mois
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const newUsers = usersData?.filter(user => 
        new Date(user.created_at) >= startOfMonth
      ).length || 0;

      // Récupérer les revenus totaux (somme des recharges approuvées)
      const { data: revenueData } = await supabase
        .from('user_requests')
        .select('amount')
        .eq('status', 'approved')
        .eq('operation_type', 'recharge');

      const totalRevenue = revenueData?.reduce((sum, item) => sum + item.amount, 0) || 0;

      // Récupérer les commandes traitées (transferts complétés)
      const { data: ordersData } = await supabase
        .from('transfers')
        .select('id')
        .eq('status', 'completed');

      return {
        totalUsers: usersData?.length || 0,
        newUsers,
        totalRevenue,
        ordersProcessed: ordersData?.length || 0
      };
    },
    enabled: !!user?.id
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="stats" className="space-y-4">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="stats">Statistiques</TabsTrigger>
        <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        <TabsTrigger value="referrals">Parrainages</TabsTrigger>
        <TabsTrigger value="recharge">Recharges</TabsTrigger>
        <TabsTrigger value="inventory">Inventaire</TabsTrigger>
        <TabsTrigger value="logs">Journaux</TabsTrigger>
      </TabsList>

      <TabsContent value="stats" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">+20,1% par rapport au mois dernier</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nouveaux Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.newUsers || 0}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">+10% par rapport au mois dernier</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs Totaux</CardTitle>
              <UserPlus className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">+12% par rapport au mois dernier</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes Traitées</CardTitle>
              <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.ordersProcessed || 0}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">+19% par rapport au mois dernier</p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="users">
        <SubAdminUsersManagement />
      </TabsContent>

      <TabsContent value="referrals">
        <SubAdminReferralsTab />
      </TabsContent>

      <TabsContent value="recharge" className="space-y-4">
        <SubAdminRechargeTab />
      </TabsContent>

      <TabsContent value="inventory">
        <SubAdminInventoryTab />
      </TabsContent>

      <TabsContent value="logs">
        <SubAdminLogsTab />
      </TabsContent>
    </Tabs>
  );
};

export default SubAdminDashboardTabs;
