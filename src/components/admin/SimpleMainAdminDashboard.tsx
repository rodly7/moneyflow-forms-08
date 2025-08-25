
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserCheck, 
  TrendingUp, 
  DollarSign,
  Settings,
  MessageSquare,
  FileText,
  Wallet,
  Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMainAdmin } from '@/hooks/useMainAdmin';
import AdminGlobalStats from './AdminGlobalStats';
import SubAdminRechargeTab from './SubAdminRechargeTab';
import UserRequestsManagement from './UserRequestsManagement';
import AdminUserRequestsOverview from './AdminUserRequestsOverview';
import { SimpleUsersList } from './SimpleUsersList';
import SimpleAgentsTab from './SimpleAgentsTab';
import { SimpleMessagesTab } from './SimpleMessagesTab';
import { SimpleSettingsTab } from './SimpleSettingsTab';
import { SimpleTreasuryTab } from './SimpleTreasuryTab';
import SimpleAdvancedTab from './SimpleAdvancedTab';

const SimpleMainAdminDashboard = () => {
  const { profile } = useAuth();
  const { isMainAdmin } = useMainAdmin();
  
  if (!isMainAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Accès refusé</h3>
          <p className="text-gray-600">Vous n'avez pas les permissions pour accéder à cette section.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Tableau de bord Administrateur Principal</h1>
        <p className="opacity-90">
          Bienvenue {profile?.full_name}. Gérez l'ensemble de la plateforme depuis cette interface.
        </p>
      </div>

      {/* Statistiques globales */}
      <AdminGlobalStats />

      {/* Onglets principaux */}
      <Tabs defaultValue="requests-overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="requests-overview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="user-requests" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Demandes
          </TabsTrigger>
          <TabsTrigger value="recharges" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Recharges
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="treasury" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Trésorerie
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

        {/* Onglet Historique */}
        <TabsContent value="requests-overview">
          <AdminUserRequestsOverview />
        </TabsContent>

        {/* Onglet Demandes utilisateurs */}
        <TabsContent value="user-requests">
          <UserRequestsManagement />
        </TabsContent>

        {/* Onglet Recharges et Retraits */}
        <TabsContent value="recharges">
          <SubAdminRechargeTab />
        </TabsContent>

        {/* Onglet Utilisateurs */}
        <TabsContent value="users">
          <SimpleUsersList />
        </TabsContent>

        {/* Onglet Agents */}
        <TabsContent value="agents">
          <SimpleAgentsTab />
        </TabsContent>

        {/* Onglet Trésorerie */}
        <TabsContent value="treasury">
          <SimpleTreasuryTab />
        </TabsContent>

        {/* Onglet Messages */}
        <TabsContent value="messages">
          <SimpleMessagesTab />
        </TabsContent>

        {/* Onglet Paramètres */}
        <TabsContent value="settings">
          <SimpleSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SimpleMainAdminDashboard;
