CREATE OR REPLACE FUNCTION public.get_received_transfers_with_sender(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  amount numeric,
  created_at timestamptz,
  status text,
  sender_id uuid,
  recipient_id uuid,
  recipient_phone text,
  sender_full_name text,
  sender_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text;
  v_clean text;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT phone INTO v_phone FROM public.profiles WHERE id = p_user_id;
  IF v_phone IS NULL THEN
    v_clean := NULL;
  ELSE
    v_clean := regexp_replace(v_phone, '[^0-9]', '', 'g');
  END IF;

  RETURN QUERY
  SELECT
    t.id,
    t.amount,
    t.created_at,
    t.status,
    t.sender_id,
    t.recipient_id,
    t.recipient_phone,
    COALESCE(p.full_name, p.phone) AS sender_full_name,
    p.phone AS sender_phone
  FROM public.transfers t
  LEFT JOIN public.profiles p ON p.id = t.sender_id
  WHERE (
      t.recipient_id = p_user_id
      OR (
        t.recipient_phone IS NOT NULL AND v_clean IS NOT NULL AND 
        (
          regexp_replace(t.recipient_phone, '[^0-9]', '', 'g') = v_clean
          OR right(regexp_replace(t.recipient_phone, '[^0-9]', '', 'g'), 9) = right(v_clean, 9)
        )
      )
    )
    AND (t.sender_id IS NULL OR t.sender_id <> p_user_id)
  ORDER BY t.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_received_transfers_with_sender(p_user_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_received_transfers_with_sender(p_user_id uuid) TO authenticated;