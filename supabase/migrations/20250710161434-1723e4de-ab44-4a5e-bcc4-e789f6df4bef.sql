-- Create agent_locations table for real-time agent geolocation tracking
CREATE TABLE public.agent_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  address TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  zone TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create location_history table for tracking agent movement history  
CREATE TABLE public.agent_location_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  address TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system_status table for system health monitoring
CREATE TABLE public.system_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status_type TEXT NOT NULL, -- 'operational', 'maintenance', 'degraded', 'offline'
  component TEXT NOT NULL, -- 'transfers', 'deposits', 'withdrawals', 'authentication', 'notifications'
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.agent_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_status ENABLE ROW LEVEL SECURITY;

-- Create policies for agent_locations
CREATE POLICY "Agents can view and update their own location" 
ON public.agent_locations 
FOR ALL 
USING (auth.uid() = agent_id)
WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Admins can manage all agent locations" 
ON public.agent_locations 
FOR ALL 
USING (is_admin_or_sub_admin(auth.uid()));

-- Create policies for agent_location_history
CREATE POLICY "Agents can view their own location history" 
ON public.agent_location_history 
FOR SELECT 
USING (auth.uid() = agent_id);

CREATE POLICY "Agents can insert their own location history" 
ON public.agent_location_history 
FOR INSERT 
WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Admins can view all location history" 
ON public.agent_location_history 
FOR ALL 
USING (is_admin_or_sub_admin(auth.uid()));

-- Create policies for system_status
CREATE POLICY "Everyone can view system status" 
ON public.system_status 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage system status" 
ON public.system_status 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_agent_locations_agent_id ON public.agent_locations(agent_id);
CREATE INDEX idx_agent_locations_is_active ON public.agent_locations(is_active);
CREATE INDEX idx_agent_location_history_agent_id ON public.agent_location_history(agent_id);
CREATE INDEX idx_agent_location_history_timestamp ON public.agent_location_history(timestamp);
CREATE INDEX idx_system_status_component ON public.system_status(component);
CREATE INDEX idx_system_status_is_active ON public.system_status(is_active);

-- Create function to update location and add to history
CREATE OR REPLACE FUNCTION public.update_agent_location(
  p_agent_id UUID,
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_address TEXT,
  p_zone TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update or insert current location
  INSERT INTO agent_locations (agent_id, latitude, longitude, address, zone, is_active)
  VALUES (p_agent_id, p_latitude, p_longitude, p_address, p_zone, true)
  ON CONFLICT (agent_id) 
  DO UPDATE SET 
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    address = EXCLUDED.address,
    zone = EXCLUDED.zone,
    is_active = true,
    updated_at = now();
    
  -- Add to history
  INSERT INTO agent_location_history (agent_id, latitude, longitude, address)
  VALUES (p_agent_id, p_latitude, p_longitude, p_address);
END;
$$;

-- Create function to deactivate agent location
CREATE OR REPLACE FUNCTION public.deactivate_agent_location(p_agent_id UUID) 
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE agent_locations 
  SET is_active = false, updated_at = now()
  WHERE agent_id = p_agent_id;
END;
$$;

-- Insert default system status entries
INSERT INTO public.system_status (status_type, component, description) VALUES
('operational', 'transfers', 'Service de transferts d''argent'),
('operational', 'deposits', 'Service de dépôts'),
('operational', 'withdrawals', 'Service de retraits'),
('operational', 'authentication', 'Service d''authentification'),
('operational', 'notifications', 'Service de notifications'),
('operational', 'geolocation', 'Service de géolocalisation des agents');

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_status;