import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Temporary interfaces until migration is run
export interface AgentLocationData {
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
  agent_country?: string;
}

export interface LocationHistoryEntry {
  id: string;
  agent_id: string;
  latitude: number;
  longitude: number;
  address: string;
  timestamp: string;
  agent_name?: string;
}

export const useAgentLocations = () => {
  return useQuery({
    queryKey: ['agent-locations'],
    queryFn: async (): Promise<AgentLocationData[]> => {
      const { data, error } = await supabase
        .from('agent_locations')
        .select(`
          *,
          profiles!agent_locations_agent_id_fkey(full_name, phone, country)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data?.map(location => ({
        ...location,
        agent_name: location.profiles?.full_name,
        agent_phone: location.profiles?.phone,
        agent_country: location.profiles?.country
      })) || [];
    },
    refetchInterval: 30000,
  });
};

export const useActiveAgentLocations = () => {
  return useQuery({
    queryKey: ['active-agent-locations'],
    queryFn: async (): Promise<AgentLocationData[]> => {
      const { data, error } = await supabase
        .from('agent_locations')
        .select(`
          *,
          profiles!agent_locations_agent_id_fkey(full_name, phone, country)
        `)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data?.map(location => ({
        ...location,
        agent_name: location.profiles?.full_name,
        agent_phone: location.profiles?.phone,
        agent_country: location.profiles?.country
      })) || [];
    },
    refetchInterval: 30000,
  });
};

export const useAgentLocationHistory = (agentId: string, days: number = 7) => {
  return useQuery({
    queryKey: ['agent-location-history', agentId, days],
    queryFn: async (): Promise<LocationHistoryEntry[]> => {
      // Return empty array until migration is run
      return [];
    },
    enabled: !!agentId,
  });
};

export const useUpdateAgentLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      agentId, 
      latitude, 
      longitude, 
      address, 
      zone 
    }: {
      agentId: string;
      latitude: number;
      longitude: number;
      address: string;
      zone?: string;
    }) => {
      const { error } = await supabase.rpc('update_agent_location', {
        p_agent_id: agentId,
        p_latitude: latitude,
        p_longitude: longitude,
        p_address: address,
        p_zone: zone
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-locations'] });
      queryClient.invalidateQueries({ queryKey: ['active-agent-locations'] });
    },
  });
};

export const useDeactivateAgentLocation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (agentId: string) => {
      // Placeholder until migration is run
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-locations'] });
      queryClient.invalidateQueries({ queryKey: ['active-agent-locations'] });
      toast({
        title: "Position désactivée",
        description: "La géolocalisation de l'agent a été désactivée",
      });
    },
  });
};

export const useNearbyAgents = (latitude: number, longitude: number, radiusKm: number = 10) => {
  return useQuery({
    queryKey: ['nearby-agents', latitude, longitude, radiusKm],
    queryFn: async (): Promise<AgentLocationData[]> => {
      // Return empty array until migration is run
      return [];
    },
    enabled: !!(latitude && longitude),
  });
};