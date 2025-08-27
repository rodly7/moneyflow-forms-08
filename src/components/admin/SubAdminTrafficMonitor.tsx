import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Activity, 
  Users, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Filter,
  Download,
  BarChart3,
  LineChart,
  PieChart,
  Calendar,
  MapPin,
  Smartphone,
  Globe,
  Wifi,
  WifiOff
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface TrafficData {
  date: string;
  total_users: number;
  active_users: number;
  new_users: number;
  returning_users: number;
  total_transfers: number;
  successful_transfers: number;
  failed_transfers: number;
  total_volume: number;
  average_transfer_amount: number;
  peak_activity_time: string;
  os_distribution: { os: string; percentage: number }[];
  location_distribution: { country: string; percentage: number }[];
  device_distribution: { device: string; percentage: number }[];
  network_distribution: { network: string; percentage: number }[];
}

const SubAdminTrafficMonitor = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const today = new Date();
    return new Date(today.setDate(today.getDate() - 7));
  });
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedMetric, setSelectedMetric] = useState("total_users");
  const [selectedChartType, setSelectedChartType] = useState("line");
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (date: Date | undefined): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchTrafficData = async () => {
    setIsLoading(true);
    try {
      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);

      const { data, error } = await supabase
        .from('traffic_data')
        .select('*')
        .gte('date', formattedStartDate)
        .lte('date', formattedEndDate)
        .order('date', { ascending: true });

      if (error) {
        console.error("Erreur lors de la récupération des données de trafic:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données de trafic",
          variant: "destructive"
        });
        return;
      }

      setTrafficData(data || []);
    } catch (error) {
      console.error("Erreur inattendue:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrafficData();
  }, [startDate, endDate]);

  const handleDownload = () => {
    // Implement CSV or PDF download logic here
    toast({
      title: "Téléchargement",
      description: "Fonctionnalité de téléchargement en cours de développement",
    });
  };

  const getChartData = () => {
    const labels = trafficData.map(item => item.date);
    const data = trafficData.map(item => item[selectedMetric as keyof TrafficData] as number);
    return { labels, data };
  };

  const chartData = getChartData();

  const renderChart = () => {
    if (isLoading) {
      return <div className="text-center py-4">Chargement...</div>;
    }

    if (chartData.labels.length === 0) {
      return <div className="text-center py-4">Aucune donnée disponible pour cette période.</div>;
    }

    // Implement chart rendering logic here based on selectedChartType
    return <div className="text-center py-4">Type de graphique: {selectedChartType} (Implémentation à venir)</div>;
  };

  return (
    <Card className="bg-white shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-semibold">Surveillance du Trafic</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            onClick={fetchTrafficData}
            variant="ghost"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Badge variant="secondary">Sub Admin</Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Date Range Picker */}
          <div>
            <Label htmlFor="dateRange">Période</Label>
            <div className="relative">
              <Calendar
                id="dateRange"
                onSelect={([start, end]) => {
                  setStartDate(start);
                  setEndDate(end);
                }}
                defaultSelected={[startDate, endDate]}
              />
            </div>
          </div>

          {/* Metric Selector */}
          <div>
            <Label htmlFor="metric">Métrique</Label>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner une métrique" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total_users">Total Utilisateurs</SelectItem>
                <SelectItem value="active_users">Utilisateurs Actifs</SelectItem>
                <SelectItem value="new_users">Nouveaux Utilisateurs</SelectItem>
                <SelectItem value="returning_users">Utilisateurs Récurrents</SelectItem>
                <SelectItem value="total_transfers">Total Transferts</SelectItem>
                <SelectItem value="successful_transfers">Transferts Réussis</SelectItem>
                <SelectItem value="failed_transfers">Transferts Échoués</SelectItem>
                <SelectItem value="total_volume">Volume Total</SelectItem>
                <SelectItem value="average_transfer_amount">Montant Moyen Transfert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Chart Type Selector */}
          <div>
            <Label htmlFor="chartType">Type de Graphique</Label>
            <Select value={selectedChartType} onValueChange={setSelectedChartType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Ligne</SelectItem>
                <SelectItem value="bar">Barre</SelectItem>
                <SelectItem value="pie">Camembert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chart Display */}
        <div className="mb-6 border rounded-md p-4">
          {renderChart()}
        </div>

        {/* Download Button */}
        <Button onClick={handleDownload} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Télécharger les Données
        </Button>
      </CardContent>
    </Card>
  );
};

export default SubAdminTrafficMonitor;
