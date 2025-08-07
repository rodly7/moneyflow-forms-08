import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, XCircle, TrendingUp, Calendar } from "lucide-react";
import { AdminDashboardStats } from "@/hooks/useAdminDashboardData";

interface AnomaliesCardProps {
  anomalies: AdminDashboardStats['anomalies'];
  isLoading: boolean;
}

const AnomaliesCard = ({ anomalies, isLoading }: AnomaliesCardProps) => {
  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'cancelled_transfer':
        return <XCircle className="w-4 h-4" />;
      case 'high_volume':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getAnomalyColor = (type: string) => {
    switch (type) {
      case 'cancelled_transfer':
        return 'bg-red-100 text-red-800';
      case 'high_volume':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getAnomalyTypeText = (type: string) => {
    switch (type) {
      case 'cancelled_transfer':
        return 'Annulé';
      case 'high_volume':
        return 'Volume élevé';
      default:
        return 'Suspect';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Journal des Anomalies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Journal des Anomalies ({anomalies.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {anomalies.map((anomaly) => (
            <div 
              key={anomaly.id}
              className="flex items-start gap-3 p-3 bg-card border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className={`p-2 rounded-full ${getAnomalyColor(anomaly.type)}`}>
                {getAnomalyIcon(anomaly.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={getAnomalyColor(anomaly.type)}>
                    {getAnomalyTypeText(anomaly.type)}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {formatDate(anomaly.created_at)}
                  </div>
                </div>
                
                <p className="text-sm text-foreground">
                  {anomaly.description}
                </p>
                
                {anomaly.amount && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Montant: {anomaly.amount.toLocaleString()} XAF
                  </p>
                )}
              </div>
            </div>
          ))}

          {anomalies.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune anomalie détectée</p>
              <p className="text-xs mt-1">C'est une bonne nouvelle !</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnomaliesCard;