-- Create agent entry for user ed8f7137-a629-461f-a064-0c0e392efbe8 if profile exists
DO $$
DECLARE
  v_user_profile RECORD;
BEGIN
  -- Check if the user profile exists
  SELECT * INTO v_user_profile
  FROM public.profiles 
  WHERE id = 'ed8f7137-a629-461f-a064-0c0e392efbe8';
  
  -- If profile exists but no agent entry, create it
  IF FOUND AND NOT EXISTS (SELECT 1 FROM public.agents WHERE user_id = v_user_profile.id) THEN
    INSERT INTO public.agents (
      user_id,
      full_name,
      phone,
      country,
      agent_id,
      status,
      commission_balance
    ) VALUES (
      v_user_profile.id,
      COALESCE(v_user_profile.full_name, 'Agent'),
      v_user_profile.phone,
      COALESCE(v_user_profile.country, 'Congo Brazzaville'),
      'AG-' || EXTRACT(epoch FROM now())::bigint || '-' || floor(random()*1000)::int,
      'active',
      0
    );
    
    RAISE NOTICE 'Agent entry created for user %', v_user_profile.id;
  ELSE
    RAISE NOTICE 'User % not found or already has agent entry', 'ed8f7137-a629-461f-a064-0c0e392efbe8';
  END IF;
END $$;

-- Create function to auto-create agent entries for users who don't have them
CREATE OR REPLACE FUNCTION public.ensure_agent_entry(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_profile RECORD;
BEGIN
  -- Check if agent entry already exists
  IF EXISTS (SELECT 1 FROM public.agents WHERE user_id = p_user_id) THEN
    RETURN true;
  END IF;
  
  -- Get user profile
  SELECT * INTO v_user_profile
  FROM public.profiles 
  WHERE id = p_user_id;
  
  -- If profile doesn't exist, return false
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Create agent entry
  INSERT INTO public.agents (
    user_id,
    full_name,
    phone,
    country,
    agent_id,
    status,
    commission_balance
  ) VALUES (
    v_user_profile.id,
    COALESCE(v_user_profile.full_name, 'Agent'),
    v_user_profile.phone,
    COALESCE(v_user_profile.country, 'Congo Brazzaville'),
    'AG-' || EXTRACT(epoch FROM now())::bigint || '-' || floor(random()*1000)::int,
    'active',
    0
  );
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Failed to create agent entry for %: %', p_user_id, SQLERRM;
  RETURN false;
END;
$$;

-- Update the withdrawal function to auto-create agent entry if missing
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
  
  -- Ensure agent entry exists before applying commission
  PERFORM public.ensure_agent_entry(p_agent_id);
  
  -- Apply commission (should now work since agent entry is guaranteed)
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