
-- Create the missing is_verified_agent function
CREATE OR REPLACE FUNCTION public.is_verified_agent(user_id_param uuid)
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

-- Now we can safely create the withdrawal policies
DROP POLICY IF EXISTS "Agents can update withdrawal status" ON public.withdrawals;
DROP POLICY IF EXISTS "Agents can view client withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Agents can view client profiles for operations" ON public.profiles;

-- Create the agent policies with the function now available
CREATE POLICY "Agents can update withdrawal status" ON public.withdrawals
  FOR UPDATE USING (
    public.is_verified_agent(auth.uid()) = true 
    AND status IN ('pending', 'agent_pending')
  );

CREATE POLICY "Agents can view client withdrawals" ON public.withdrawals
  FOR SELECT USING (public.is_verified_agent(auth.uid()) = true);

CREATE POLICY "Agents can view client profiles for operations" ON public.profiles
  FOR SELECT USING (public.is_verified_agent(auth.uid()) = true);
