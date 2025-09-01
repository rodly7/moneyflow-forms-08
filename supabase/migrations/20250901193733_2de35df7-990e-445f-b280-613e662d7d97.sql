-- Remove the problematic merchant policy
DROP POLICY IF EXISTS "Merchants can view client profiles for withdrawals" ON public.profiles;