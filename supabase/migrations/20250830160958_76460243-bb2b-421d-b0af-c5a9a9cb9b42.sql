-- Mettre à jour la limite de quota journalier à 500,000 FCFA
CREATE OR REPLACE FUNCTION public.update_agent_daily_quota(
  p_agent_id UUID,
  p_deposit_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_date DATE := CURRENT_DATE;
  current_total NUMERIC;
  quota_limit NUMERIC := 500000; -- 500,000 FCFA
  quota_was_reached BOOLEAN := false;
  quota_just_reached BOOLEAN := false;
BEGIN
  -- Insérer ou mettre à jour le quota journalier
  INSERT INTO agent_daily_quotas (agent_id, date, total_deposits)
  VALUES (p_agent_id, current_date, p_deposit_amount)
  ON CONFLICT (agent_id, date)
  DO UPDATE SET 
    total_deposits = agent_daily_quotas.total_deposits + p_deposit_amount,
    updated_at = now()
  RETURNING total_deposits INTO current_total;
  
  -- Vérifier si le quota était déjà atteint
  SELECT quota_achieved INTO quota_was_reached
  FROM agent_daily_quotas
  WHERE agent_id = p_agent_id AND date = current_date;
  
  -- Vérifier si le quota vient d'être atteint
  IF NOT quota_was_reached AND current_total >= quota_limit THEN
    quota_just_reached := true;
    
    -- Mettre à jour le statut du quota
    UPDATE agent_daily_quotas
    SET 
      quota_achieved = true,
      quota_reached_at = now(),
      updated_at = now()
    WHERE agent_id = p_agent_id AND date = current_date;
  END IF;
  
  -- Retourner true si le quota vient d'être atteint pour la première fois
  RETURN quota_just_reached;
END;
$$;