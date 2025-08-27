import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Activity, FileText, CreditCard } from "lucide-react";
import SubAdminTrafficMonitor from "@/components/admin/SubAdminTrafficMonitor";
import SubAdminReferralsTab from "@/components/admin/SubAdminReferralsTab";
import AdminReportsTab from "@/components/admin/AdminReportsTab";
import UserRequestsManagement from "@/components/admin/UserRequestsManagement";

interface SubAdminDashboardTabsProps {
  subAdminId: string;
}

const SubAdminDashboardTabs = ({ subAdminId }: SubAdminDashboardTabsProps) => {
  const [activeTab, setActiveTab] = useState("traffic");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tableau de Bord Sous-Administrateur</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="traffic" className="space-y-4" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="traffic" className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Trafic</span>
              </TabsTrigger>
              <TabsTrigger value="referrals" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Parrainages</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Rapports</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Gestion Utilisateurs</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="traffic" className="outline-none">
              <SubAdminTrafficMonitor subAdminId={subAdminId} />
            </TabsContent>
            <TabsContent value="referrals" className="outline-none">
              <SubAdminReferralsTab subAdminId={subAdminId} />
            </TabsContent>
            <TabsContent value="reports" className="outline-none">
              <AdminReportsTab />
            </TabsContent>
            <TabsContent value="users" className="outline-none">
              <UserRequestsManagement type="verification" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubAdminDashboardTabs;
