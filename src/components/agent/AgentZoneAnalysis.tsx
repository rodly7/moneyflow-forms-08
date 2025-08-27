import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import { MapPin, TrendingUp, Users, Target } from "lucide-react";

const AgentZoneAnalysis = () => {
  const [zoneData, setZoneData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchZoneData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("zone_analysis")
        .select("*")
        .order("volume", { ascending: false });

      if (error) {
        console.error("Erreur lors de la récupération des données de zone:", error);
        setZoneData([]);
      } else {
        setZoneData(data || []);
      }
    } catch (error) {
      console.error("Erreur inattendue lors de la récupération des données de zone:", error);
      setZoneData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchZoneData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Analyse des Zones
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded-md"></div>
            ))}
          </div>
        ) : zoneData.length === 0 ? (
          <p className="text-center text-muted-foreground">Aucune donnée disponible</p>
        ) : (
          <div className="space-y-4">
            {zoneData.map((zone) => (
              <div
                key={zone.id}
                className="flex items-center justify-between p-3 bg-card border rounded-md"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-semibold">{zone.zone_name}</p>
                    <p className="text-sm text-muted-foreground">{zone.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(zone.volume, "XAF")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {zone.transfers_count} transferts
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentZoneAnalysis;
