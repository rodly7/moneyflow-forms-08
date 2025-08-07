-- Table pour les réclamations clients
CREATE TABLE public.agent_complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  user_id UUID NOT NULL,
  complaint_type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (agent_id) REFERENCES profiles(id),
  FOREIGN KEY (user_id) REFERENCES profiles(id)
);

-- Table pour les calculs mensuels de performance des agents
CREATE TABLE public.agent_monthly_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  international_transfers_count INTEGER NOT NULL DEFAULT 0,
  international_transfers_volume NUMERIC NOT NULL DEFAULT 0,
  withdrawals_count INTEGER NOT NULL DEFAULT 0,
  withdrawals_volume NUMERIC NOT NULL DEFAULT 0,
  total_volume NUMERIC NOT NULL DEFAULT 0,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  complaints_count INTEGER NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 0.01,
  base_commission NUMERIC NOT NULL DEFAULT 0,
  volume_bonus NUMERIC NOT NULL DEFAULT 0,
  transaction_bonus NUMERIC NOT NULL DEFAULT 0,
  no_complaint_bonus NUMERIC NOT NULL DEFAULT 0,
  total_earnings NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (agent_id) REFERENCES profiles(id),
  UNIQUE(agent_id, month, year)
);

-- Table pour les taux de commission par palier
CREATE TABLE public.commission_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  min_volume NUMERIC NOT NULL,
  max_volume NUMERIC,
  commission_rate NUMERIC NOT NULL,
  tier_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insérer les paliers de commission
INSERT INTO public.commission_tiers (min_volume, max_volume, commission_rate, tier_name) VALUES
(0, 499999, 0.01, 'Bronze'),
(500000, 1999999, 0.015, 'Silver'), 
(2000000, NULL, 0.02, 'Gold');

-- Table pour les bonus mensuels
CREATE TABLE public.monthly_bonuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bonus_type TEXT NOT NULL,
  requirement_value NUMERIC NOT NULL,
  bonus_amount NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insérer les bonus mensuels
INSERT INTO public.monthly_bonuses (bonus_type, requirement_value, bonus_amount, description) VALUES
('transactions', 100, 5000, 'Bonus pour 100 transferts par mois'),
('volume', 1000000, 5000, 'Bonus pour 1M FCFA de volume mensuel'),
('no_complaints', 0, 2000, 'Bonus pour zéro réclamation client');

-- Fonction pour calculer la commission selon le volume
CREATE OR REPLACE FUNCTION public.calculate_commission_rate(volume NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  rate NUMERIC;
BEGIN
  SELECT commission_rate INTO rate
  FROM commission_tiers
  WHERE volume >= min_volume 
    AND (max_volume IS NULL OR volume <= max_volume)
  LIMIT 1;
  
  RETURN COALESCE(rate, 0.01);
END;
$$;

-- Fonction pour calculer les performances mensuelles d'un agent
CREATE OR REPLACE FUNCTION public.calculate_agent_monthly_performance(
  agent_id_param UUID,
  month_param INTEGER,
  year_param INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  intl_transfers_count INTEGER := 0;
  intl_transfers_volume NUMERIC := 0;
  withdrawals_count INTEGER := 0;
  withdrawals_volume NUMERIC := 0;
  total_vol NUMERIC := 0;
  total_trans INTEGER := 0;
  complaints_count INTEGER := 0;
  commission_rate NUMERIC;
  base_commission NUMERIC := 0;
  volume_bonus NUMERIC := 0;
  transaction_bonus NUMERIC := 0;
  no_complaint_bonus NUMERIC := 0;
  total_earnings NUMERIC := 0;
  performance_id UUID;
BEGIN
  -- Calculer les dates de début et fin du mois
  start_date := DATE(year_param || '-' || LPAD(month_param::TEXT, 2, '0') || '-01');
  end_date := start_date + INTERVAL '1 month' - INTERVAL '1 day';
  
  -- Calculer les transferts internationaux (uniquement les agents ne peuvent faire que de l'international)
  SELECT COUNT(*), COALESCE(SUM(amount), 0)
  INTO intl_transfers_count, intl_transfers_volume
  FROM transfers 
  WHERE sender_id = agent_id_param
    AND created_at >= start_date
    AND created_at <= end_date + INTERVAL '1 day'
    AND status = 'completed';
  
  -- Calculer les retraits effectués par l'agent
  SELECT COUNT(*), COALESCE(SUM(amount), 0)
  INTO withdrawals_count, withdrawals_volume
  FROM withdrawals w
  JOIN recharges r ON r.provider_transaction_id = agent_id_param::TEXT
  WHERE w.created_at >= start_date
    AND w.created_at <= end_date + INTERVAL '1 day'
    AND w.status = 'completed'
    AND r.created_at >= start_date
    AND r.created_at <= end_date + INTERVAL '1 day';
  
  -- Calculer les totaux
  total_vol := intl_transfers_volume + withdrawals_volume;
  total_trans := intl_transfers_count + withdrawals_count;
  
  -- Calculer les réclamations
  SELECT COUNT(*)
  INTO complaints_count
  FROM agent_complaints
  WHERE agent_id = agent_id_param
    AND created_at >= start_date
    AND created_at <= end_date + INTERVAL '1 day'
    AND status IN ('pending', 'validated');
  
  -- Calculer le taux de commission
  commission_rate := calculate_commission_rate(total_vol);
  
  -- Calculer la commission de base
  base_commission := total_vol * commission_rate;
  
  -- Calculer les bonus
  IF total_trans >= 100 THEN
    transaction_bonus := 5000;
  END IF;
  
  IF total_vol >= 1000000 THEN
    volume_bonus := 5000;
  END IF;
  
  IF complaints_count = 0 THEN
    no_complaint_bonus := 2000;
  END IF;
  
  -- Calculer le total
  total_earnings := base_commission + volume_bonus + transaction_bonus + no_complaint_bonus;
  
  -- Insérer ou mettre à jour les performances
  INSERT INTO agent_monthly_performance (
    agent_id,
    month,
    year,
    international_transfers_count,
    international_transfers_volume,
    withdrawals_count,
    withdrawals_volume,
    total_volume,
    total_transactions,
    complaints_count,
    commission_rate,
    base_commission,
    volume_bonus,
    transaction_bonus,
    no_complaint_bonus,
    total_earnings
  ) VALUES (
    agent_id_param,
    month_param,
    year_param,
    intl_transfers_count,
    intl_transfers_volume,
    withdrawals_count,
    withdrawals_volume,
    total_vol,
    total_trans,
    complaints_count,
    commission_rate,
    base_commission,
    volume_bonus,
    transaction_bonus,
    no_complaint_bonus,
    total_earnings
  )
  ON CONFLICT (agent_id, month, year)
  DO UPDATE SET
    international_transfers_count = EXCLUDED.international_transfers_count,
    international_transfers_volume = EXCLUDED.international_transfers_volume,
    withdrawals_count = EXCLUDED.withdrawals_count,
    withdrawals_volume = EXCLUDED.withdrawals_volume,
    total_volume = EXCLUDED.total_volume,
    total_transactions = EXCLUDED.total_transactions,
    complaints_count = EXCLUDED.complaints_count,
    commission_rate = EXCLUDED.commission_rate,
    base_commission = EXCLUDED.base_commission,
    volume_bonus = EXCLUDED.volume_bonus,
    transaction_bonus = EXCLUDED.transaction_bonus,
    no_complaint_bonus = EXCLUDED.no_complaint_bonus,
    total_earnings = EXCLUDED.total_earnings,
    updated_at = now()
  RETURNING id INTO performance_id;
  
  RETURN performance_id;
END;
$$;

-- Fonction pour obtenir les performances actuelles d'un agent
CREATE OR REPLACE FUNCTION public.get_agent_current_month_performance(agent_id_param UUID)
RETURNS TABLE (
  total_volume NUMERIC,
  total_transactions INTEGER,
  complaints_count INTEGER,
  commission_rate NUMERIC,
  base_commission NUMERIC,
  volume_bonus NUMERIC,
  transaction_bonus NUMERIC,
  no_complaint_bonus NUMERIC,
  total_earnings NUMERIC,
  tier_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month INTEGER;
  current_year INTEGER;
  perf_id UUID;
BEGIN
  -- Obtenir le mois et l'année actuels
  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Calculer les performances du mois actuel
  SELECT calculate_agent_monthly_performance(agent_id_param, current_month, current_year) INTO perf_id;
  
  -- Retourner les résultats
  RETURN QUERY
  SELECT 
    amp.total_volume,
    amp.total_transactions,
    amp.complaints_count,
    amp.commission_rate,
    amp.base_commission,
    amp.volume_bonus,
    amp.transaction_bonus,
    amp.no_complaint_bonus,
    amp.total_earnings,
    ct.tier_name
  FROM agent_monthly_performance amp
  LEFT JOIN commission_tiers ct ON amp.total_volume >= ct.min_volume 
    AND (ct.max_volume IS NULL OR amp.total_volume <= ct.max_volume)
  WHERE amp.agent_id = agent_id_param
    AND amp.month = current_month
    AND amp.year = current_year;
END;
$$;

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.agent_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_monthly_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_bonuses ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour agent_complaints
CREATE POLICY "Agents can view complaints about them" ON public.agent_complaints
FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY "Users can create complaints" ON public.agent_complaints
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all complaints" ON public.agent_complaints
FOR ALL USING (is_admin_or_sub_admin(auth.uid()));

-- Politiques RLS pour agent_monthly_performance
CREATE POLICY "Agents can view their own performance" ON public.agent_monthly_performance
FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY "Admins can view all performance data" ON public.agent_monthly_performance
FOR ALL USING (is_admin_or_sub_admin(auth.uid()));

-- Politiques RLS pour commission_tiers et monthly_bonuses
CREATE POLICY "Everyone can view commission tiers" ON public.commission_tiers
FOR SELECT USING (true);

CREATE POLICY "Everyone can view monthly bonuses" ON public.monthly_bonuses
FOR SELECT USING (true);

CREATE POLICY "Admins can manage commission tiers" ON public.commission_tiers
FOR ALL USING (is_admin_or_sub_admin(auth.uid()));

CREATE POLICY "Admins can manage monthly bonuses" ON public.monthly_bonuses
FOR ALL USING (is_admin_or_sub_admin(auth.uid()));