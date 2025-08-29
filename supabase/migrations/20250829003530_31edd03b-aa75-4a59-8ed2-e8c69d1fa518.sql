-- Corriger la fonction start_user_session pour gérer le cas où auth.uid() est null
CREATE OR REPLACE FUNCTION public.start_user_session(p_user_agent text DEFAULT NULL::text, p_ip_address inet DEFAULT NULL::inet)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  session_id UUID;
  current_user_id UUID;
BEGIN
  -- Vérifier que l'utilisateur est authentifié
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to start a session';
  END IF;
  
  -- Deactivate old sessions for this user
  UPDATE user_sessions 
  SET is_active = false 
  WHERE user_id = current_user_id AND is_active = true;
  
  -- Create new session
  INSERT INTO user_sessions (user_id, user_agent, ip_address)
  VALUES (current_user_id, p_user_agent, p_ip_address)
  RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$;