-- Ajouter une politique pour permettre aux merchants de voir les profils clients
CREATE POLICY "Merchants can view client profiles for withdrawals" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles merchant_profile 
    WHERE merchant_profile.id = auth.uid() 
    AND merchant_profile.role = 'merchant'
  )
);