
-- Remettre le compte +221773637752 comme administrateur principal
UPDATE public.profiles 
SET role = 'admin' 
WHERE phone = '+221773637752';

-- S'assurer que le compte n'est pas banni
UPDATE public.profiles 
SET is_banned = false, 
    banned_at = NULL, 
    banned_reason = NULL 
WHERE phone = '+221773637752';
