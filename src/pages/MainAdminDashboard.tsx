import PWAMainAdminDashboard from '@/components/admin/PWAMainAdminDashboard';
import UserRoleManagement from '@/components/admin/UserRoleManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MainAdminDashboard() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="roles">Gestion des rôles</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <PWAMainAdminDashboard />
        </TabsContent>
        <TabsContent value="roles">
          <UserRoleManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}