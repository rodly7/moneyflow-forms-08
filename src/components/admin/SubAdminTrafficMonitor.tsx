import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TrafficData {
  id: string;
  timestamp: string;
  users_online: number;
  page_views: number;
  transactions: number;
  response_time: number;
}

interface SubAdminTrafficMonitorProps {
  subAdminId: string;
}

const SubAdminTrafficMonitor = ({ subAdminId }: SubAdminTrafficMonitorProps) => {
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTrafficData = async () => {
    setIsLoading(true);
    try {
      // Mock traffic data since traffic_data table doesn't exist
      // In production, you would query actual traffic metrics from existing tables
      const mockTrafficData: TrafficData[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          users_online: Math.floor(Math.random() * 100) + 1,
          page_views: Math.floor(Math.random() * 1000) + 100,
          transactions: Math.floor(Math.random() * 50) + 1,
          response_time: Math.floor(Math.random() * 100) + 50
        }
      ];

      setTrafficData(mockTrafficData);
    } catch (error) {
      console.error("Erreur lors de la récupération du trafic:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de trafic",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrafficData();
  }, [subAdminId]);

  const refreshData = async () => {
    await fetchTrafficData();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Trafic en Temps Réel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          Trafic en Temps Réel
        </CardTitle>
        <Button variant="outline" size="sm" onClick={refreshData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trafficData.length > 0 ? (
            trafficData.map((data) => (
              <div key={data.id} className="p-4 bg-card border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Date:</strong> {new Date(data.timestamp).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Utilisateurs en ligne:</strong> {data.users_online}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Vues de page:</strong> {data.page_views}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Transactions:</strong> {data.transactions}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Temps de réponse:</strong> {data.response_time} ms
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune donnée de trafic disponible
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubAdminTrafficMonitor;
