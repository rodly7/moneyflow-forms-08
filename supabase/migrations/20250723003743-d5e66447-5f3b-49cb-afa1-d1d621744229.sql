-- Fonction pour transférer les commissions mensuelles vers le solde commission disponible
CREATE OR REPLACE FUNCTION public.transfer_monthly_commissions_to_balance(
  agent_id_param uuid,
  month_param integer DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::integer,
  year_param integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  performance_record RECORD;
  current_commission_balance numeric;
  total_earnings numeric := 0;
BEGIN
  -- Récupérer les données de performance mensuelle
  SELECT * INTO performance_record
  FROM agent_monthly_performance
  WHERE agent_id = agent_id_param
    AND month = month_param
    AND year = year_param;
  
  -- Si aucune performance trouvée, calculer d'abord
  IF performance_record IS NULL THEN
    -- Calculer les performances du mois
    SELECT calculate_agent_monthly_performance(agent_id_param, month_param, year_param);
    
    -- Récupérer à nouveau
    SELECT * INTO performance_record
    FROM agent_monthly_performance
    WHERE agent_id = agent_id_param
      AND month = month_param
      AND year = year_param;
  END IF;
  
  -- Si encore aucune performance, retourner 0
  IF performance_record IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculer le total des gains
  total_earnings := COALESCE(performance_record.total_earnings, 0);
  
  -- Obtenir le solde commission actuel
  SELECT commission_balance INTO current_commission_balance
  FROM agents
  WHERE user_id = agent_id_param;
  
  -- Si l'agent n'existe pas, le créer
  IF current_commission_balance IS NULL THEN
    INSERT INTO agents (user_id, agent_id, full_name, phone, country, commission_balance)
    SELECT 
      agent_id_param,
      COALESCE(p.phone, 'Unknown'),
      COALESCE(p.full_name, 'Unknown Agent'),
      COALESCE(p.phone, 'Unknown'),
      COALESCE(p.country, 'Unknown'),
      total_earnings
    FROM profiles p
    WHERE p.id = agent_id_param;
    
    RETURN total_earnings;
  ELSE
    -- Mettre à jour le solde commission
    UPDATE agents
    SET commission_balance = commission_balance + total_earnings
    WHERE user_id = agent_id_param;
    
    RETURN current_commission_balance + total_earnings;
  END IF;
END;
$$;