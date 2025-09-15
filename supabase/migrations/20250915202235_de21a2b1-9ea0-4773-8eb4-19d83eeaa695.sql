-- Update function to make commission update non-blocking when agent row is missing
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
  v_agent_role := public.get_user_role(p_agent_id);
  v_is_merchant := (SELECT role = 'merchant'::public.user_role FROM public.profiles WHERE id = p_agent_id);
  IF NOT (v_agent_role IN ('agent','admin','sub_admin') OR v_is_merchant) THEN
    RAISE EXCEPTION 'Unauthorized: only agents, admins, sub_admins or merchants can process withdrawals';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount: %', p_amount;
  END IF;

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

  v_new_client_balance := public.secure_increment_balance(p_client_id, -p_amount, 'agent_withdrawal_debit', p_agent_id);
  v_new_agent_balance := public.secure_increment_balance(p_agent_id,  p_amount, 'agent_withdrawal_credit', p_agent_id);

  v_commission := round(p_amount * 0.005);
  -- Make commission best-effort (do not fail the whole operation if agent row missing)
  BEGIN
    PERFORM public.increment_agent_commission(p_agent_id, v_commission);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Commission not applied for %: %', p_agent_id, SQLERRM;
  END;

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
  BEGIN
    PERFORM public.secure_increment_balance(p_client_id, p_amount, 'agent_withdrawal_rollback', p_agent_id);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RAISE;
END;
$$;