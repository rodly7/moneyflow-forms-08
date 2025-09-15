-- Secure function to fetch transfers including sender info for the current user
CREATE OR REPLACE FUNCTION public.get_transfers_with_sender()
RETURNS TABLE (
  id uuid,
  sender_id uuid,
  recipient_id uuid,
  recipient_phone text,
  amount numeric,
  fees numeric,
  currency text,
  status text,
  created_at timestamptz,
  sender_full_name text,
  sender_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user_phone text;
BEGIN
  -- Ensure caller is authenticated
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Get current user's phone
  SELECT phone INTO v_user_phone FROM public.profiles WHERE id = v_user_id;

  -- Return transfers sent by or received by the current user (by id or phone), with sender info
  RETURN QUERY
  SELECT 
    t.id,
    t.sender_id,
    t.recipient_id,
    t.recipient_phone,
    t.amount,
    t.fees,
    t.currency,
    t.status,
    t.created_at,
    p.full_name AS sender_full_name,
    p.phone AS sender_phone
  FROM public.transfers t
  LEFT JOIN public.profiles p ON p.id = t.sender_id
  WHERE 
    t.status = 'completed' AND (
      t.sender_id = v_user_id OR 
      t.recipient_id = v_user_id OR 
      (v_user_phone IS NOT NULL AND t.recipient_phone = v_user_phone)
    )
  ORDER BY t.created_at DESC;
END;
$$;