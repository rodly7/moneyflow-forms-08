-- Create secure function to process agent withdrawals with commission and record in withdrawals
CREATE OR REPLACE FUNCTION public.agent_process_withdrawal_with_commission(
  p_agent_id uuid,
  p_client_id uuid,
  p_amount numeric,
  p_client_phone text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_agent_role public.user_role;
  v_client_balance numeric;
  v_new_client_balance numeric;
  v_new_agent_balance numeric;
  v_commission numeric;
  v_withdrawal_id uuid;
  v_tx_ref text;
  v_is_merchant boolean := false;
BEGIN
  -- Auth check: only agents, sub_admin, admin or merchant can call
  v_agent_role := public.get_user_role(p_agent_id);
  v_is_merchant := (SELECT role = 'merchant'::public.user_role FROM public.profiles WHERE id = p_agent_id);
  IF NOT (v_agent_role IN ('agent','admin','sub_admin') OR v_is_merchant) THEN
    RAISE EXCEPTION 'Unauthorized: only agents, admins, sub_admins or merchants can process withdrawals';
  END IF;

  -- Basic validations
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount: %', p_amount;
  END IF;

  -- Lock and check client balance
  SELECT balance INTO v_client_balance
  FROM public.profiles
  WHERE id = p_client_id
  FOR UPDATE;

  IF v_client_balance IS NULL THEN
    RAISE EXCEPTION 'Client not found';
  END IF;
  IF v_client_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Current: %, Requested: %', v_client_balance, p_amount;
  END IF;

  -- Atomic balance updates using secure function (also logs audit)
  v_new_client_balance := public.secure_increment_balance(p_client_id, -p_amount, 'agent_withdrawal_debit', p_agent_id);
  v_new_agent_balance := public.secure_increment_balance(p_agent_id,  p_amount, 'agent_withdrawal_credit', p_agent_id);

  -- Commission 0.5%
  v_commission := round(p_amount * 0.005);
  PERFORM public.increment_agent_commission(p_agent_id, v_commission);

  -- Create a reference and insert the withdrawal row (bypasses RLS via SECURITY DEFINER)
  v_tx_ref := 'WDR-' || extract(epoch from now())::bigint || '-' || floor(random()*1000)::int;
  INSERT INTO public.withdrawals (user_id, amount, withdrawal_phone, status, agent_id, transaction_reference)
  VALUES (p_client_id, p_amount, COALESCE(p_client_phone, ''), 'completed', p_agent_id, v_tx_ref)
  RETURNING id INTO v_withdrawal_id;

  RETURN json_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id,
    'agent_commission', v_commission,
    'new_client_balance', v_new_client_balance,
    'new_agent_balance', v_new_agent_balance,
    'transaction_reference', v_tx_ref
  );
EXCEPTION WHEN OTHERS THEN
  -- If anything fails after client debit, try to rollback client balance best-effort
  BEGIN
    PERFORM public.secure_increment_balance(p_client_id, p_amount, 'agent_withdrawal_rollback', p_agent_id);
  EXCEPTION WHEN OTHERS THEN
    -- ignore rollback failure to not hide original error
    NULL;
  END;
  RAISE;
END;
$$;