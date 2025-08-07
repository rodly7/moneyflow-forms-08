
-- Ajouter des colonnes pour gérer les statuts et l'accès des utilisateurs
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS banned_at timestamp with time zone NULL,
ADD COLUMN IF NOT EXISTS banned_reason text NULL;

-- Modifier l'enum user_role pour inclure sub_admin
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'sub_admin';

-- Créer une fonction pour vérifier si un utilisateur est banni
CREATE OR REPLACE FUNCTION public.is_user_banned(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT COALESCE(is_banned, false) FROM profiles WHERE id = user_id_param);
END;
$$;

-- Créer une fonction pour vérifier si un utilisateur est sous-admin
CREATE OR REPLACE FUNCTION public.is_sub_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT public.get_user_role(user_id_param) = 'sub_admin');
END;
$$;

-- Créer une fonction pour vérifier si un utilisateur est admin principal ou sous-admin
CREATE OR REPLACE FUNCTION public.is_admin_or_sub_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT public.get_user_role(user_id_param) IN ('admin', 'sub_admin'));
END;
$$;

-- Mettre à jour les politiques RLS pour tenir compte des nouveaux rôles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Admins and sub-admins can view all profiles" ON public.profiles
  FOR SELECT 
  USING (public.is_admin_or_sub_admin(auth.uid()));

CREATE POLICY "Admins and sub-admins can update all profiles" ON public.profiles
  FOR UPDATE 
  USING (public.is_admin_or_sub_admin(auth.uid()));

-- Ajouter une politique pour empêcher les utilisateurs bannis d'accéder
CREATE POLICY "Banned users cannot access" ON public.profiles
  FOR ALL 
  USING (NOT public.is_user_banned(auth.uid()));
