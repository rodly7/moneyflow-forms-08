-- Drop existing function and create new secure find_recipient with correct return type
DROP FUNCTION IF EXISTS public.find_recipient(text);

-- Create a secure RPC to find a recipient by phone with robust normalization
CREATE OR REPLACE FUNCTION public.find_recipient(search_term text)
RETURNS TABLE(
  id uuid,
  full_name text,
  phone text,
  country text,
  role public.user_role,
  balance numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  normalized_input TEXT;
  digits_input TEXT;
  last8_input TEXT;
BEGIN
  -- Normalize input: remove spaces and dashes, keep plus optionally
  normalized_input := REPLACE(REPLACE(search_term, ' ', ''), '-', '');
  -- Keep only digits for last-digits matching
  digits_input := REGEXP_REPLACE(normalized_input, '[^0-9]', '', 'g');
  last8_input := RIGHT(digits_input, 8);

  -- Primary exact and normalized match
  RETURN QUERY
  SELECT p.id, p.full_name, p.phone, p.country, p.role, p.balance
  FROM public.profiles p
  WHERE
    -- strict equality
    REPLACE(REPLACE(p.phone, ' ', ''), '-', '') = normalized_input
    OR
    -- equality without plus signs
    REPLACE(REPLACE(REPLACE(p.phone, ' ', ''), '-', ''), '+', '') = REPLACE(REPLACE(normalized_input, '+', ''), ' ', '')
    OR
    -- match by last 8 digits (handles varying country code formatting)
    RIGHT(REGEXP_REPLACE(p.phone, '[^0-9]', '', 'g'), 8) = last8_input
  LIMIT 5;
END;
$$;