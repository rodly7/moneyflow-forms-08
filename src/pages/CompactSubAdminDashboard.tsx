import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Zap, FileText, History, BarChart3, User2, Users, MapPin, PackageCheck, ClipboardList, UserPlus, UserMinus, UserCog } from "lucide-react";
import CompactHeader from "@/components/dashboard/CompactHeader";
import CompactStatsGrid from "@/components/dashboard/CompactStatsGrid";
import CompactActionGrid from "@/components/dashboard/CompactActionGrid";
import CompactInfoCard from "@/components/dashboard/CompactInfoCard";
import UserProfileInfo from "@/components/profile/UserProfileInfo";
import { Card, CardContent } from "@/components/ui/card";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const CompactSubAdminDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [territoryStats, setTerritoryStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    pendingWithdrawals: 0,
    totalTransactions: 0,
  });

  const fetchData = useCallback(async () => {
    if (user?.id) {
      setIsLoading(true);
      try {
        // Fetch territory stats
        const { data: statsData, error: statsError } = await supabase.rpc('get_territory_stats', {
          sub_admin_id: user.id
        });

        if (statsError) {
          throw statsError;
        }

        setTerritoryStats({
          totalAgents: statsData?.total_agents || 0,
          activeAgents: statsData?.active_agents || 0,
          pendingWithdrawals: statsData?.pending_withdrawals || 0,
          totalTransactions: statsData?.total_transactions || 0,
        });

      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, [user?.id, toast]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats pour le grid compact
  const statsData = [
    {
      label: "Agents Totaux",
      value: territoryStats.totalAgents.toString(),
      icon: Users,
      gradient: "bg-gradient-to-r from-blue-600 to-cyan-600",
      textColor: "text-blue-100",
    },
    {
      label: "Agents Actifs",
      value: territoryStats.activeAgents.toString(),
      icon: User2,
      gradient: "bg-gradient-to-r from-green-500 to-emerald-500",
      textColor: "text-green-100",
    },
    {
      label: "Retraits en Attente",
      value: territoryStats.pendingWithdrawals.toString(),
      icon: PackageCheck,
      gradient: "bg-gradient-to-r from-yellow-500 to-orange-500",
      textColor: "text-yellow-100",
    },
    {
      label: "Transactions Totales",
      value: territoryStats.totalTransactions.toString(),
      icon: ClipboardList,
      gradient: "bg-gradient-to-r from-purple-500 to-pink-500",
      textColor: "text-purple-100",
    },
  ];

  // Actions pour le sous-admin
  const actionItems = [
    {
      label: "Gérer les Agents",
      icon: UserCog,
      onClick: () => navigate('/manage-agents'),
      variant: "default" as const
    },
    {
      label: "Ajouter un Agent",
      icon: UserPlus,
      onClick: () => navigate('/add-agent'),
      variant: "outline" as const
    },
    {
      label: "Supprimer un Agent",
      icon: UserMinus,
      onClick: () => navigate('/remove-agent'),
      variant: "outline" as const
    },
    {
      label: "Voir l'activité",
      icon: BarChart3,
      onClick: () => navigate('/sub-admin-activity'),
      variant: "outline" as const
    }
  ];

  // Informations pour le sous-admin
  const infoItems = [
    {
      icon: "📍",
      text: "Supervisez l'activité des agents dans votre territoire."
    },
    {
      icon: "📊",
      text: "Analysez les performances pour optimiser les opérations."
    },
    {
      icon: "🛡️",
      text: "Assurez la conformité et la sécurité des transactions."
    }
  ];

  return (
    <div className="min-h-screen bg-background p-3">
      <div className="max-w-6xl mx-auto space-y-4">
        <CompactHeader
          title="Espace Sous-Admin"
          subtitle="Gestion territoriale"
          icon={<Shield className="w-4 h-4 text-primary-foreground" />}
          onRefresh={fetchData}
          onSignOut={handleSignOut}
          isLoading={isLoading}
        />

        <div className="bg-card p-3 rounded-lg">
          <UserProfileInfo />
        </div>

        <CompactStatsGrid stats={statsData} />

        <CompactActionGrid
          title="Actions de Gestion"
          titleIcon={Zap}
          actions={actionItems}
        />

        <CompactInfoCard
          title="Informations Utiles"
          titleIcon={Shield}
          items={infoItems}
        />
      </div>
    </div>
  );
};

export default CompactSubAdminDashboard;
