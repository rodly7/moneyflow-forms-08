
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CircleDollarSign, Users, UserPlus, Package, ScrollText } from 'lucide-react';
import SubAdminRechargeTab from './SubAdminRechargeTab';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const SubAdminDashboardTabs = () => {
  const { user } = useAuth();

  // Récupérer les vraies données du dashboard
  const { data: stats, isLoading } = useQuery({
    queryKey: ['subadmin-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Récupérer les utilisateurs
      const { data: users } = await supabase
        .from('profiles')
        .select('id, created_at, role')
        .order('created_at', { ascending: false });

      // Récupérer les recharges aujourd'hui
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: todayRecharges } = await supabase
        .from('recharges')
        .select('amount')
        .gte('created_at', today.toISOString())
        .eq('status', 'completed');

      // Récupérer les transferts aujourd'hui
      const { data: todayTransfers } = await supabase
        .from('transfers')
        .select('amount')
        .gte('created_at', today.toISOString())
        .eq('status', 'completed');

      // Calculer les statistiques
      const totalUsers = users?.length || 0;
      const newUsersToday = users?.filter(u => 
        new Date(u.created_at) >= today
      ).length || 0;

      const todayRevenue = (todayRecharges?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0) +
                          (todayTransfers?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0);

      const ordersProcessed = (todayRecharges?.length || 0) + (todayTransfers?.length || 0);

      return {
        totalUsers,
        newUsersToday,
        todayRevenue,
        ordersProcessed
      };
    },
    enabled: !!user?.id
  });

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
        <TabsTrigger value="stats" className="col-span-2 sm:col-span-1">Statistiques</TabsTrigger>
        <TabsTrigger value="users" className="col-span-2 sm:col-span-1">Utilisateurs</TabsTrigger>
        <TabsTrigger value="referrals" className="col-span-2 sm:col-span-1">Parrainages</TabsTrigger>
        <TabsTrigger value="recharge">Recharges</TabsTrigger>
        <TabsTrigger value="inventory" className="col-span-2 sm:col-span-1">Inventaire</TabsTrigger>
        <TabsTrigger value="logs" className="col-span-2 sm:col-span-1">Journaux</TabsTrigger>
      </TabsList>

      <TabsContent value="stats" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus du Jour</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.todayRevenue?.toLocaleString()} XAF</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Transactions d'aujourd'hui</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nouveaux Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.newUsersToday || 0}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Inscriptions aujourd'hui</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
              <UserPlus className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Utilisateurs enregistrés</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Opérations Traitées</CardTitle>
              <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.ordersProcessed || 0}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Transactions aujourd'hui</p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="users">
        <Card>
          <CardHeader>
            <CardTitle>Gestion des Utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Interface de gestion des utilisateurs en cours de développement.</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="referrals">
        <Card>
          <CardHeader>
            <CardTitle>Système de Parrainage</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Interface de gestion des parrainages en cours de développement.</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="recharge" className="space-y-4">
        <SubAdminRechargeTab />
      </TabsContent>

      <TabsContent value="inventory">
        <Card>
          <CardHeader>
            <CardTitle>Gestion de l'Inventaire</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Interface de gestion de l'inventaire en cours de développement.</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="logs">
        <Card>
          <CardHeader>
            <CardTitle>Journaux Système</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Interface des journaux système en cours de développement.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default SubAdminDashboardTabs;
