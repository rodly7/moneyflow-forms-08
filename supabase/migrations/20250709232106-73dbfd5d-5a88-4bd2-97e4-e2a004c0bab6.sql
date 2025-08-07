-- Corriger la fonction pour résoudre l'ambiguïté des colonnes
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
  SELECT COUNT(*), COALESCE(SUM(t.amount), 0)
  INTO intl_transfers_count, intl_transfers_volume
  FROM transfers t
  WHERE t.sender_id = agent_id_param
    AND t.created_at >= start_date
    AND t.created_at <= end_date + INTERVAL '1 day'
    AND t.status = 'completed';
  
  -- Calculer les retraits effectués par l'agent
  SELECT COUNT(*), COALESCE(SUM(w.amount), 0)
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