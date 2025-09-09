-- Permettre à tous les utilisateurs de lire les codes de parrainage pour validation
-- Ceci est nécessaire pour que la validation fonctionne pendant l'inscription
DROP POLICY IF EXISTS "Allow authenticated users to read referral codes for validation" ON public.referral_codes;
CREATE POLICY "Allow authenticated users to read referral codes for validation" 
ON public.referral_codes 
FOR SELECT 
USING (true);