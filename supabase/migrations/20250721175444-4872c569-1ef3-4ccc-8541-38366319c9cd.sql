-- Créer une table pour tracker les quotas journaliers des agents
CREATE TABLE IF NOT EXISTS public.agent_daily_quotas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_deposits NUMERIC NOT NULL DEFAULT 0,
  quota_reached_at TIMESTAMP WITH TIME ZONE,
  quota_achieved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, date)
);

-- Enable RLS
ALTER TABLE public.agent_daily_quotas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Agents can view their own daily quotas" 
ON public.agent_daily_quotas 
FOR SELECT 
USING (auth.uid() = agent_id);

CREATE POLICY "Agents can update their own daily quotas" 
ON public.agent_daily_quotas 
FOR ALL 
USING (auth.uid() = agent_id)
WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Admins can view all daily quotas" 
ON public.agent_daily_quotas 
FOR ALL 
USING (is_admin_or_sub_admin(auth.uid()));

-- Fonction pour mettre à jour le quota journalier d'un agent
CREATE OR REPLACE FUNCTION public.update_agent_daily_quota(
  p_agent_id UUID,
  p_deposit_amount NUMERIC
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_quota RECORD;
  new_total NUMERIC;
  quota_reached BOOLEAN := false;
  current_hour INTEGER;
BEGIN
  -- Obtenir l'heure actuelle
  current_hour := EXTRACT(HOUR FROM NOW());
  
  -- Obtenir ou créer le quota du jour
  SELECT * INTO current_quota
  FROM agent_daily_quotas
  WHERE agent_id = p_agent_id AND date = CURRENT_DATE;
  
  -- Calculer le nouveau total
  new_total := COALESCE(current_quota.total_deposits, 0) + p_deposit_amount;
  
  -- Vérifier si le quota est atteint
  IF new_total >= 500000 AND NOT COALESCE(current_quota.quota_achieved, false) THEN
    quota_reached := true;
  END IF;
  
  -- Insérer ou mettre à jour
  INSERT INTO agent_daily_quotas (
    agent_id,
    date,
    total_deposits,
    quota_reached_at,
    quota_achieved
  ) VALUES (
    p_agent_id,
    CURRENT_DATE,
    new_total,
    CASE WHEN quota_reached THEN NOW() ELSE NULL END,
    quota_reached OR COALESCE(current_quota.quota_achieved, false)
  )
  ON CONFLICT (agent_id, date)
  DO UPDATE SET
    total_deposits = EXCLUDED.total_deposits,
    quota_reached_at = CASE 
      WHEN NOT agent_daily_quotas.quota_achieved AND EXCLUDED.quota_achieved 
      THEN NOW() 
      ELSE agent_daily_quotas.quota_reached_at 
    END,
    quota_achieved = EXCLUDED.quota_achieved,
    updated_at = NOW();
    
  RETURN quota_reached;
END;
$$;

-- Fonction pour obtenir le statut du quota d'un agent
CREATE OR REPLACE FUNCTION public.get_agent_quota_status(p_agent_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  total_deposits NUMERIC,
  quota_achieved BOOLEAN,
  quota_reached_at TIMESTAMP WITH TIME ZONE,
  reached_before_19h BOOLEAN,
  commission_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    adq.total_deposits,
    adq.quota_achieved,
    adq.quota_reached_at,
    CASE 
      WHEN adq.quota_reached_at IS NOT NULL 
      THEN EXTRACT(HOUR FROM adq.quota_reached_at) < 19
      ELSE false
    END as reached_before_19h,
    CASE 
      WHEN adq.quota_achieved AND EXTRACT(HOUR FROM adq.quota_reached_at) < 19 
      THEN 0.01 
      ELSE 0.005 
    END as commission_rate
  FROM agent_daily_quotas adq
  WHERE adq.agent_id = p_agent_id AND adq.date = p_date;
END;
$$;