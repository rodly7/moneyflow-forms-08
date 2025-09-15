-- Fix ambiguous column reference in get_agent_complete_quota_status
CREATE OR REPLACE FUNCTION public.get_agent_complete_quota_status(
  p_agent_id UUID,
  p_date TEXT DEFAULT NULL
)
RETURNS TABLE (
  agent_id UUID,
  date DATE,
  total_deposits NUMERIC,
  total_withdrawals NUMERIC,
  total_volume NUMERIC,
  quota_achieved BOOLEAN,
  quota_reached_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  query_date DATE;
  v_deposits_total NUMERIC := 0;
  v_withdrawals_total NUMERIC := 0;
  v_volume_total NUMERIC := 0;
  v_existing_quota agent_daily_quotas%ROWTYPE;
BEGIN
  -- Resolve target date
  query_date := COALESCE(p_date::DATE, CURRENT_DATE);

  -- Sum deposits credited by this agent (stored as provider_transaction_id text)
  SELECT COALESCE(SUM(r.amount), 0)
  INTO v_deposits_total
  FROM public.recharges AS r
  WHERE r.provider_transaction_id = p_agent_id::TEXT
    AND r.status = 'completed'
    AND DATE(r.created_at) = query_date;

  -- Sum withdrawals performed by this agent
  SELECT COALESCE(SUM(w.amount), 0)
  INTO v_withdrawals_total
  FROM public.withdrawals AS w
  WHERE w.agent_id = p_agent_id
    AND w.status = 'completed'
    AND DATE(w.created_at) = query_date;

  -- Total volume = deposits + withdrawals
  v_volume_total := v_deposits_total + v_withdrawals_total;

  -- Fetch existing quota record if any
  SELECT adq.*
  INTO v_existing_quota
  FROM public.agent_daily_quotas AS adq
  WHERE adq.agent_id = p_agent_id
    AND adq.date = query_date;

  -- Return row
  RETURN QUERY
  SELECT 
    p_agent_id,
    query_date,
    v_deposits_total,
    v_withdrawals_total,
    v_volume_total,
    COALESCE(v_existing_quota.quota_achieved, v_volume_total >= 500000),
    v_existing_quota.quota_reached_at;
END;
$$;