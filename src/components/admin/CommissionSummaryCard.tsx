import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Award, Users, Wallet, UserCheck } from "lucide-react";
import { AdminDashboardStats } from "@/hooks/useAdminDashboardData";

interface CommissionSummaryCardProps {
  data: AdminDashboardStats;
  isLoading: boolean;
}

const CommissionSummaryCard = ({ data, isLoading }: CommissionSummaryCardProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const averageCommission = data.totalAgents > 0 ? data.totalCommissions / data.totalAgents : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Solde Admin</p>
              <p className="text-2xl font-bold text-emerald-600">
                {data.adminBalance.toLocaleString()} XAF
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <Wallet className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Utilisateurs</p>
              <p className="text-2xl font-bold text-slate-600">
                {data.activeUsers}/{data.totalUsers}
              </p>
            </div>
            <div className="p-3 bg-slate-100 rounded-full">
              <UserCheck className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Commissions Totales</p>
              <p className="text-2xl font-bold text-green-600">
                {data.totalCommissions.toLocaleString()} XAF
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Volume Total</p>
              <p className="text-2xl font-bold text-blue-600">
                {(data.totalVolume / 1000000).toFixed(1)}M XAF
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Agents Actifs</p>
              <p className="text-2xl font-bold text-purple-600">
                {data.activeAgents}/{data.totalAgents}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Meilleur Agent</p>
              <p className="text-lg font-bold text-yellow-600">
                {data.topAgent?.agent_name || 'Aucun'}
              </p>
              {data.topAgent && (
                <p className="text-sm text-muted-foreground">
                  {data.topAgent.total_earnings.toLocaleString()} XAF
                </p>
              )}
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionSummaryCard;