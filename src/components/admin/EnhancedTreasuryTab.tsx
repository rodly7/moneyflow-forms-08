
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TreasuryDashboard from "@/components/treasury/TreasuryDashboard";
import { formatCurrency } from "@/lib/utils/currency";

interface TreasuryStats {
  totalBalance: number;
  totalAgents: number;
  totalReserves: number;
  monthlyFlow: number;
}

const EnhancedTreasuryTab = () => {
  const { data: treasuryStats, isLoading } = useQuery({
    queryKey: ["treasury-stats"],
    queryFn: async () => {
      // Get total balance from profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('balance');

      // Get total agents
      const { data: agents } = await supabase
        .from('agents')
        .select('id');

      const totalBalance = profiles?.reduce((sum, profile) => sum + (profile.balance || 0), 0) || 0;
      const totalAgents = agents?.length || 0;

      const stats: TreasuryStats = {
        totalBalance,
        totalAgents,
        totalReserves: totalBalance * 0.1, // 10% reserves
        monthlyFlow: 0 // TODO: Calculate from transactions
      };

      return stats;
    },
  });

  const handleRefresh = () => {
    // Placeholder refresh function
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {treasuryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Balance Totale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(treasuryStats.totalBalance)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Agents Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {treasuryStats.totalAgents}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Réserves</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(treasuryStats.totalReserves)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Flux Mensuel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(treasuryStats.monthlyFlow)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <TreasuryDashboard onRefresh={handleRefresh} />
    </div>
  );
};

export default EnhancedTreasuryTab;
