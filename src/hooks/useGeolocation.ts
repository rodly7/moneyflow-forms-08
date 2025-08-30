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
      // Utiliser un service de géocodage temporaire ou coordonnées par défaut
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          return data.display_name;
        }
      }
    } catch (error) {
      console.error('Error getting address:', error);
    }
    
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const saveLocationToDatabase = async (locationData: LocationData) => {
    if (!user || profile?.role !== 'agent') return;

    console.log('Attempting to save location for agent:', user.id);
    console.log('Location data:', locationData);

    try {
      const { error } = await supabase.rpc('update_agent_location', {
        p_agent_id: user.id,
        p_latitude: locationData.latitude,
        p_longitude: locationData.longitude,
        p_address: locationData.address || '',
        p_zone: locationData.zone
      });

      if (error) {
        console.error('Error saving location:', error);
        toast({
          title: "Erreur de géolocalisation",
          description: "Impossible de sauvegarder votre position",
          variant: "destructive"
        });
      } else {
        console.log('Location saved successfully for agent:', user.id);
        toast({
          title: "Position mise à jour",
          description: "Votre position a été enregistrée",
        });
      }
    } catch (error) {
      console.error('Error in saveLocationToDatabase:', error);
      toast({
        title: "Erreur de géolocalisation",
        description: "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive"
      });
    }
  };

  const updateLocation = async () => {
    console.log('📍 Tentative de récupération de la position...');
    
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      
      console.log('✅ Position obtenue:', { latitude, longitude });
      
      const address = await getAddressFromCoordinates(latitude, longitude);
      console.log('🏠 Adresse récupérée:', address);
      
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
        console.log('👮‍♂️ Agent détecté - Sauvegarde en base de données');
        await saveLocationToDatabase(locationData);
      } else {
        console.log('👤 Utilisateur non-agent, pas de sauvegarde');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Erreur géolocalisation:', err);
      setError(errorMessage);
    }
  };

  const startTracking = () => {
    console.log('🎯 Début de startTracking - Vérification du navigateur');
    
    if (!navigator.geolocation) {
      const errorMsg = 'La géolocalisation n\'est pas supportée par ce navigateur';
      console.error('❌', errorMsg);
      setError(errorMsg);
      toast({
        title: "Erreur",
        description: errorMsg,
        variant: "destructive"
      });
      return;
    }

    console.log('✅ Navigateur supporte la géolocalisation - Activation du tracking');
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
    console.log('🔍 Géolocalisation - Vérification du profil:', { 
      role: profile?.role, 
      isTracking, 
      user: user?.id 
    });
    
    if (profile?.role === 'agent' && !isTracking) {
      console.log('🚀 Agent détecté - Démarrage automatique de la géolocalisation');
      startTracking();
    }
  }, [profile?.role, isTracking]);

  return {
    location,
    isTracking,
    error,
    startTracking,
    stopTracking
  };
};