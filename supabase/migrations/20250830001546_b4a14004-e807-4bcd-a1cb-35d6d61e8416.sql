-- Ajouter la colonne PIN à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN pin_code TEXT DEFAULT NULL,
ADD COLUMN pin_created_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN requires_pin_setup BOOLEAN DEFAULT TRUE;

-- Mettre à jour les utilisateurs existants pour qu'ils créent un PIN
UPDATE public.profiles 
SET requires_pin_setup = TRUE 
WHERE pin_code IS NULL;

-- Fonction pour vérifier le PIN
CREATE OR REPLACE FUNCTION public.verify_user_pin(user_id_param UUID, pin_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id_param 
    AND pin_code = pin_param
  );
END;
$$;

-- Fonction pour créer/mettre à jour le PIN
CREATE OR REPLACE FUNCTION public.set_user_pin(user_id_param UUID, pin_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Vérifier que le PIN fait exactement 4 chiffres
  IF pin_param !~ '^[0-9]{4}$' THEN
    RAISE EXCEPTION 'Le PIN doit contenir exactement 4 chiffres';
  END IF;
  
  UPDATE profiles 
  SET 
    pin_code = pin_param,
    pin_created_at = NOW(),
    requires_pin_setup = FALSE
  WHERE id = user_id_param;
  
  RETURN FOUND;
END;
$$;