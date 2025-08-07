-- Créer une table pour les demandes de récupération de mot de passe
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  full_name TEXT NOT NULL,
  user_id UUID,
  new_password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de créer des demandes
CREATE POLICY "Anyone can create password reset requests" 
ON public.password_reset_requests 
FOR INSERT 
WITH CHECK (true);

-- Politique pour permettre aux admins de voir toutes les demandes
CREATE POLICY "Admins can view all password reset requests" 
ON public.password_reset_requests 
FOR ALL 
USING (is_admin_or_sub_admin(auth.uid()));

-- Fonction pour traiter la récupération de mot de passe
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
  -- Normaliser le numéro de téléphone
  phone_param := REPLACE(REPLACE(phone_param, ' ', ''), '-', '');
  
  -- Chercher l'utilisateur par téléphone et nom
  SELECT p.id, p.phone, p.full_name 
  INTO found_user_id, found_phone, found_name
  FROM profiles p
  WHERE REPLACE(REPLACE(p.phone, ' ', ''), '-', '') = phone_param
    AND LOWER(TRIM(p.full_name)) = LOWER(TRIM(full_name_param));
  
  -- Si l'utilisateur n'est pas trouvé
  IF found_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Aucun compte trouvé avec ce numéro de téléphone et ce nom'
    );
  END IF;
  
  -- Créer une demande de récupération
  INSERT INTO password_reset_requests (phone, full_name, user_id, new_password)
  VALUES (phone_param, full_name_param, found_user_id, new_password_param)
  RETURNING id INTO reset_request_id;
  
  -- Mettre à jour le mot de passe dans auth.users
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
$$;

-- Trigger pour nettoyer les anciennes demandes expirées
CREATE OR REPLACE FUNCTION public.cleanup_expired_password_resets()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM password_reset_requests 
  WHERE expires_at < now() AND status = 'pending';
  RETURN NULL;
END;
$$;

-- Créer un trigger qui s'exécute périodiquement
CREATE OR REPLACE FUNCTION public.handle_password_reset_cleanup()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM password_reset_requests 
  WHERE expires_at < now() AND status = 'pending';
END;
$$;