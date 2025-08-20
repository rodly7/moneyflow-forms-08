
-- Fix database function security by adding search_path to vulnerable functions
-- This prevents potential privilege escalation attacks

-- Fix secure_increment_balance function
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

-- Fix process_withdrawal_transaction function
CREATE OR REPLACE FUNCTION public.process_withdrawal_transaction(p_client_id uuid, p_agent_id uuid, p_amount numeric, p_commission numeric)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  client_current_balance NUMERIC;
  agent_current_balance NUMERIC;
  new_client_balance NUMERIC;
  new_agent_balance NUMERIC;
  result JSON;
BEGIN
  -- Obtenir les soldes actuels avec verrous
  SELECT balance INTO client_current_balance
  FROM profiles 
  WHERE id = p_client_id
  FOR UPDATE;
  
  SELECT balance INTO agent_current_balance
  FROM profiles 
  WHERE id = p_agent_id
  FOR UPDATE;
  
  -- Vérifier que le client existe et a suffisamment de fonds
  IF client_current_balance IS NULL THEN
    RAISE EXCEPTION 'Client non trouvé';
  END IF;
  
  IF client_current_balance < p_amount THEN
    RAISE EXCEPTION 'Solde client insuffisant: % disponible, % demandé', client_current_balance, p_amount;
  END IF;
  
  IF agent_current_balance IS NULL THEN
    RAISE EXCEPTION 'Agent non trouvé';
  END IF;
  
  -- Effectuer les transactions atomiques
  -- 1. Débiter le client
  UPDATE profiles 
  SET balance = balance - p_amount
  WHERE id = p_client_id
  RETURNING balance INTO new_client_balance;
  
  -- 2. Créditer l'agent du montant principal
  UPDATE profiles 
  SET balance = balance + p_amount
  WHERE id = p_agent_id
  RETURNING balance INTO new_agent_balance;
  
  -- 3. Ajouter la commission à l'agent
  UPDATE agents 
  SET commission_balance = commission_balance + p_commission
  WHERE user_id = p_agent_id;
  
  -- Construire le résultat
  result := json_build_object(
    'success', true,
    'new_client_balance', new_client_balance,
    'new_agent_balance', new_agent_balance,
    'commission_added', p_commission
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, tout est automatiquement annulé
    RAISE EXCEPTION 'Erreur lors du retrait: %', SQLERRM;
END;
$function$;

-- Fix increment_agent_commission function
CREATE OR REPLACE FUNCTION public.increment_agent_commission(agent_user_id uuid, commission_amount numeric)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_commission_balance numeric;
BEGIN
  -- Vérifier que le montant n'est pas excessif
  IF ABS(commission_amount) > 1000000 THEN
    RAISE EXCEPTION 'Commission amount too large: %', commission_amount;
  END IF;
  
  -- Mettre à jour le commission_balance et retourner le nouveau solde
  UPDATE agents
  SET commission_balance = commission_balance + commission_amount
  WHERE user_id = agent_user_id
  RETURNING commission_balance INTO new_commission_balance;
  
  -- Vérifier que l'agent existe
  IF new_commission_balance IS NULL THEN
    RAISE EXCEPTION 'Agent not found: %', agent_user_id;
  END IF;
  
  -- Vérifier que le solde ne devient pas négatif
  IF new_commission_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient commission balance. Current: %, Requested: %', new_commission_balance - commission_amount, commission_amount;
  END IF;
  
  RETURN new_commission_balance;
END;
$function$;

-- Fix process_automatic_bill_payment function
CREATE OR REPLACE FUNCTION public.process_automatic_bill_payment(bill_id_param uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  bill_record RECORD;
  user_balance NUMERIC;
  new_balance NUMERIC;
  payment_result JSON;
  next_due DATE;
BEGIN
  -- Récupérer les informations de la facture
  SELECT * INTO bill_record
  FROM automatic_bills
  WHERE id = bill_id_param
    AND is_automated = true
    AND status = 'pending';
  
  IF bill_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Facture non trouvée ou non automatisée'
    );
  END IF;
  
  -- Récupérer le solde de l'utilisateur
  SELECT balance INTO user_balance
  FROM profiles
  WHERE id = bill_record.user_id;
  
  -- Incrémenter le nombre de tentatives
  UPDATE automatic_bills
  SET payment_attempts = payment_attempts + 1,
      updated_at = now()
  WHERE id = bill_id_param;
  
  -- Vérifier si le solde est suffisant
  IF user_balance >= bill_record.amount THEN
    -- Débiter le compte
    new_balance := secure_increment_balance(
      bill_record.user_id,
      -bill_record.amount,
      'automatic_bill_payment'
    );
    
    -- Calculer la prochaine échéance
    CASE bill_record.recurrence
      WHEN 'monthly' THEN
        next_due := bill_record.due_date + INTERVAL '1 month';
      WHEN 'quarterly' THEN
        next_due := bill_record.due_date + INTERVAL '3 months';
      WHEN 'yearly' THEN
        next_due := bill_record.due_date + INTERVAL '1 year';
      ELSE
        next_due := NULL; -- Pour 'once'
    END CASE;
    
    -- Mettre à jour la facture
    UPDATE automatic_bills
    SET status = CASE WHEN bill_record.recurrence = 'once' THEN 'paid' ELSE 'pending' END,
        last_payment_date = CURRENT_DATE,
        next_due_date = next_due,
        due_date = COALESCE(next_due, due_date),
        payment_attempts = 0
    WHERE id = bill_id_param;
    
    -- Enregistrer dans l'historique
    INSERT INTO bill_payment_history (
      bill_id, user_id, amount, status, balance_before, balance_after, attempt_number
    ) VALUES (
      bill_id_param, bill_record.user_id, bill_record.amount, 'success', 
      user_balance, new_balance, bill_record.payment_attempts + 1
    );
    
    -- Créer notification de succès
    INSERT INTO bill_notifications (
      bill_id, user_id, notification_type
    ) VALUES (
      bill_id_param, bill_record.user_id, 'payment_success'
    );
    
    RETURN json_build_object(
      'success', true,
      'message', 'Paiement effectué avec succès',
      'amount', bill_record.amount,
      'new_balance', new_balance
    );
  ELSE
    -- Solde insuffisant
    INSERT INTO bill_payment_history (
      bill_id, user_id, amount, status, balance_before, attempt_number, error_message
    ) VALUES (
      bill_id_param, bill_record.user_id, bill_record.amount, 'insufficient_funds',
      user_balance, bill_record.payment_attempts + 1, 'Solde insuffisant'
    );
    
    -- Créer notification d'échec
    INSERT INTO bill_notifications (
      bill_id, user_id, notification_type
    ) VALUES (
      bill_id_param, bill_record.user_id, 'insufficient_funds'
    );
    
    -- Si max tentatives atteint, mettre en échec
    IF bill_record.payment_attempts + 1 >= bill_record.max_attempts THEN
      UPDATE automatic_bills
      SET status = 'failed'
      WHERE id = bill_id_param;
    END IF;
    
    RETURN json_build_object(
      'success', false,
      'message', 'Solde insuffisant',
      'required', bill_record.amount,
      'available', user_balance,
      'attempts', bill_record.payment_attempts + 1
    );
  END IF;
END;
$function$;

-- Fix savings_deposit function
CREATE OR REPLACE FUNCTION public.savings_deposit(p_user_id uuid, p_account_id uuid, p_amount numeric)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_balance DECIMAL;
    v_result JSON;
BEGIN
    -- Check user balance
    SELECT balance INTO v_user_balance 
    FROM profiles 
    WHERE id = p_user_id;
    
    IF v_user_balance IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    
    IF v_user_balance < p_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient balance');
    END IF;
    
    -- Deduct from user's main balance (without updated_at)
    UPDATE profiles 
    SET balance = balance - p_amount
    WHERE id = p_user_id;
    
    -- Add to savings account
    UPDATE savings_accounts 
    SET balance = balance + p_amount,
        updated_at = now()
    WHERE id = p_account_id AND user_id = p_user_id;
    
    -- Return success
    RETURN json_build_object('success', true, 'message', 'Deposit successful');
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Fix savings_withdrawal function
CREATE OR REPLACE FUNCTION public.savings_withdrawal(p_user_id uuid, p_account_id uuid, p_amount numeric)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_savings_balance DECIMAL;
    v_target_amount DECIMAL;
    v_result JSON;
BEGIN
    -- Check savings account balance and target
    SELECT balance, target_amount INTO v_savings_balance, v_target_amount
    FROM savings_accounts 
    WHERE id = p_account_id AND user_id = p_user_id;
    
    IF v_savings_balance IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Savings account not found');
    END IF;
    
    IF v_savings_balance < p_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient savings balance');
    END IF;
    
    -- Check if target is reached before allowing withdrawal
    IF v_target_amount IS NOT NULL AND v_savings_balance < v_target_amount THEN
        RETURN json_build_object('success', false, 'error', 'Cannot withdraw before reaching target amount');
    END IF;
    
    -- Deduct from savings account
    UPDATE savings_accounts 
    SET balance = balance - p_amount,
        updated_at = now()
    WHERE id = p_account_id AND user_id = p_user_id;
    
    -- Add to user's main balance
    UPDATE profiles 
    SET balance = balance + p_amount
    WHERE id = p_user_id;
    
    -- Return success
    RETURN json_build_object('success', true, 'message', 'Withdrawal successful');
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Fix transfer_monthly_commissions_to_balance function
CREATE OR REPLACE FUNCTION public.transfer_monthly_commissions_to_balance(agent_id_param uuid, month_param integer DEFAULT (EXTRACT(month FROM CURRENT_DATE))::integer, year_param integer DEFAULT (EXTRACT(year FROM CURRENT_DATE))::integer)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  performance_record RECORD;
  current_commission_balance numeric;
  total_earnings numeric := 0;
  already_transferred numeric := 0;
  new_earnings numeric := 0;
BEGIN
  -- Récupérer les données de performance mensuelle
  SELECT * INTO performance_record
  FROM agent_monthly_performance
  WHERE agent_id = agent_id_param
    AND month = month_param
    AND year = year_param;
  
  -- Si aucune performance trouvée, calculer d'abord
  IF performance_record IS NULL THEN
    -- Calculer les performances du mois
    SELECT calculate_agent_monthly_performance(agent_id_param, month_param, year_param);
    
    -- Récupérer à nouveau
    SELECT * INTO performance_record
    FROM agent_monthly_performance
    WHERE agent_id = agent_id_param
      AND month = month_param
      AND year = year_param;
  END IF;
  
  -- Si encore aucune performance, retourner 0
  IF performance_record IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculer le total des gains
  total_earnings := COALESCE(performance_record.total_earnings, 0);
  
  -- Vérifier combien a déjà été transféré ce mois-ci
  already_transferred := COALESCE(performance_record.transferred_to_balance, 0);
  
  -- Calculer seulement les nouveaux gains non transférés
  new_earnings := total_earnings - already_transferred;
  
  -- Si rien de nouveau à transférer, retourner le solde actuel
  IF new_earnings <= 0 THEN
    SELECT COALESCE(commission_balance, 0) INTO current_commission_balance
    FROM agents WHERE user_id = agent_id_param;
    RETURN COALESCE(current_commission_balance, 0);
  END IF;
  
  -- Obtenir le solde commission actuel
  SELECT commission_balance INTO current_commission_balance
  FROM agents
  WHERE user_id = agent_id_param;
  
  -- Si l'agent n'existe pas, le créer
  IF current_commission_balance IS NULL THEN
    INSERT INTO agents (user_id, agent_id, full_name, phone, country, commission_balance)
    SELECT 
      agent_id_param,
      COALESCE(p.phone, 'Unknown'),
      COALESCE(p.full_name, 'Unknown Agent'),
      COALESCE(p.phone, 'Unknown'),
      COALESCE(p.country, 'Unknown'),
      new_earnings
    FROM profiles p
    WHERE p.id = agent_id_param;
    
    current_commission_balance := new_earnings;
  ELSE
    -- Mettre à jour le solde commission avec seulement les nouveaux gains
    UPDATE agents
    SET commission_balance = commission_balance + new_earnings
    WHERE user_id = agent_id_param;
    
    current_commission_balance := current_commission_balance + new_earnings;
  END IF;
  
  -- Marquer les gains comme transférés
  UPDATE agent_monthly_performance
  SET transferred_to_balance = total_earnings
  WHERE agent_id = agent_id_param
    AND month = month_param
    AND year = year_param;
  
  RETURN current_commission_balance;
END;
$function$;

-- Fix update_agent_daily_quota function
CREATE OR REPLACE FUNCTION public.update_agent_daily_quota(p_agent_id uuid, p_deposit_amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix get_agent_quota_status function
CREATE OR REPLACE FUNCTION public.get_agent_quota_status(p_agent_id uuid, p_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(total_deposits numeric, quota_achieved boolean, quota_reached_at timestamp with time zone, reached_before_19h boolean, commission_rate numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix calculate_agent_monthly_performance function
CREATE OR REPLACE FUNCTION public.calculate_agent_monthly_performance(agent_id_param uuid, month_param integer, year_param integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
  
  -- Calculer les transferts internationaux (pour statistiques seulement, pas pour commissions)
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
  
  -- Calculer les totaux (incluant transferts pour les statistiques)
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
  
  -- Vérifier si le quota journalier a été atteint (plus de 10 dépôts par jour en moyenne)
  daily_quota_reached := (deposits_count > 0 AND deposits_count / EXTRACT(DAY FROM end_date) >= 10);
  
  -- Calculer les commissions UNIQUEMENT sur dépôts et retraits
  -- Commission sur les dépôts : 0,5% de base, 1% si quota atteint
  IF daily_quota_reached THEN
    base_commission := base_commission + (deposits_volume * 0.01); -- 1% si quota atteint
  ELSE
    base_commission := base_commission + (deposits_volume * 0.005); -- 0,5% de base
  END IF;
  
  -- Commission sur les retraits : 0,2%
  base_commission := base_commission + (withdrawals_volume * 0.002);
  
  -- PAS de commission sur les transferts
  
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
    0.005, -- Taux de base pour les dépôts (pas utilisé pour les transferts)
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

-- Secure public tables by requiring authentication
-- Update RLS policies for commission_tiers to require authentication
DROP POLICY IF EXISTS "Everyone can view commission tiers" ON public.commission_tiers;
CREATE POLICY "Authenticated users can view commission tiers" 
  ON public.commission_tiers 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Update RLS policies for monthly_bonuses to require authentication
DROP POLICY IF EXISTS "Everyone can view monthly bonuses" ON public.monthly_bonuses;
CREATE POLICY "Authenticated users can view monthly bonuses" 
  ON public.monthly_bonuses 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Update RLS policies for bill_payment_numbers to require authentication for active numbers
DROP POLICY IF EXISTS "Everyone can view active payment numbers" ON public.bill_payment_numbers;
CREATE POLICY "Authenticated users can view active payment numbers" 
  ON public.bill_payment_numbers 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Add rate limiting table for sensitive operations
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  operation_type text NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, operation_type, window_start)
);

-- Enable RLS for rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for rate_limits
CREATE POLICY "Users can view their own rate limits" 
  ON public.rate_limits 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_operation_type text,
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 60
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_attempts integer;
  window_start timestamp with time zone;
BEGIN
  -- Calculate window start time
  window_start := date_trunc('hour', now()) + 
    (EXTRACT(minute FROM now())::integer / p_window_minutes) * (p_window_minutes || ' minutes')::interval;
  
  -- Get current attempts for this window
  SELECT attempts INTO current_attempts
  FROM rate_limits
  WHERE user_id = p_user_id 
    AND operation_type = p_operation_type
    AND window_start = window_start;
  
  -- If no record exists or attempts are within limit
  IF current_attempts IS NULL THEN
    -- Create new record
    INSERT INTO rate_limits (user_id, operation_type, window_start, attempts)
    VALUES (p_user_id, p_operation_type, window_start, 1)
    ON CONFLICT (user_id, operation_type, window_start)
    DO UPDATE SET attempts = rate_limits.attempts + 1;
    RETURN true;
  ELSIF current_attempts < p_max_attempts THEN
    -- Increment attempts
    UPDATE rate_limits 
    SET attempts = attempts + 1
    WHERE user_id = p_user_id 
      AND operation_type = p_operation_type
      AND window_start = window_start;
    RETURN true;
  ELSE
    -- Rate limit exceeded
    RETURN false;
  END IF;
END;
$function$;

-- Clean up old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM rate_limits 
  WHERE created_at < now() - INTERVAL '24 hours';
END;
$function$;
