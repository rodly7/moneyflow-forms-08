import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Activity, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useSystemMetrics } from "@/hooks/useSystemMetrics";

const SystemMetricsCard = () => {
  const { data: metrics, isLoading } = useSystemMetrics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Métriques Système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const getSystemStatusColor = () => {
    const operationalComponents = metrics.systemStatus.filter(s => s.status_type === 'operational').length;
    const totalComponents = metrics.systemStatus.length;
    
    if (operationalComponents === totalComponents) return 'bg-green-500';
    if (operationalComponents >= totalComponents * 0.8) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSystemStatusText = () => {
    const operationalComponents = metrics.systemStatus.filter(s => s.status_type === 'operational').length;
    const totalComponents = metrics.systemStatus.length;
    
    if (operationalComponents === totalComponents) return 'Opérationnel';
    if (operationalComponents >= totalComponents * 0.8) return 'Dégradé';
    return 'Problèmes';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Métriques Temps Réel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Utilisateurs en ligne */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-full">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Utilisateurs en ligne</p>
              <p className="text-xs text-blue-700">
                {metrics.onlineUsers.agents.length} agents • {metrics.onlineUsers.users.length} clients
              </p>
            </div>
          </div>
          <Badge className="bg-blue-500">
            {metrics.onlineUsers.total}
          </Badge>
        </div>

        {/* Agents géolocalisés */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-full">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-900">Agents géolocalisés</p>
              <p className="text-xs text-green-700">Position active</p>
            </div>
          </div>
          <Badge className="bg-green-500">
            {metrics.agentLocations}
          </Badge>
        </div>

        {/* Statut du système */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${getSystemStatusColor()} rounded-full`}>
              {getSystemStatusText() === 'Opérationnel' ? (
                <CheckCircle className="w-4 h-4 text-white" />
              ) : getSystemStatusText() === 'Dégradé' ? (
                <Clock className="w-4 h-4 text-white" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-white" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Statut Système</p>
              <p className="text-xs text-gray-700">
                {metrics.systemStatus.filter(s => s.status_type === 'operational').length}/{metrics.systemStatus.length} services
              </p>
            </div>
          </div>
          <Badge 
            className={
              getSystemStatusText() === 'Opérationnel' ? 'bg-green-500' :
              getSystemStatusText() === 'Dégradé' ? 'bg-yellow-500' : 'bg-red-500'
            }
          >
            {getSystemStatusText()}
          </Badge>
        </div>

        {/* Anomalies détectées */}
        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-full">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-orange-900">Anomalies récentes</p>
              <p className="text-xs text-orange-700">7 derniers jours</p>
            </div>
          </div>
          <Badge className="bg-orange-500">
            {metrics.anomalies.length}
          </Badge>
        </div>

        {/* Performance des agents */}
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-full">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-900">Agents actifs</p>
              <p className="text-xs text-purple-700">
                Performance moy: {metrics.agentPerformance.averagePerformance.toLocaleString()} XAF
              </p>
            </div>
          </div>
          <Badge className="bg-purple-500">
            {metrics.agentPerformance.activeAgents}/{metrics.agentPerformance.totalAgents}
          </Badge>
        </div>

        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemMetricsCard;