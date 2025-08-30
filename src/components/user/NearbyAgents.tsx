import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Clock, Navigation } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useActiveAgentLocations } from '@/hooks/useAgentLocations';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NearbyAgent {
  id: string;
  agent_id: string;
  agent_name?: string;
  agent_phone?: string;
  address: string;
  distance: number;
  updated_at: string;
}

const NearbyAgents: React.FC = () => {
  const { location, startTracking, isTracking, error } = useGeolocation();
  const { data: agents = [], isLoading } = useActiveAgentLocations();
  const [nearbyAgents, setNearbyAgents] = useState<NearbyAgent[]>([]);

  // Calculer la distance entre deux points géographiques (formule Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };

  useEffect(() => {
    if (location && agents.length > 0) {
      const agentsWithDistance = agents
        .map(agent => ({
          ...agent,
          distance: calculateDistance(
            location.latitude,
            location.longitude,
            agent.latitude,
            agent.longitude
          )
        }))
        .filter(agent => agent.distance <= 10) // Agents dans un rayon de 10km
        .sort((a, b) => a.distance - b.distance) // Trier par distance croissante
        .slice(0, 5); // Limiter à 5 agents

      setNearbyAgents(agentsWithDistance);
    }
  }, [location, agents]);

  const handleCallAgent = (phone?: string) => {
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  if (!isTracking && !location) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <MapPin className="h-5 w-5 text-primary" />
            Agents à proximité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Activez votre localisation pour voir les agents proches de vous
            </p>
            <Button onClick={startTracking} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Navigation className="h-4 w-4 mr-2" />
              Activer la géolocalisation
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <MapPin className="h-5 w-5 text-destructive" />
            Agents à proximité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-destructive">{error}</p>
            <Button onClick={startTracking} variant="outline" className="mt-4">
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <MapPin className="h-5 w-5 text-primary" />
            Agents à proximité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
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
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MapPin className="h-5 w-5 text-primary" />
          Agents à proximité
          {nearbyAgents.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {nearbyAgents.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {nearbyAgents.length === 0 ? (
          <div className="text-center py-6">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Aucun agent trouvé dans un rayon de 10km
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {nearbyAgents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">
                      {agent.agent_name || 'Agent'}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {formatDistance(agent.distance)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {agent.address}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Mis à jour {formatDistanceToNow(new Date(agent.updated_at), { 
                      addSuffix: true, 
                      locale: fr 
                    })}
                  </div>
                </div>
                {agent.agent_phone && (
                  <Button
                    size="sm"
                    onClick={() => handleCallAgent(agent.agent_phone)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NearbyAgents;