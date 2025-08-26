import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, DollarSign, ArrowUpRight, ArrowDownLeft, Calendar, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils/currency";

interface ReportData {
  date: string;
  total_recharges: number;
  total_withdrawals: number;
  total_transfers: number;
  total_new_users: number;
  total_active_users: number;
  total_revenue: number;
}

export const AdminReportsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportType, setReportType] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      let rpcFunctionName = 'get_daily_report';
      if (reportType === 'weekly') {
        rpcFunctionName = 'get_weekly_report';
      } else if (reportType === 'monthly') {
        rpcFunctionName = 'get_monthly_report';
      }

      const { data, error } = await supabase.rpc(rpcFunctionName, {
        p_date: selectedDate,
      });

      if (error) {
        console.error("Erreur lors de la récupération des données:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du rapport",
          variant: "destructive",
        });
        return;
      }

      if (data && data.length > 0) {
        setReportData(data[0]);
      } else {
        setReportData(null);
        toast({
          title: "Aucune donnée",
          description: "Aucune donnée disponible pour cette période",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du chargement des données",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType, selectedDate]);

  const handleDownloadReport = () => {
    // TODO: Implement report download functionality
    toast({
      title: "Téléchargement",
      description: "Fonctionnalité de téléchargement en cours de développement",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Rapports et Statistiques
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <Tabs defaultValue="daily" className="w-[300px]">
            <TabsList>
              <TabsTrigger value="daily" onClick={() => setReportType("daily")}>
                Quotidien
              </TabsTrigger>
              <TabsTrigger value="weekly" onClick={() => setReportType("weekly")}>
                Hebdomadaire
              </TabsTrigger>
              <TabsTrigger value="monthly" onClick={() => setReportType("monthly")}>
                Mensuel
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-[150px]"
            />
            <Button size="sm" onClick={handleDownloadReport}>
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : reportData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center space-x-4">
                <div className="rounded-full p-2 bg-blue-100">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Recharges
                  </p>
                  <p className="text-lg font-semibold">
                    {reportData.total_recharges}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center space-x-4">
                <div className="rounded-full p-2 bg-red-100">
                  <ArrowUpRight className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Retraits
                  </p>
                  <p className="text-lg font-semibold">
                    {reportData.total_withdrawals}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center space-x-4">
                <div className="rounded-full p-2 bg-green-100">
                  <ArrowDownLeft className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Transferts
                  </p>
                  <p className="text-lg font-semibold">
                    {reportData.total_transfers}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center space-x-4">
                <div className="rounded-full p-2 bg-yellow-100">
                  <Users className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Nouveaux Utilisateurs
                  </p>
                  <p className="text-lg font-semibold">
                    {reportData.total_new_users}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center space-x-4">
                <div className="rounded-full p-2 bg-purple-100">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Utilisateurs Actifs
                  </p>
                  <p className="text-lg font-semibold">
                    {reportData.total_active_users}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center space-x-4">
                <div className="rounded-full p-2 bg-orange-100">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Revenu Total
                  </p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(reportData.total_revenue, "XAF")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucune donnée disponible</p>
            <p className="text-sm">
              Veuillez sélectionner une autre date ou type de rapport
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
