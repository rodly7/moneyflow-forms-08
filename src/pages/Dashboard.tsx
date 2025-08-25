
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BalanceCard from '@/components/dashboard/BalanceCard';
import ActionButtons from '@/components/dashboard/ActionButtons';
import ProfileHeader from '@/components/dashboard/ProfileHeader';
import CompleteRecentTransactions from '@/components/dashboard/CompleteRecentTransactions';
import NotificationsCard from '@/components/notifications/NotificationsCard';
import MonthlyLimitCard from '@/components/dashboard/MonthlyLimitCard';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 space-y-6">
      <div className="max-w-6xl mx-auto">
        <ProfileHeader />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            <BalanceCard />
            <ActionButtons />
            <CompleteRecentTransactions />
          </div>
          
          {/* Colonne latérale */}
          <div className="space-y-6">
            <NotificationsCard />
            <MonthlyLimitCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
