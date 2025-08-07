-- Mettre à jour la fonction secure_increment_balance pour inclure les sous-administrateurs
CREATE OR REPLACE FUNCTION public.secure_increment_balance(target_user_id uuid, amount numeric, operation_type text DEFAULT 'admin_credit'::text, performed_by uuid DEFAULT auth.uid())
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_balance numeric;
  performer_role public.user_role;
  target_role public.user_role;
  limit_check numeric;
BEGIN
  -- Get performer role
  performer_role := public.get_user_role(performed_by);
  target_role := public.get_user_role(target_user_id);
  
  -- Security checks - Inclure les sous-administrateurs
  IF performer_role NOT IN ('admin', 'sub_admin', 'agent') AND target_user_id != performed_by THEN
    RAISE EXCEPTION 'Unauthorized: Only admins, sub-admins and agents can modify other users balances';
  END IF;
  
  -- Check transaction limits for large amounts
  IF ABS(amount) > 100000 THEN
    SELECT single_limit INTO limit_check
    FROM transaction_limits 
    WHERE operation_type = 'deposit' AND user_role = performer_role;
    
    IF limit_check IS NOT NULL AND ABS(amount) > limit_check THEN
      RAISE EXCEPTION 'Transaction exceeds limit: % > %', ABS(amount), limit_check;
    END IF;
  END IF;
  
  -- Perform the balance update
  UPDATE profiles
  SET balance = balance + amount
  WHERE id = target_user_id
  RETURNING balance INTO new_balance;
  
  -- Check if user exists
  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;
  
  -- Check for negative balance
  IF new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient balance. Current: %, Requested: %', new_balance - amount, amount;
  END IF;
  
  -- Log the transaction in audit_logs
  INSERT INTO audit_logs (
    action,
    table_name,
    record_id,
    user_id,
    old_values,
    new_values
  ) VALUES (
    operation_type,
    'profiles',
    target_user_id,
    performed_by,
    jsonb_build_object('old_balance', new_balance - amount),
    jsonb_build_object('new_balance', new_balance, 'amount', amount)
  );
  
  RETURN new_balance;
END;
$function$;