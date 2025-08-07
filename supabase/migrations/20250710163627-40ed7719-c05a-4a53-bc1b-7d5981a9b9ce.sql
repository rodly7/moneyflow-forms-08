-- Create user_sessions table to track online users
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" 
ON public.user_sessions 
FOR ALL 
USING (is_admin_or_sub_admin(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_is_active ON public.user_sessions(is_active);
CREATE INDEX idx_user_sessions_last_activity ON public.user_sessions(last_activity);

-- Create function to start a user session
CREATE OR REPLACE FUNCTION public.start_user_session(
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_id UUID;
BEGIN
  -- Deactivate old sessions for this user
  UPDATE user_sessions 
  SET is_active = false 
  WHERE user_id = auth.uid() AND is_active = true;
  
  -- Create new session
  INSERT INTO user_sessions (user_id, user_agent, ip_address)
  VALUES (auth.uid(), p_user_agent, p_ip_address)
  RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$;

-- Create function to update session activity
CREATE OR REPLACE FUNCTION public.update_session_activity() 
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_sessions 
  SET last_activity = now()
  WHERE user_id = auth.uid() AND is_active = true;
END;
$$;

-- Create function to end user session
CREATE OR REPLACE FUNCTION public.end_user_session() 
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_sessions 
  SET is_active = false 
  WHERE user_id = auth.uid() AND is_active = true;
END;
$$;