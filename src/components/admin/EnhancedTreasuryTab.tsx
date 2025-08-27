import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, TrendingUp, Users, ArrowUpDown, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface TreasuryStats {
  totalDeposits: number;
  totalWithdrawals: number;
  totalTransfers: number;
  totalUsers: number;
}

const EnhancedTreasuryTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [treasuryStats, setTreasuryStats] = useState<TreasuryStats>({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTransfers: 0,
    totalUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const fetchTreasuryStats = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_treasury_stats');
      if (error) {
        console.error("Erreur lors de la récupération des statistiques:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les statistiques",
          variant: "destructive"
        });
        return;
      }
      setTreasuryStats(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du chargement des statistiques",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTreasuryStats();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTreasuryStats();
    setIsRefreshing(false);
  };

  const handleSendMessage = async () => {
    if (!customMessage.trim()) {
      toast({
        title: "Message vide",
        description: "Veuillez entrer un message",
        variant: "destructive"
      });
      return;
    }

    setIsSendingMessage(true);
    try {
      // Envoyer le message à tous les utilisateurs (implémentation à adapter)
      // Exemple: envoi via une fonction Supabase ou un service de notification
      toast({
        title: "Message envoyé",
        description: "Message envoyé à tous les utilisateurs",
      });
      setCustomMessage("");
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <Tabs defaultValue="stats" className="w-full space-y-4">
      <TabsList>
        <TabsTrigger value="stats">Statistiques</TabsTrigger>
        <TabsTrigger value="messages">Messages</TabsTrigger>
      </TabsList>

      <TabsContent value="stats" className="space-y-4">
        <Card className="bg-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-lg font-semibold">
              Aperçu des Finances
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Rafraîchir
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-blue-50 border border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">
                        Dépôts Totaux
                      </p>
                      {isLoading ? (
                        <div className="animate-pulse bg-gray-200 h-6 w-24 rounded"></div>
                      ) : (
                        <p className="text-2xl font-bold">
                          {formatCurrency(treasuryStats.totalDeposits)}
                        </p>
                      )}
                    </div>
                    <Wallet className="w-6 h-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-50 border border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">
                        Retraits Totaux
                      </p>
                      {isLoading ? (
                        <div className="animate-pulse bg-gray-200 h-6 w-24 rounded"></div>
                      ) : (
                        <p className="text-2xl font-bold">
                          {formatCurrency(treasuryStats.totalWithdrawals)}
                        </p>
                      )}
                    </div>
                    <ArrowUpDown className="w-6 h-6 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">
                        Transferts Totaux
                      </p>
                      {isLoading ? (
                        <div className="animate-pulse bg-gray-200 h-6 w-24 rounded"></div>
                      ) : (
                        <p className="text-2xl font-bold">
                          {formatCurrency(treasuryStats.totalTransfers)}
                        </p>
                      )}
                    </div>
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 border border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">
                        Nombre d'Utilisateurs
                      </p>
                      {isLoading ? (
                        <div className="animate-pulse bg-gray-200 h-6 w-24 rounded"></div>
                      ) : (
                        <p className="text-2xl font-bold">
                          {treasuryStats.totalUsers}
                        </p>
                      )}
                    </div>
                    <Users className="w-6 h-6 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="messages">
        <Card className="bg-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-lg font-semibold">
              Envoyer un Message
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="message">Message personnalisé</Label>
                <Textarea
                  id="message"
                  placeholder="Entrez votre message ici"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSendMessage}
                disabled={isSendingMessage}
              >
                {isSendingMessage ? "Envoi en cours..." : "Envoyer le Message"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default EnhancedTreasuryTab;
