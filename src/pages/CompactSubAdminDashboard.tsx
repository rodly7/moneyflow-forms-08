
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Shield, Zap, BarChart3, User2, Users, PackageCheck, ClipboardList, Settings } from "lucide-react";
import CompactHeader from "@/components/dashboard/CompactHeader";
import CompactStatsGrid from "@/components/dashboard/CompactStatsGrid";
import CompactActionGrid from "@/components/dashboard/CompactActionGrid";
import CompactInfoCard from "@/components/dashboard/CompactInfoCard";
import UserProfileInfo from "@/components/profile/UserProfileInfo";
import { CustomerServiceButton } from "@/components/notifications/CustomerServiceButton";
import { fetchSubAdminStats } from "@/utils/subAdminDashboardQueries";
import SubAdminDashboardTabs from "@/components/admin/SubAdminDashboardTabs";

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
  const [showFullInterface, setShowFullInterface] = useState(false);

  const fetchData = useCallback(async () => {
    if (user?.id) {
      setIsLoading(true);
      try {
        const stats = await fetchSubAdminStats(user.id);
        setTerritoryStats(stats);
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
      label: "Interface Complète",
      icon: Settings,
      onClick: () => setShowFullInterface(!showFullInterface),
      variant: "default" as const
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

  if (showFullInterface) {
    return (
      <div className="min-h-screen bg-background p-3">
        <div className="max-w-7xl mx-auto space-y-4">
          <CompactHeader
            title="Interface Sous-Admin Complète"
            subtitle="Gestion territoriale avancée"
            icon={<Shield className="w-4 h-4 text-primary-foreground" />}
            onRefresh={fetchData}
            onSignOut={handleSignOut}
            isLoading={isLoading}
            customActions={
              <button
                onClick={() => setShowFullInterface(false)}
                className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
              >
                Vue compacte
              </button>
            }
          />

          <div className="flex justify-end mb-4">
            <CustomerServiceButton />
          </div>

          <SubAdminDashboardTabs />
        </div>
      </div>
    );
  }

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

        <div className="flex justify-end mb-4">
          <CustomerServiceButton />
        </div>

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
