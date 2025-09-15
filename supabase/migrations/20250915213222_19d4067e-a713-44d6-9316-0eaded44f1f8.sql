-- Create agent_locations table with proper constraints and function
CREATE TABLE IF NOT EXISTS public.agent_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  address TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  zone TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id)
);

-- Enable Row Level Security
ALTER TABLE public.agent_locations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Agent locations are viewable by everyone" 
ON public.agent_locations 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own location" 
ON public.agent_locations 
FOR UPDATE 
USING (auth.uid() = agent_id);

CREATE POLICY "Users can insert their own location" 
ON public.agent_locations 
FOR INSERT 
WITH CHECK (auth.uid() = agent_id);

-- Create or replace the update_agent_location function
CREATE OR REPLACE FUNCTION public.update_agent_location(
  p_agent_id UUID,
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_address TEXT,
  p_zone TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.agent_locations (
    agent_id,
    latitude,
    longitude,
    address,
    zone,
    is_active,
    updated_at
  )
  VALUES (
    p_agent_id,
    p_latitude,
    p_longitude,
    p_address,
    p_zone,
    true,
    now()
  )
  ON CONFLICT (agent_id)
  DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    address = EXCLUDED.address,
    zone = EXCLUDED.zone,
    is_active = true,
    updated_at = now();
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_agent_locations_updated_at
  BEFORE UPDATE ON public.agent_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();