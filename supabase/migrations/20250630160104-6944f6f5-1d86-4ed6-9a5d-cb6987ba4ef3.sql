
-- Create table for agent challenges
CREATE TABLE public.agent_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_operations INTEGER NOT NULL,
  current_operations INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  reward_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.agent_challenges ENABLE ROW LEVEL SECURITY;

-- Create policy that allows agents to view their own challenges
CREATE POLICY "Agents can view their own challenges" 
  ON public.agent_challenges 
  FOR SELECT 
  USING (auth.uid() = agent_id);

-- Create policy that allows agents to create their own challenges
CREATE POLICY "Agents can create their own challenges" 
  ON public.agent_challenges 
  FOR INSERT 
  WITH CHECK (auth.uid() = agent_id);

-- Create policy that allows agents to update their own challenges
CREATE POLICY "Agents can update their own challenges" 
  ON public.agent_challenges 
  FOR UPDATE 
  USING (auth.uid() = agent_id);

-- Create policy that allows agents to delete their own challenges
CREATE POLICY "Agents can delete their own challenges" 
  ON public.agent_challenges 
  FOR DELETE 
  USING (auth.uid() = agent_id);

-- Create index for better performance
CREATE INDEX idx_agent_challenges_agent_date ON public.agent_challenges(agent_id, date);
