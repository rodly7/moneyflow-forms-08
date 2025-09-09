-- Vérifier et corriger les politiques RLS pour referral_codes
-- Permettre à tous les utilisateurs authentifiés de lire les codes de parrainage pour validation
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read referral codes for validation" 
ON public.referral_codes 
FOR SELECT 
TO authenticated 
USING (true);

-- Permettre aux utilisateurs de lire leurs propres codes de parrainage
CREATE POLICY IF NOT EXISTS "Users can view their own referral codes" 
ON public.referral_codes 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);