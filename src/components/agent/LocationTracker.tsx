import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, AlertCircle, Clock } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';

const LocationTracker: React.FC = () => {
  const { location, isTracking, error, startTracking, stopTracking } = useGeolocation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          Géolocalisation
          <Badge variant={isTracking ? "default" : "secondary"}>
            {isTracking ? "Actif" : "Inactif"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {location && (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Position actuelle</p>
                <p className="text-xs text-muted-foreground">{location.address}</p>
                <p className="text-xs text-muted-foreground">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
              </div>
            </div>

            {location.zone && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Zone: {location.zone}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Mise à jour automatique toutes les 5 minutes</span>
        </div>

        <div className="flex gap-2">
          {!isTracking ? (
            <Button 
              onClick={startTracking} 
              size="sm" 
              className="flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Activer le suivi
            </Button>
          ) : (
            <Button 
              onClick={stopTracking} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Désactiver le suivi
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationTracker;