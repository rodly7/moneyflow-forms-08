-- Créer un code de parrainage pour tous les utilisateurs existants qui n'en ont pas
INSERT INTO public.referral_codes (user_id, referral_code)
SELECT 
    p.id,
    public.generate_referral_code()
FROM profiles p
LEFT JOIN referral_codes rc ON p.id = rc.user_id
WHERE rc.user_id IS NULL;