-- Supprimer l'ancienne fonction et recréer avec le bon type de retour
DROP FUNCTION IF EXISTS public.get_received_transfers_with_sender(uuid);

-- RPC sécurisée pour récupérer les transferts reçus avec infos expéditeur
CREATE OR REPLACE FUNCTION public.get_received_transfers_with_sender(p_user_id uuid)
RETURNS TABLE(
  id uuid,
  amount numeric,
  status text,
  created_at timestamptz,
  sender_full_name text,
  sender_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_phone text;
  v_phone_norm text;
BEGIN
  -- Récupérer le téléphone de l'utilisateur
  SELECT phone INTO v_phone FROM public.profiles WHERE id = p_user_id;
  IF v_phone IS NULL THEN
    RETURN;
  END IF;

  -- Normaliser le numéro (retirer espaces et tirets)
  v_phone_norm := REPLACE(REPLACE(v_phone, ' ', ''), '-', '');

  RETURN QUERY
  SELECT t.id, t.amount, t.status, t.created_at, s.full_name AS sender_full_name, s.phone AS sender_phone
  FROM public.transfers t
  LEFT JOIN public.profiles s ON s.id = t.sender_id
  WHERE (
    -- égalité stricte
    t.recipient_phone = v_phone OR
    -- égalité après normalisation
    REPLACE(REPLACE(t.recipient_phone, ' ', ''), '-', '') = v_phone_norm OR
    -- correspondance sur les 8 derniers chiffres
    RIGHT(REPLACE(REPLACE(t.recipient_phone, ' ', ''), '-', ''), 8) = RIGHT(v_phone_norm, 8)
  );
END;
$$;