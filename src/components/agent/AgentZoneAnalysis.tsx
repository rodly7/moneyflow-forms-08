
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, TrendingUp, Users, DollarSign } from 'lucide-react';

interface ZoneData {
  zone: string;
  agents_count: number;
  total_transactions: number;
  total_volume: number;
  avg_commission: number;
}

const AgentZoneAnalysis = () => {
  const [zoneData, setZoneData] = useState<ZoneData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data since zone_analysis table doesn't exist
    const mockZoneData: ZoneData[] = [
      {
        zone: 'Douala Centre',
        agents_count: 15,
        total_transactions: 1250,
        total_volume: 45000000,
        avg_commission: 125000
      },
      {
        zone: 'Yaoundé Centre',
        agents_count: 12,
        total_transactions: 980,
        total_volume: 38000000,
        avg_commission: 110000
      },
      {
        zone: 'Bafoussam',
        agents_count: 8,
        total_transactions: 620,
        total_volume: 22000000,
        avg_commission: 85000
      },
      {
        zone: 'Bamenda',
        agents_count: 6,
        total_transactions: 450,
        total_volume: 16000000,
        avg_commission: 70000
      }
    ];

    setZoneData(mockZoneData);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Analyse par Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <p className="text-gray-500">Chargement...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Analyse par Zone
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {zoneData.map((zone, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">{zone.zone}</h3>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  Performance élevée
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                    <Users className="w-4 h-4" />
                    Agents
                  </div>
                  <div className="font-semibold">{zone.agents_count}</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                    <DollarSign className="w-4 h-4" />
                    Transactions
                  </div>
                  <div className="font-semibold">{zone.total_transactions.toLocaleString()}</div>
                </div>
                
                <div className="text-center">
                  <div className="text-gray-600 mb-1">Volume</div>
                  <div className="font-semibold">{(zone.total_volume / 1000000).toFixed(1)}M XAF</div>
                </div>
                
                <div className="text-center">
                  <div className="text-gray-600 mb-1">Commission moy.</div>
                  <div className="font-semibold">{(zone.avg_commission / 1000).toFixed(0)}k XAF</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentZoneAnalysis;
