import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  zone?: string;
}

interface UseGeolocationReturn {
  location: LocationData | null;
  isTracking: boolean;
  error: string | null;
  startTracking: () => void;
  stopTracking: () => void;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      // Using a simple reverse geocoding with a free service
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=YOUR_MAPBOX_TOKEN&limit=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          return data.features[0].place_name;
        }
      }
    } catch (error) {
      console.error('Error getting address:', error);
    }
    
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const saveLocationToDatabase = async (locationData: LocationData) => {
    if (!user || profile?.role !== 'agent') return;

    try {
      // TODO: Implement after migration is run
      console.log('Location would be saved:', locationData);
    } catch (error) {
      console.error('Error in saveLocationToDatabase:', error);
    }
  };

  const updateLocation = async () => {
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      
      const address = await getAddressFromCoordinates(latitude, longitude);
      
      const locationData: LocationData = {
        latitude,
        longitude,
        address,
        zone: null // Can be determined based on coordinates or other logic
      };

      setLocation(locationData);
      setError(null);

      // Save to database if user is an agent
      if (profile?.role === 'agent') {
        await saveLocationToDatabase(locationData);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Geolocation error:', err);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      toast({
        title: "Erreur",
        description: "La géolocalisation n'est pas supportée par ce navigateur",
        variant: "destructive"
      });
      return;
    }

    setIsTracking(true);
    updateLocation(); // Get initial position

    // Update location every 5 minutes (300000ms)
    intervalRef.current = setInterval(updateLocation, 300000);

    toast({
      title: "Géolocalisation activée",
      description: "Votre position sera mise à jour toutes les 5 minutes",
    });
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    toast({
      title: "Géolocalisation désactivée",
      description: "Le suivi de position a été arrêté",
    });
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto-start tracking for agents
  useEffect(() => {
    if (profile?.role === 'agent' && !isTracking) {
      startTracking();
    }
  }, [profile?.role]);

  return {
    location,
    isTracking,
    error,
    startTracking,
    stopTracking
  };
};