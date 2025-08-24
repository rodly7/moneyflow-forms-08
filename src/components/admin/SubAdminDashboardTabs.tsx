
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CircleDollarSign, Users, UserPlus, ChevronsUpDown, Package, ScrollText } from 'lucide-react';
import SubAdminRechargeTab from './SubAdminRechargeTab';

interface StatsCardProps {
  title: string;
  value: string;
  percentageChange: string;
  icon: React.ReactNode;
}

const SubAdminDashboardTabs = () => {
  const [totalUsers, setTotalUsers] = useState(123);
  const [newUsers, setNewUsers] = useState(12);
  const [totalRevenue, setTotalRevenue] = useState("$12,345");
  const [ordersProcessed, setOrdersProcessed] = useState(1234);

  return (
    <Tabs defaultValue="stats" className="space-y-4">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="stats" className="col-span-2 sm:col-span-1">Stats</TabsTrigger>
        <TabsTrigger value="users" className="col-span-2 sm:col-span-1">Users</TabsTrigger>
        <TabsTrigger value="referrals" className="col-span-2 sm:col-span-1">Referrals</TabsTrigger>
        <TabsTrigger value="recharge">Recharge</TabsTrigger>
        <TabsTrigger value="inventory" className="col-span-2 sm:col-span-1">Inventory</TabsTrigger>
        <TabsTrigger value="logs" className="col-span-2 sm:col-span-1">Logs</TabsTrigger>
      </TabsList>

      <TabsContent value="stats" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRevenue}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">+20.1% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Users</CardTitle>
              <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newUsers}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">+10% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <UserPlus className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">+12% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders Processed</CardTitle>
              <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordersProcessed}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">+19% from last month</p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="users">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is the users tab.</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="referrals">
        <Card>
          <CardHeader>
            <CardTitle>Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is the referrals tab.</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="recharge" className="space-y-4">
        <SubAdminRechargeTab />
      </TabsContent>

      <TabsContent value="inventory">
        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is the inventory tab.</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="logs">
        <Card>
          <CardHeader>
            <CardTitle>Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is the logs tab.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default SubAdminDashboardTabs;
