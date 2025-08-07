
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, TrendingUp, Users, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/integrations/supabase/client";

interface ZoneData {
  country: string;
  deposits: number;
  withdrawals: number;
  totalAmount: number;
  clientCount: number;
  avgOperationAmount: number;
}

const AgentZoneAnalysis = () => {
  const { user } = useAuth();
  const [zoneData, setZoneData] = useState<ZoneData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  const fetchZoneAnalysis = async (range: 'week' | 'month' | 'year') => {
    if (!user?.id) return;

    try {
      const now = new Date();
      let startDate: Date;

      if (range === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (range === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      }

      // Récupérer les transferts par pays de destination
      const { data: transfers } = await supabase
        .from('transfers')
        .select('recipient_country, amount')
        .eq('sender_id', user.id)
        .gte('created_at', startDate.toISOString())
        .eq('status', 'completed');

      // Récupérer les clients par pays via les recharges
      const { data: deposits } = await supabase
        .from('recharges')
        .select('amount, country, payment_phone')
        .eq('provider_transaction_id', user.id)
        .gte('created_at', startDate.toISOString())
        .eq('status', 'completed');

      // Récupérer les retraits par pays via les profils des clients
      const { data: withdrawalsWithProfile } = await supabase
        .from('withdrawals')
        .select(`
          amount,
          profiles!inner(country)
        `)
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .eq('status', 'completed');

      // Analyser les données par pays
      const countryMap = new Map<string, ZoneData>();

      // Traiter les transferts
      transfers?.forEach(transfer => {
        const country = transfer.recipient_country || 'Inconnu';
        if (!countryMap.has(country)) {
          countryMap.set(country, {
            country,
            deposits: 0,
            withdrawals: 0,
            totalAmount: 0,
            clientCount: 0,
            avgOperationAmount: 0
          });
        }
        const data = countryMap.get(country)!;
        data.totalAmount += Number(transfer.amount);
      });

      // Traiter les dépôts
      const uniqueClients = new Set<string>();
      deposits?.forEach(deposit => {
        const country = deposit.country || 'Inconnu';
        uniqueClients.add(`${country}-${deposit.payment_phone}`);
        
        if (!countryMap.has(country)) {
          countryMap.set(country, {
            country,
            deposits: 0,
            withdrawals: 0,
            totalAmount: 0,
            clientCount: 0,
            avgOperationAmount: 0
          });
        }
        const data = countryMap.get(country)!;
        data.deposits += 1;
        data.totalAmount += Number(deposit.amount);
      });

      // Traiter les retraits
      withdrawalsWithProfile?.forEach(withdrawal => {
        const country = (withdrawal.profiles as any)?.country || 'Inconnu';
        if (!countryMap.has(country)) {
          countryMap.set(country, {
            country,
            deposits: 0,
            withdrawals: 0,
            totalAmount: 0,
            clientCount: 0,
            avgOperationAmount: 0
          });
        }
        const data = countryMap.get(country)!;
        data.withdrawals += 1;
        data.totalAmount += Number(withdrawal.amount);
      });

      // Calculer les métriques finales
      const zonesArray = Array.from(countryMap.values()).map(zone => {
        const totalOps = zone.deposits + zone.withdrawals;
        return {
          ...zone,
          clientCount: Array.from(uniqueClients).filter(client => client.startsWith(zone.country)).length,
          avgOperationAmount: totalOps > 0 ? zone.totalAmount / totalOps : 0
        };
      });

      // Trier par volume total décroissant
      zonesArray.sort((a, b) => b.totalAmount - a.totalAmount);

      setZoneData(zonesArray);
    } catch (error) {
      console.error('Erreur lors de l\'analyse des zones:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchZoneAnalysis(timeRange);
  }, [user?.id, timeRange]);

  const topPerformingZone = zoneData[0];
  const totalVolume = zoneData.reduce((sum, zone) => sum + zone.totalAmount, 0);

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contrôles */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            Analyse des Zones Performantes
          </CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === 'week' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              7 jours
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === 'month' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              30 jours
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === 'year' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              1 an
            </button>
          </div>
        </CardHeader>
      </Card>

      {/* Zone top performer */}
      {topPerformingZone && (
        <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Zone la plus performante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{topPerformingZone.country}</div>
                <div className="text-green-100">Pays</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatCurrency(topPerformingZone.totalAmount, 'XAF')}
                </div>
                <div className="text-green-100">Volume total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {topPerformingZone.deposits + topPerformingZone.withdrawals}
                </div>
                <div className="text-green-100">Opérations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.round((topPerformingZone.totalAmount / totalVolume) * 100)}%
                </div>
                <div className="text-green-100">Du volume total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {zoneData.map((zone, index) => (
          <Card 
            key={zone.country} 
            className={`${
              index === 0 
                ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300' 
                : 'bg-white/80 backdrop-blur-sm border-gray-200'
            } shadow-lg hover:shadow-xl transition-shadow`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className={`w-5 h-5 ${index === 0 ? 'text-yellow-600' : 'text-gray-600'}`} />
                  <span className={index === 0 ? 'text-yellow-800' : 'text-gray-800'}>
                    {zone.country}
                  </span>
                </div>
                {index === 0 && (
                  <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    #1
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-700">{zone.deposits}</div>
                  <div className="text-xs text-blue-600">Dépôts</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-xl font-bold text-red-700">{zone.withdrawals}</div>
                  <div className="text-xs text-red-600">Retraits</div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Volume total:</span>
                  <span className="font-semibold">
                    {formatCurrency(zone.totalAmount, 'XAF')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Opération moyenne:</span>
                  <span className="font-semibold">
                    {formatCurrency(zone.avgOperationAmount, 'XAF')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Part du volume:</span>
                  <span className="font-semibold">
                    {totalVolume > 0 ? Math.round((zone.totalAmount / totalVolume) * 100) : 0}%
                  </span>
                </div>
              </div>
              
              {/* Barre de progression */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gray-400'
                    }`}
                    style={{ 
                      width: `${totalVolume > 0 ? (zone.totalAmount / totalVolume) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {zoneData.length === 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-600">Aucune donnée de zone disponible</p>
            <p className="text-sm text-gray-500">
              Effectuez des opérations pour voir l'analyse des zones performantes
            </p>
          </CardContent>
        </Card>
      )}

      {/* Conseils */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">💡 Conseils pour optimiser vos zones</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• Concentrez-vous sur les pays où vous avez le plus de clients</p>
            <p>• Analysez les tendances pour anticiper les besoins</p>
            <p>• Développez votre réseau dans les zones moins performantes</p>
            <p>• Adaptez vos horaires aux fuseaux horaires de vos clients</p>
            {topPerformingZone && (
              <p>• <strong>{topPerformingZone.country}</strong> est votre zone clé, maintenez ce niveau de service</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentZoneAnalysis;
