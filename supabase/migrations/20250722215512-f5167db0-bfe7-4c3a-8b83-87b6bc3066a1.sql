-- Créer la fonction pour incrémenter la commission de l'agent
CREATE OR REPLACE FUNCTION public.increment_agent_commission(
  agent_user_id uuid,
  commission_amount numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;