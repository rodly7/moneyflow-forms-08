-- Fonction pour créer une session d'authentification avec PIN
CREATE OR REPLACE FUNCTION create_pin_session(user_phone text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_profile profiles%ROWTYPE;
  result json;
BEGIN
  -- Rechercher l'utilisateur par numéro de téléphone
  SELECT * INTO user_profile 
  FROM profiles 
  WHERE phone = user_phone;
  
  -- Vérifier si l'utilisateur existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur non trouvé avec ce numéro: %', user_phone;
  END IF;
  
  -- Retourner les informations de l'utilisateur pour la session
  result := json_build_object(
    'id', user_profile.id,
    'phone', user_profile.phone,
    'full_name', user_profile.full_name,
    'role', user_profile.role,
    'success', true
  );
  
  RETURN result;
END;
$$;