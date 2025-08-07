
-- Supprimer l'ancienne fonction increment_balance
DROP FUNCTION IF EXISTS public.increment_balance(uuid, numeric);

-- Créer d'abord la table audit_logs si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Activer RLS sur toutes les tables critiques
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes pour éviter les conflits
DROP POLICY IF EXISTS "Users can view their own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own transfers" ON public.transfers;
DROP POLICY IF EXISTS "Users can create transfers" ON public.transfers;
DROP POLICY IF EXISTS "Users can create withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Users can update their own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Users can view their own recharges" ON public.recharges;
DROP POLICY IF EXISTS "Users can create recharges" ON public.recharges;
DROP POLICY IF EXISTS "Users can view their own pending transfers" ON public.pending_transfers;
DROP POLICY IF EXISTS "Users can create pending transfers" ON public.pending_transfers;
DROP POLICY IF EXISTS "Agents can view their own data" ON public.agents;
DROP POLICY IF EXISTS "Agents can update their own data" ON public.agents;
DROP POLICY IF EXISTS "Agents can view client profiles for operations" ON public.profiles;
DROP POLICY IF EXISTS "Agents can view client withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Agents can update withdrawal status" ON public.withdrawals;
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;

-- Fonction de sécurité pour vérifier les rôles d'agent
CREATE OR REPLACE FUNCTION public.is_agent(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM agents 
    WHERE user_id = user_id_param 
    AND status = 'active'
  );
END;
$$;

-- Politiques RLS pour la table profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Agents can view client profiles for operations" ON public.profiles
  FOR SELECT USING (public.is_agent(auth.uid()) = true);

-- Politiques RLS pour la table transfers
CREATE POLICY "Users can view their own transfers" ON public.transfers
  FOR SELECT USING (auth.uid() = sender_id);

CREATE POLICY "Users can create transfers" ON public.transfers
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Politiques RLS pour la table withdrawals
CREATE POLICY "Users can view their own withdrawals" ON public.withdrawals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own withdrawals" ON public.withdrawals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Agents can view client withdrawals" ON public.withdrawals
  FOR SELECT USING (public.is_agent(auth.uid()) = true);

CREATE POLICY "Agents can update withdrawal status" ON public.withdrawals
  FOR UPDATE USING (public.is_agent(auth.uid()) = true);

-- Politiques RLS pour la table recharges
CREATE POLICY "Users can view their own recharges" ON public.recharges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create recharges" ON public.recharges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour la table pending_transfers
CREATE POLICY "Users can view their own pending transfers" ON public.pending_transfers
  FOR SELECT USING (auth.uid() = sender_id);

CREATE POLICY "Users can create pending transfers" ON public.pending_transfers
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Politiques RLS pour la table agents
CREATE POLICY "Agents can view their own data" ON public.agents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Agents can update their own data" ON public.agents
  FOR UPDATE USING (auth.uid() = user_id);

-- Créer la nouvelle fonction increment_balance avec type de retour numeric
CREATE OR REPLACE FUNCTION public.increment_balance(user_id uuid, amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance numeric;
BEGIN
  -- Vérifier que le montant n'est pas excessif
  IF ABS(amount) > 10000000 THEN
    RAISE EXCEPTION 'Amount too large: %', amount;
  END IF;
  
  -- Mettre à jour le solde et retourner le nouveau solde
  UPDATE profiles
  SET balance = balance + amount
  WHERE id = user_id
  RETURNING balance INTO new_balance;
  
  -- Vérifier que l'utilisateur existe
  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'User not found: %', user_id;
  END IF;
  
  -- Vérifier que le solde ne devient pas négatif
  IF new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient balance. Current: %, Requested: %', new_balance - amount, amount;
  END IF;
  
  RETURN new_balance;
END;
$$;

-- Politique pour les logs d'audit
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND phone = '+221773637752'
    )
  );
