
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Target, TrendingUp, Calendar, Award, MapPin, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AgentDailyHistory from "@/components/agent/AgentDailyHistory";
import AgentCommissions from "@/components/agent/AgentCommissions";
import AgentYesterdaySummary from "@/components/agent/AgentYesterdaySummary";
import AgentPersonalChallenge from "@/components/agent/AgentPersonalChallenge";
import AgentZoneAnalysis from "@/components/agent/AgentZoneAnalysis";
import AgentRanking from "@/components/agent/AgentRanking";
import AgentEarningsCard from "@/components/agent/AgentEarningsCard";

const AgentPerformanceDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!profile || profile.role !== 'agent') {
      navigate('/dashboard');
      toast({
        title: "Accès refusé", 
        description: "Cette page est réservée aux agents",
        variant: "destructive"
      });
    }
  }, [profile, navigate, toast]);

  if (!profile || profile.role !== 'agent') {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full">
        <div className="flex items-center justify-between mb-6 w-full">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/agent-dashboard')}
              className="hover:bg-white/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Tableau de Performance
            </h1>
          </div>
        </div>

        <Tabs defaultValue="earnings" className="space-y-6 w-full">
          <TabsList className="grid w-full grid-cols-7 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl h-14">
            <TabsTrigger value="earnings" className="flex items-center gap-2 h-10">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Revenus</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 h-10">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Historique</span>
            </TabsTrigger>
            <TabsTrigger value="commissions" className="flex items-center gap-2 h-10">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Commissions</span>
            </TabsTrigger>
            <TabsTrigger value="yesterday" className="flex items-center gap-2 h-10">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Hier</span>
            </TabsTrigger>
            <TabsTrigger value="challenge" className="flex items-center gap-2 h-10">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Défi</span>
            </TabsTrigger>
            <TabsTrigger value="zones" className="flex items-center gap-2 h-10">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Zones</span>
            </TabsTrigger>
            <TabsTrigger value="ranking" className="flex items-center gap-2 h-10">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Classement</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earnings" className="w-full">
            <AgentEarningsCard />
          </TabsContent>

          <TabsContent value="history" className="w-full">
            <AgentDailyHistory />
          </TabsContent>

          <TabsContent value="commissions" className="w-full">
            <AgentCommissions />
          </TabsContent>

          <TabsContent value="yesterday" className="w-full">
            <AgentYesterdaySummary />
          </TabsContent>

          <TabsContent value="challenge" className="w-full">
            <AgentPersonalChallenge />
          </TabsContent>

          <TabsContent value="zones" className="w-full">
            <AgentZoneAnalysis />
          </TabsContent>

          <TabsContent value="ranking" className="w-full">
            <AgentRanking />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentPerformanceDashboard;
