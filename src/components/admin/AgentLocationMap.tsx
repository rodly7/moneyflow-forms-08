import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Users } from 'lucide-react';

interface AgentLocation {
  id: string;
  agent_id: string;
  latitude: number;
  longitude: number;
  address: string;
  is_active: boolean;
  zone: string | null;
  updated_at: string;
  agent_name?: string;
  agent_phone?: string;
}

interface AgentLocationMapProps {
  agents: AgentLocation[];
  isLoading?: boolean;
}

const AgentLocationMap: React.FC<AgentLocationMapProps> = ({ agents, isLoading }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with a placeholder token (user will need to provide their own)
    mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNrNjI2ZGE3NTAzOWQzbHFyM21raDdmNWQifQ.example'; // Replace with your Mapbox token
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [14.4974, 14.6937], // Centered on Senegal/Central Africa
        zoom: 6,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    } catch (error) {
      console.error('Mapbox initialization error:', error);
    }

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current || !agents.length) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers for each agent
    agents.forEach(agent => {
      if (agent.latitude && agent.longitude) {
        // Create custom marker element
        const markerElement = document.createElement('div');
        markerElement.className = `w-8 h-8 rounded-full border-2 flex items-center justify-center ${
          agent.is_active ? 'bg-green-500 border-green-600' : 'bg-gray-400 border-gray-500'
        }`;
        markerElement.innerHTML = `<div class="w-3 h-3 bg-white rounded-full"></div>`;

        const marker = new mapboxgl.Marker({
          element: markerElement,
          anchor: 'center'
        })
          .setLngLat([agent.longitude, agent.latitude])
          .addTo(map.current!);

        // Create popup with agent info
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div class="p-2">
              <h3 class="font-semibold text-sm">${agent.agent_name || 'Agent'}</h3>
              <p class="text-xs text-gray-600">${agent.agent_phone || ''}</p>
              <p class="text-xs text-gray-500">${agent.address}</p>
              <p class="text-xs ${agent.is_active ? 'text-green-600' : 'text-red-600'}">
                ${agent.is_active ? 'Actif' : 'Inactif'}
              </p>
              <p class="text-xs text-gray-400">
                Mise à jour: ${new Date(agent.updated_at).toLocaleString('fr-FR')}
              </p>
            </div>
          `);

        marker.setPopup(popup);
        markers.current.push(marker);
      }
    });

    // Fit map to show all markers if there are any
    if (agents.length > 0) {
      const coordinates = agents
        .filter(agent => agent.latitude && agent.longitude)
        .map(agent => [agent.longitude, agent.latitude] as [number, number]);

      if (coordinates.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        coordinates.forEach(coord => bounds.extend(coord));
        
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
      }
    }
  }, [agents]);

  const activeAgents = agents.filter(agent => agent.is_active).length;
  const totalAgents = agents.length;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Géolocalisation des Agents
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{activeAgents}/{totalAgents} actifs</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="h-96 bg-muted animate-pulse rounded-b-lg flex items-center justify-center">
            <div className="text-muted-foreground">Chargement de la carte...</div>
          </div>
        ) : (
          <div 
            ref={mapContainer} 
            className="h-96 w-full rounded-b-lg"
            style={{ minHeight: '400px' }}
          />
        )}
        
        {/* Map Legend */}
        <div className="p-4 border-t bg-card">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Agent actif</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span>Agent inactif</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentLocationMap;