
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  FileText,
  LucideIcon,
  Settings,
  TrendingUp,
  Users,
  ChevronsUpDown
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { useAdminDashboardData } from "@/hooks/useAdminDashboardData";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import AdminReportsTab from "@/components/admin/AdminReportsTab";
import EnhancedTreasuryTab from "@/components/admin/EnhancedTreasuryTab";
import UserRequestsManagement from "@/components/admin/UserRequestsManagement";
import SubAdminRechargeTab from "@/components/admin/SubAdminRechargeTab";
import { AgentBalanceDisplay } from "@/components/agent/AgentBalanceDisplay";
import { AgentQuickActionsGrid } from "@/components/agent/AgentQuickActionsGrid";
import { AgentStatsCard } from "@/components/agent/AgentStatsCard";
import { AgentEarningsCard } from "@/components/agent/AgentEarningsCard";
import { AgentYesterdaySummary } from "@/components/agent/AgentYesterdaySummary";
import { AgentRealTimePerformance } from "@/components/agent/AgentRealTimePerformance";
import AgentRanking from "@/components/agent/AgentRanking";
import AgentZoneAnalysis from "@/components/agent/AgentZoneAnalysis";
import AgentPersonalChallenge from "@/components/agent/AgentPersonalChallenge";
import { AgentDailyHistory } from "@/components/agent/AgentDailyHistory";
import { AgentCommissions } from "@/components/agent/AgentCommissions";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}

const AgentDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile || profile.role !== 'agent') {
      navigate('/auth');
    }
  }, [profile, navigate]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-semibold">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <AgentBalanceDisplay 
          agentBalance={profile?.balance || 0}
          agentCommissionBalance={0}
          isLoadingBalance={false}
          onRefresh={() => {}}
        />
        
        {/* Quick Actions Grid */}
        <AgentQuickActionsGrid />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AgentStatsCard />
          <AgentEarningsCard />
          <AgentYesterdaySummary />
        </div>

        {/* Performance and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AgentRealTimePerformance userId={profile?.id || ''} />
          <AgentRanking />
        </div>

        {/* Zone Analysis and Personal Challenge */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AgentZoneAnalysis />
          <AgentPersonalChallenge />
        </div>

        {/* Recent History */}
        <AgentDailyHistory />
        
        {/* Commissions */}
        <AgentCommissions userId={profile?.id || ''} />
      </div>
    </div>
  );
};

export default AgentDashboard;
