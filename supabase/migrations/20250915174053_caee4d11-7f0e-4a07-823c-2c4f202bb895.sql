-- Créer les politiques RLS manquantes pour permettre aux clients de voir leurs retraits
CREATE POLICY "Users can view their own withdrawals" 
ON public.withdrawals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own withdrawals" 
ON public.withdrawals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Permettre aux agents de voir les retraits qu'ils traitent
CREATE POLICY "Agents can view withdrawals they process" 
ON public.withdrawals 
FOR SELECT 
USING (auth.uid() = agent_id);

CREATE POLICY "Agents can update withdrawals they process" 
ON public.withdrawals 
FOR UPDATE 
USING (auth.uid() = agent_id);

-- Permettre aux admins de tout voir et gérer
CREATE POLICY "Admins can manage all withdrawals" 
ON public.withdrawals 
FOR ALL 
USING (is_admin_or_sub_admin(auth.uid()));