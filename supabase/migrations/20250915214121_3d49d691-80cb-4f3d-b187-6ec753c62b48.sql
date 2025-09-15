-- Create function to get complete agent quota status including withdrawals and deposits
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
  quota_reached_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  query_date DATE;
  deposits_total NUMERIC := 0;
  withdrawals_total NUMERIC := 0;
  volume_total NUMERIC := 0;
  existing_quota RECORD;
BEGIN
  -- Use provided date or current date
  query_date := COALESCE(p_date::DATE, CURRENT_DATE);
  
  -- Calculate total deposits for the agent on the specified date
  SELECT COALESCE(SUM(amount), 0) INTO deposits_total
  FROM recharges
  WHERE provider_transaction_id = p_agent_id::TEXT
    AND DATE(created_at) = query_date
    AND status = 'completed';
  
  -- Calculate total withdrawals for the agent on the specified date  
  SELECT COALESCE(SUM(amount), 0) INTO withdrawals_total
  FROM withdrawals
  WHERE agent_id = p_agent_id
    AND DATE(created_at) = query_date
    AND status = 'completed';
  
  -- Total volume is deposits + withdrawals
  volume_total := deposits_total + withdrawals_total;
  
  -- Get existing quota record if it exists
  SELECT * INTO existing_quota
  FROM agent_daily_quotas adq
  WHERE adq.agent_id = p_agent_id
    AND adq.date = query_date;
  
  -- Return the calculated values
  RETURN QUERY
  SELECT 
    p_agent_id,
    query_date,
    deposits_total,
    withdrawals_total,
    volume_total,
    COALESCE(existing_quota.quota_achieved, volume_total >= 500000),
    existing_quota.quota_reached_at;
END;
$$;