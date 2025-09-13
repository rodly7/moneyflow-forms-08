-- Create a SECURITY DEFINER function to safely search recipients by phone
-- Returns only non-sensitive fields and bypasses RLS for profiles
CREATE OR REPLACE FUNCTION public.find_recipient(search_term text)
RETURNS TABLE (
  id uuid,
  full_name text,
  phone text,
  country text,
  role public.user_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized text;
  last8 text;
BEGIN
  -- Normalize input to digits only
  normalized := regexp_replace(COALESCE(search_term, ''), '[^0-9]', '', 'g');
  IF length(normalized) = 0 THEN
    RETURN;
  END IF;

  -- Last 8 digits to handle local formats and leading zeroes
  last8 := right(normalized, 8);

  RETURN QUERY
  SELECT p.id, p.full_name, p.phone, p.country, p.role
  FROM public.profiles p
  WHERE 
    -- Exact normalized match
    regexp_replace(p.phone, '[^0-9]', '', 'g') = normalized
    OR 
    -- Match on last 8 digits
    right(regexp_replace(p.phone, '[^0-9]', '', 'g'), 8) = last8
  LIMIT 5;
END;
$$;

-- Ensure proper execute permissions
REVOKE ALL ON FUNCTION public.find_recipient(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_recipient(text) TO anon, authenticated;