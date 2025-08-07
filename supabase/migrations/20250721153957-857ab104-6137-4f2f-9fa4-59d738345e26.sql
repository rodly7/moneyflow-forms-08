-- Mettre à jour la fonction calculate_agent_monthly_performance avec les nouveaux taux de commission
CREATE OR REPLACE FUNCTION public.calculate_agent_monthly_performance(agent_id_param uuid, month_param integer, year_param integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  start_date DATE;
  end_date DATE;
  intl_transfers_count INTEGER := 0;
  intl_transfers_volume NUMERIC := 0;
  withdrawals_count INTEGER := 0;
  withdrawals_volume NUMERIC := 0;
  deposits_count INTEGER := 0;
  deposits_volume NUMERIC := 0;
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
  daily_quota_reached BOOLEAN := false;
BEGIN
  -- Calculer les dates de début et fin du mois
  start_date := DATE(year_param || '-' || LPAD(month_param::TEXT, 2, '0') || '-01');
  end_date := start_date + INTERVAL '1 month' - INTERVAL '1 day';
  
  -- Calculer les transferts internationaux
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
  WHERE w.user_id = agent_id_param
    AND w.created_at >= start_date
    AND w.created_at <= end_date + INTERVAL '1 day'
    AND w.status = 'completed';
  
  -- Calculer les dépôts effectués par l'agent
  SELECT COUNT(*), COALESCE(SUM(r.amount), 0)
  INTO deposits_count, deposits_volume
  FROM recharges r
  WHERE r.provider_transaction_id = agent_id_param::TEXT
    AND r.created_at >= start_date
    AND r.created_at <= end_date + INTERVAL '1 day'
    AND r.status = 'completed';
  
  -- Calculer les totaux
  total_vol := intl_transfers_volume + withdrawals_volume + deposits_volume;
  total_trans := intl_transfers_count + withdrawals_count + deposits_count;
  
  -- Calculer les réclamations
  SELECT COUNT(*)
  INTO complaints_count
  FROM agent_complaints
  WHERE agent_id = agent_id_param
    AND created_at >= start_date
    AND created_at <= end_date + INTERVAL '1 day'
    AND status IN ('pending', 'validated');
  
  -- Vérifier si le quota journalier a été atteint (assumons qu'un quota est atteint si plus de 10 dépôts par jour en moyenne)
  daily_quota_reached := (deposits_count > 0 AND deposits_count / EXTRACT(DAY FROM end_date) >= 10);
  
  -- Calculer les commissions selon les nouveaux taux
  -- Commission sur les dépôts : 0,5% de base, 1% si quota atteint
  IF daily_quota_reached THEN
    base_commission := base_commission + (deposits_volume * 0.01); -- 1% si quota atteint
  ELSE
    base_commission := base_commission + (deposits_volume * 0.005); -- 0,5% de base
  END IF;
  
  -- Commission sur les retraits : 0,2%
  base_commission := base_commission + (withdrawals_volume * 0.002);
  
  -- Commission sur les transferts : maintenir le taux existant
  commission_rate := calculate_commission_rate(intl_transfers_volume);
  base_commission := base_commission + (intl_transfers_volume * commission_rate);
  
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
    COALESCE(commission_rate, 0.005), -- Taux de base pour les dépôts
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
$function$;