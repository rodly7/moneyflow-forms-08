import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wallet, TrendingUp, TrendingDown, DollarSign, Users, RefreshCw, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils/currency";

interface TreasuryStats {
  totalDeposits: number;
  totalWithdrawals: number;
  totalUsers: number;
  totalBalance: number;
}

export const EnhancedTreasuryTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [treasuryStats, setTreasuryStats] = useState<TreasuryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTreasuryStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('get_treasury_stats');

      if (error) {
        console.error("Erreur lors de la récupération des statistiques:", error);
        setError("Impossible de charger les statistiques de la trésorerie.");
        toast({
          title: "Erreur",
          description: "Impossible de charger les statistiques de la trésorerie.",
          variant: "destructive",
        });
      } else {
        setTreasuryStats(data);
      }
    } catch (error: any) {
      console.error("Erreur inattendue lors de la récupération des statistiques:", error);
      setError("Erreur inattendue lors du chargement des statistiques.");
      toast({
        title: "Erreur",
        description: "Erreur inattendue lors du chargement des statistiques.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTreasuryStats();
  }, [user, toast]);

  return (
    <Tabs defaultValue="overview" className="w-full space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
        {/* <TabsTrigger value="details">Détails</TabsTrigger> */}
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Statistiques de la Trésorerie</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="animate-spin w-6 h-6 text-blue-500" />
                <span className="ml-2">Chargement des statistiques...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center p-8 text-red-500">
                <AlertTriangle className="w-6 h-6 mr-2" />
                {error}
              </div>
            ) : treasuryStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-green-700">Dépôts Totaux</p>
                      <p className="text-2xl font-bold text-green-900">{formatCurrency(treasuryStats.totalDeposits, 'XAF')}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </CardContent>
                </Card>

                <Card className="bg-red-50 border-red-200">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-red-700">Retraits Totaux</p>
                      <p className="text-2xl font-bold text-red-900">{formatCurrency(treasuryStats.totalWithdrawals, 'XAF')}</p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-500" />
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Nombre Total d'Utilisateurs</p>
                      <p className="text-2xl font-bold text-blue-900">{treasuryStats.totalUsers}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </CardContent>
                </Card>

                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-yellow-700">Solde Total</p>
                      <p className="text-2xl font-bold text-yellow-900">{formatCurrency(treasuryStats.totalBalance, 'XAF')}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-yellow-500" />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center p-4">Aucune statistique disponible.</div>
            )}
            <Button onClick={fetchTreasuryStats} disabled={isLoading} className="mt-4 w-full">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Chargement...' : 'Rafraîchir les statistiques'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
      {/* <TabsContent value="details">
        <Card>
          <CardHeader>
            <CardTitle>Détails de la Trésorerie</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full">
              <p>Informations détaillées sur les transactions, les utilisateurs, etc.</p>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent> */}
    </Tabs>
  );
};
