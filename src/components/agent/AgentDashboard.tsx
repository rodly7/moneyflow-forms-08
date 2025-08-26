import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/currency';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Wallet,
  TrendingUp,
  DollarSign,
  Users,
  UserPlus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AgentStatsCard from './AgentStatsCard';

interface AgentStats {
  todayTransactions: number;
  todayCommissions: number;
  totalAgents: number;
  pendingRequests: number;
}

const AgentDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AgentStats>({
    todayTransactions: 0,
    todayCommissions: 0,
    totalAgents: 0,
    pendingRequests: 0,
  });
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [newAgentData, setNewAgentData] = useState({
    email: '',
    password: '',
    country: profile?.country || 'Cameroun',
  });

  useEffect(() => {
    if (!user || profile?.role !== 'agent') {
      navigate('/login');
    } else {
      fetchAgentStats();
    }
  }, [user, profile, navigate]);

  const fetchAgentStats = async () => {
    try {
      // Fetch today's transactions and commissions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('operations')
        .select('*')
        .eq('agent_id', user!.id)
        .gte('created_at', new Date().toISOString().slice(0, 10));

      if (transactionsError) throw transactionsError;

      const todayTransactions = transactionsData?.length || 0;
      const todayCommissions = transactionsData?.reduce((sum, op) => sum + (op.agent_commission || 0), 0) || 0;

      // Fetch total agents created by this agent
      const { data: agentsData, error: agentsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('created_by', user!.id)
        .eq('role', 'agent');

      if (agentsError) throw agentsError;

      const totalAgents = agentsData?.length || 0;

      // Fetch pending agent requests
      const { data: pendingData, error: pendingError } = await supabase
        .from('profiles')
        .select('*')
        .eq('created_by', user!.id)
        .eq('role', 'agent')
        .eq('is_active', false);

      if (pendingError) throw pendingError;

      const pendingRequests = pendingData?.length || 0;

      setStats({
        todayTransactions,
        todayCommissions,
        totalAgents,
        pendingRequests,
      });

    } catch (error: any) {
      console.error("Error fetching agent stats:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques de l'agent",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setNewAgentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAgentData.email || !newAgentData.password) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingAgent(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-agent', {
        body: {
          email: newAgentData.email,
          password: newAgentData.password,
          country: newAgentData.country,
          created_by: user!.id,
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Agent créé",
        description: `L'agent ${newAgentData.email} a été créé avec succès`,
      });

      // Reset form and refetch stats
      setNewAgentData({
        email: '',
        password: '',
        country: profile?.country || 'Cameroun',
      });
      fetchAgentStats();

    } catch (error: any) {
      console.error('Agent creation error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de l'agent",
        variant: "destructive"
      });
    } finally {
      setIsCreatingAgent(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-green-600" />
            Votre solde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-800">
            {formatCurrency(profile?.balance || 0, 'XAF')}
          </div>
          <Badge variant="secondary" className="mt-2">
            Agent vérifié
          </Badge>
        </CardContent>
      </Card>

      {/* Agent Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <AgentStatsCard
          title="Transactions aujourd'hui"
          value={stats.todayTransactions}
          icon={TrendingUp}
        />
        <AgentStatsCard
          title="Commissions du jour"
          value={formatCurrency(stats.todayCommissions, 'XAF')}
          icon={DollarSign}
        />
        <AgentStatsCard
          title="Agents créés"
          value={stats.totalAgents}
          icon={Users}
        />
        <AgentStatsCard
          title="Demandes en attente"
          value={stats.pendingRequests}
          icon={UserPlus}
        />
      </div>

      {/* Create Agent Form */}
      <Card>
        <CardHeader>
          <CardTitle>Créer un nouvel agent</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAgent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email de l'agent *</Label>
              <Input
                id="email"
                type="email"
                placeholder="agent@example.com"
                value={newAgentData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mot de passe"
                value={newAgentData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Pays *</Label>
              <Select
                value={newAgentData.country}
                onValueChange={(value) => handleInputChange('country', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir le pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cameroun">Cameroun</SelectItem>
                  <SelectItem value="Sénégal">Sénégal</SelectItem>
                  {/* Add other countries as needed */}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isCreatingAgent}
            >
              {isCreatingAgent ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Création...
                </>
              ) : (
                "Créer l'agent"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentDashboard;
