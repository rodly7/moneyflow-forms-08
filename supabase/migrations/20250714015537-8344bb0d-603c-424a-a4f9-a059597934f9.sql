-- Modifier la fonction process_password_reset pour gérer correctement les permissions
CREATE OR REPLACE FUNCTION public.process_password_reset(
  phone_param TEXT,
  full_name_param TEXT,
  new_password_param TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  
  -- Utiliser les fonctions Supabase intégrées pour mettre à jour le mot de passe
  -- Cette approche évite les problèmes de permissions avec auth.users
  PERFORM auth.update_user(found_user_id, json_build_object('password', new_password_param));
  
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
$$;