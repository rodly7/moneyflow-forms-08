
-- Créer une fonction SQL atomique pour traiter les retraits agent
CREATE OR REPLACE FUNCTION public.process_withdrawal_transaction(
  p_client_id UUID,
  p_agent_id UUID,
  p_amount NUMERIC,
  p_commission NUMERIC
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;
