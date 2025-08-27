import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  FileText,
  LucideIcon,
  Settings,
  TrendingUp,
  Users,
  ChevronsUpDown,
  BarChart3,
  Target,
  Clock,
  Award
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { useAdminDashboardData } from "@/hooks/useAdminDashboardData";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { AgentRealTimePerformance } from "@/components/agent/AgentRealTimePerformance";
import { AgentBalanceDisplay } from "@/components/agent/AgentBalanceDisplay";
import { AgentEarningsCard } from "@/components/agent/AgentEarningsCard";
import AgentPersonalChallenge from "@/components/agent/AgentPersonalChallenge";
import { AgentDailyHistory } from "@/components/agent/AgentDailyHistory";
import { AgentYesterdaySummary } from "@/components/agent/AgentYesterdaySummary";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon: Icon, color = "text-blue-600" }) => (
  <Card className="hover:shadow-lg transition-shadow duration-200">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${color}`} />
      </div>
    </CardContent>
  </Card>
);

const EnhancedAgentDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Tableau de Bord Agent
              </h1>
              <p className="text-gray-600">
                Bienvenue, {profile.full_name}
              </p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Agent Actif
            </Badge>
          </div>
        </div>

        {/* Balance Display */}
        <AgentBalanceDisplay 
          agentBalance={profile?.balance || 0}
          agentCommissionBalance={0}
          isLoadingBalance={false}
          onRefresh={() => {}}
        />

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="analytics">Analyses</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardCard
                title="Transactions Aujourd'hui"
                value="12"
                icon={DollarSign}
                color="text-green-600"
              />
              <DashboardCard
                title="Volume du Jour"
                value={formatCurrency(450000)}
                icon={TrendingUp}
                color="text-blue-600"
              />
              <DashboardCard
                title="Commissions"
                value={formatCurrency(15000)}
                icon={Award}
                color="text-purple-600"
              />
              <DashboardCard
                title="Clients Actifs"
                value="28"
                icon={Users}
                color="text-orange-600"
              />
            </div>

            {/* Performance Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AgentRealTimePerformance userId={profile?.id || ''} />
              <AgentEarningsCard />
            </div>

            {/* Yesterday Summary */}
            <AgentYesterdaySummary />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Performance Mensuelle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Objectif du mois</span>
                      <span className="font-semibold">{formatCurrency(2000000)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Réalisé</span>
                      <span className="font-semibold text-green-600">{formatCurrency(1650000)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '82.5%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500">82.5% de l'objectif atteint</p>
                  </div>
                </CardContent>
              </Card>

              <AgentPersonalChallenge />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Objectifs et Réalisations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">85%</div>
                    <div className="text-sm text-gray-600">Taux de réussite</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">156</div>
                    <div className="text-sm text-gray-600">Transactions ce mois</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">4.8/5</div>
                    <div className="text-sm text-gray-600">Note client</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Analyse des Tendances</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm">Pic d'activité</span>
                      <span className="font-semibold">14h - 16h</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm">Jour le plus actif</span>
                      <span className="font-semibold">Vendredi</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm">Transaction moyenne</span>
                      <span className="font-semibold">{formatCurrency(75000)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Répartition des Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Transferts d'argent</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                        </div>
                        <span className="text-sm font-semibold">70%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Recharges</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                        </div>
                        <span className="text-sm font-semibold">20%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Retraits</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                        </div>
                        <span className="text-sm font-semibold">10%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <AgentDailyHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedAgentDashboard;
