-- Activer l'extension pgcrypto pour les fonctions de cryptage
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Correction de la fonction process_password_reset avec l'extension pgcrypto
CREATE OR REPLACE FUNCTION public.process_password_reset(phone_param text, full_name_param text, new_password_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  found_user_id UUID;
  found_phone TEXT;
  found_name TEXT;
  reset_request_id UUID;
  result JSON;
BEGIN
  -- Normaliser le numéro de téléphone (même logique que côté client)
  phone_param := REPLACE(REPLACE(phone_param, ' ', ''), '-', '');
  
  -- Chercher l'utilisateur par téléphone et nom avec comparaison exacte
  SELECT p.id, p.phone, p.full_name 
  INTO found_user_id, found_phone, found_name
  FROM profiles p
  WHERE REPLACE(REPLACE(p.phone, ' ', ''), '-', '') = phone_param
    AND LOWER(TRIM(p.full_name)) = LOWER(TRIM(full_name_param));
  
  -- Si l'utilisateur n'est pas trouvé
  IF found_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Aucun compte trouvé avec ce numéro de téléphone et ce nom. Vérifiez vos informations.'
    );
  END IF;
  
  -- Créer une demande de récupération
  INSERT INTO password_reset_requests (phone, full_name, user_id, new_password)
  VALUES (phone_param, full_name_param, found_user_id, new_password_param)
  RETURNING id INTO reset_request_id;
  
  -- Utiliser la requête directe pour mettre à jour le mot de passe dans auth.users
  UPDATE auth.users 
  SET 
    encrypted_password = crypt(new_password_param, gen_salt('bf')),
    updated_at = now()
  WHERE id = found_user_id;
  
  -- Marquer la demande comme vérifiée
  UPDATE password_reset_requests 
  SET status = 'completed', verified_at = now()
  WHERE id = reset_request_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Mot de passe mis à jour avec succès'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erreur lors de la mise à jour du mot de passe: ' || SQLERRM
    );
END;
$function$;