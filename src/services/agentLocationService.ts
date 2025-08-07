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

export class AgentLocationService {
  /**
   * Get all active agent locations with agent details
   */
  static async getActiveAgentLocations(): Promise<AgentLocationData[]> {
    try {
      // Return empty array until migration is run
      return [];
    } catch (error) {
      console.error('Error fetching agent locations:', error);
      throw new Error('Failed to fetch agent locations');
    }
  }

  /**
   * Get all agent locations (active and inactive) for admin dashboard
   */
  static async getAllAgentLocations(): Promise<AgentLocationData[]> {
    try {
      // Return empty array until migration is run
      return [];
    } catch (error) {
      console.error('Error fetching all agent locations:', error);
      throw new Error('Failed to fetch agent locations');
    }
  }

  /**
   * Update agent location
   */
  static async updateAgentLocation(
    agentId: string, 
    latitude: number, 
    longitude: number, 
    address: string,
    zone?: string
  ): Promise<void> {
    try {
      // TODO: Implement after migration is run
      console.log('Would update agent location:', { agentId, latitude, longitude, address, zone });
    } catch (error) {
      console.error('Error updating agent location:', error);
      throw new Error('Failed to update agent location');
    }
  }

  /**
   * Deactivate agent location (when agent goes offline)
   */
  static async deactivateAgentLocation(agentId: string): Promise<void> {
    try {
      // TODO: Implement after migration is run
      console.log('Would deactivate agent location:', agentId);
    } catch (error) {
      console.error('Error deactivating agent location:', error);
      throw new Error('Failed to deactivate agent location');
    }
  }

  /**
   * Get location history for a specific agent
   */
  static async getAgentLocationHistory(agentId: string, days: number = 7): Promise<LocationHistoryEntry[]> {
    try {
      // Return empty array until migration is run
      return [];
    } catch (error) {
      console.error('Error fetching agent location history:', error);
      throw new Error('Failed to fetch location history');
    }
  }

  /**
   * Get agents within a specific radius (in kilometers)
   */
  static async getAgentsNearLocation(
    latitude: number, 
    longitude: number, 
    radiusKm: number = 10
  ): Promise<AgentLocationData[]> {
    try {
      // Return empty array until migration is run
      return [];
    } catch (error) {
      console.error('Error fetching nearby agents:', error);
      throw new Error('Failed to fetch nearby agents');
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private static calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}