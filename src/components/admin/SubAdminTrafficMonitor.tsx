import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils/currency";

interface TrafficData {
  date: string;
  total_recharges: number;
  total_withdrawals: number;
  total_transfers: number;
  total_new_users: number;
  total_active_users: number;
  total_revenue: number;
}

export const SubAdminTrafficMonitor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    return lastWeek.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('total_revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchTrafficData();
  }, [startDate, endDate, selectedMetric, sortOrder]);

  const fetchTrafficData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('traffic_summary')
        .select('*')
        .eq('sub_admin_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order(selectedMetric, { ascending: sortOrder === 'asc' });

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    if (type === 'start') {
      setStartDate(e.target.value);
    } else {
      setEndDate(e.target.value);
    }
  };

  const handleSortOrderChange = () => {
    setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
  };

  const getTotal = (metric: keyof TrafficData): number => {
    return trafficData.reduce((acc, curr) => acc + (curr[metric] as number), 0);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Surveillance du Trafic
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="startDate">Début:</Label>
            <Input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => handleDateChange(e, 'start')}
            />
            <Label htmlFor="endDate">Fin:</Label>
            <Input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => handleDateChange(e, 'end')}
            />
          </div>
          <Button
            onClick={fetchTrafficData}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="details">Détails</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Revenus Totaux</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(getTotal('total_revenue'), 'XAF')}</p>
                  </div>
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-green-700">Nouveaux Utilisateurs</p>
                    <p className="text-2xl font-bold text-green-900">{getTotal('total_new_users')}</p>
                  </div>
                  <Users className="w-6 h-6 text-green-600" />
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-yellow-700">Utilisateurs Actifs</p>
                    <p className="text-2xl font-bold text-yellow-900">{getTotal('total_active_users')}</p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="details" className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1 cursor-pointer" onClick={handleSortOrderChange}>
                        Revenus
                        {selectedMetric === 'total_revenue' && (
                          <>
                            {sortOrder === 'asc' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                          </>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recharges
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Retraits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transferts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nouveaux Utilisateurs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateurs Actifs
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trafficData.map((item) => (
                    <tr key={item.date}>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(item.total_revenue, 'XAF')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.total_recharges}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.total_withdrawals}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.total_transfers}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.total_new_users}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.total_active_users}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {trafficData.length === 0 && (
              <div className="text-center p-4">
                <AlertCircle className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Aucune donnée de trafic disponible pour cette période.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
