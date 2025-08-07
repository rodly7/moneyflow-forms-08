
-- Phase 1: Critical Security Fixes

-- 1. Create role enum and add role column to profiles
CREATE TYPE public.user_role AS ENUM ('user', 'agent', 'admin');

ALTER TABLE public.profiles 
ADD COLUMN role public.user_role NOT NULL DEFAULT 'user';

-- 2. Update existing admin user to have admin role (using the hardcoded phone)
UPDATE public.profiles 
SET role = 'admin' 
WHERE phone = '+221773637752';

-- 3. Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param uuid)
RETURNS public.user_role
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_role_result public.user_role;
BEGIN
  SELECT role INTO user_role_result
  FROM profiles 
  WHERE id = user_id_param;
  
  RETURN COALESCE(user_role_result, 'user');
END;
$$;

-- 4. Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT public.get_user_role(user_id_param) = 'admin');
END;
$$;

-- 5. Create function to check if user is agent or admin
CREATE OR REPLACE FUNCTION public.is_agent_or_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT public.get_user_role(user_id_param) IN ('agent', 'admin'));
END;
$$;

-- 6. Fix RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Agents can create client profiles" ON public.profiles;
DROP POLICY IF EXISTS "Agents can update client profiles" ON public.profiles;
DROP POLICY IF EXISTS "Agents can view client profiles for operations" ON public.profiles;

-- Enable RLS on profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Agents can view client profiles" ON public.profiles
  FOR SELECT 
  USING (public.is_agent_or_admin(auth.uid()));

-- 7. Add transaction limits table for better security
CREATE TABLE IF NOT EXISTS public.transaction_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type text NOT NULL,
  user_role public.user_role NOT NULL,
  daily_limit numeric NOT NULL DEFAULT 500000,
  single_limit numeric NOT NULL DEFAULT 200000,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(operation_type, user_role)
);

-- Insert default transaction limits
INSERT INTO public.transaction_limits (operation_type, user_role, daily_limit, single_limit) VALUES
('transfer', 'user', 500000, 200000),
('withdrawal', 'user', 200000, 100000),
('deposit', 'user', 2000000, 500000),
('transfer', 'agent', 2000000, 1000000),
('withdrawal', 'agent', 2000000, 1000000),
('deposit', 'agent', 5000000, 2000000),
('transfer', 'admin', 10000000, 5000000),
('withdrawal', 'admin', 10000000, 5000000),
('deposit', 'admin', 20000000, 10000000)
ON CONFLICT (operation_type, user_role) DO NOTHING;

-- Enable RLS on transaction_limits
ALTER TABLE public.transaction_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage transaction limits" ON public.transaction_limits
  FOR ALL 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "All users can view transaction limits" ON public.transaction_limits
  FOR SELECT 
  TO authenticated
  USING (true);

-- 8. Create secure balance update function with role checks
CREATE OR REPLACE FUNCTION public.secure_increment_balance(
  target_user_id uuid, 
  amount numeric,
  operation_type text DEFAULT 'admin_credit',
  performed_by uuid DEFAULT auth.uid()
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance numeric;
  performer_role public.user_role;
  target_role public.user_role;
  limit_check numeric;
BEGIN
  -- Get performer role
  performer_role := public.get_user_role(performed_by);
  target_role := public.get_user_role(target_user_id);
  
  -- Security checks
  IF performer_role NOT IN ('admin', 'agent') AND target_user_id != performed_by THEN
    RAISE EXCEPTION 'Unauthorized: Only admins and agents can modify other users balances';
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
$$;

-- 9. Enable RLS on audit_logs and add policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 10. Add RLS policies for withdrawals table
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Users can create own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Agents can update withdrawal status" ON public.withdrawals;
DROP POLICY IF EXISTS "Agents can view client withdrawals" ON public.withdrawals;

CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own withdrawals" ON public.withdrawals
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Agents can view withdrawals" ON public.withdrawals
  FOR SELECT 
  USING (public.is_agent_or_admin(auth.uid()));

CREATE POLICY "Agents can update withdrawals" ON public.withdrawals
  FOR UPDATE 
  USING (public.is_agent_or_admin(auth.uid()));

-- 11. Add RLS policies for transfers table
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transfers" ON public.transfers
  FOR SELECT 
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can create own transfers" ON public.transfers
  FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Admins can view all transfers" ON public.transfers
  FOR SELECT 
  USING (public.is_admin(auth.uid()));

-- 12. Add RLS policies for recharges table
ALTER TABLE public.recharges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recharges" ON public.recharges
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recharges" ON public.recharges
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Agents can view client recharges" ON public.recharges
  FOR SELECT 
  USING (public.is_agent_or_admin(auth.uid()));

CREATE POLICY "Agents can create client recharges" ON public.recharges
  FOR INSERT 
  WITH CHECK (public.is_agent_or_admin(auth.uid()));
